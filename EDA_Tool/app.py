import os
import json
import tempfile
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
import plotly.utils
from plotly.subplots import make_subplots
from flask import Flask, render_template, request, jsonify, session, send_file
from werkzeug.utils import secure_filename
from scipy import stats
from sklearn.preprocessing import StandardScaler
import io
import base64
from datetime import datetime
import warnings

# Import our new modules
from config import Config
from services.gemini_service import GeminiService

warnings.filterwarnings('ignore')

app = Flask(__name__)
app.secret_key = Config.SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH
app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Gemini service if API key is available
gemini_service = None
if Config.validate_config():
    try:
        gemini_service = GeminiService()
        print("Gemini service initialized successfully")
    except Exception as e:
        print(f"Failed to initialize Gemini service: {str(e)}")
        gemini_service = None

# Supported file extensions
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_numpy_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Series):
        return obj.tolist()
    elif isinstance(obj, pd.DataFrame):
        return obj.to_dict()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    else:
        return obj

def load_data(file_path, file_extension):
    """Load data from file based on extension"""
    try:
        if file_extension == 'csv':
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252']
            for encoding in encodings:
                try:
                    df = pd.read_csv(file_path, encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                df = pd.read_csv(file_path, encoding='utf-8', errors='ignore')
        else:
            df = pd.read_excel(file_path, engine='openpyxl' if file_extension == 'xlsx' else 'xlrd')
        
        return df
    except Exception as e:
        raise Exception(f"Error loading file: {str(e)}")

def get_data_info(df):
    """Get comprehensive data information"""
    info = {
        'shape': df.shape,
        'columns': list(df.columns),
        'dtypes': df.dtypes.astype(str).to_dict(),
        'memory_usage': df.memory_usage(deep=True).sum(),
        'null_counts': df.isnull().sum().to_dict(),
        'null_percentages': (df.isnull().sum() / len(df) * 100).to_dict(),
        'duplicate_rows': df.duplicated().sum(),
        'numerical_columns': list(df.select_dtypes(include=[np.number]).columns),
        'categorical_columns': list(df.select_dtypes(include=['object', 'category']).columns),
        'datetime_columns': list(df.select_dtypes(include=['datetime64']).columns)
    }
    return convert_numpy_types(info)

def get_descriptive_stats(df):
    """Get descriptive statistics for numerical columns"""
    numerical_cols = df.select_dtypes(include=[np.number])
    if numerical_cols.empty:
        return {}
    
    stats_dict = {}
    for col in numerical_cols.columns:
        col_stats = df[col].describe()
        stats_dict[col] = {
            'count': col_stats['count'],
            'mean': col_stats['mean'],
            'std': col_stats['std'],
            'min': col_stats['min'],
            '25%': col_stats['25%'],
            '50%': col_stats['50%'],
            '75%': col_stats['75%'],
            'max': col_stats['max'],
            'skewness': df[col].skew(),
            'kurtosis': df[col].kurtosis()
        }
    
    return convert_numpy_types(stats_dict)

def get_categorical_stats(df):
    """Get statistics for categorical columns"""
    categorical_cols = df.select_dtypes(include=['object', 'category'])
    if categorical_cols.empty:
        return {}
    
    stats_dict = {}
    for col in categorical_cols.columns:
        value_counts = df[col].value_counts()
        stats_dict[col] = {
            'unique_count': df[col].nunique(),
            'most_common': value_counts.head(5).to_dict(),
            'least_common': value_counts.tail(5).to_dict()
        }
    
    return convert_numpy_types(stats_dict)

def detect_outliers(df, method='iqr'):
    """Detect outliers using IQR or Z-score method"""
    numerical_cols = df.select_dtypes(include=[np.number])
    outliers = {}
    
    for col in numerical_cols.columns:
        if method == 'iqr':
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            outlier_indices = df[(df[col] < lower_bound) | (df[col] > upper_bound)].index.tolist()
        else:  # z-score
            z_scores = np.abs(stats.zscore(df[col].dropna()))
            outlier_indices = df[z_scores > 3].index.tolist()
        
        outliers[col] = {
            'count': len(outlier_indices),
            'indices': outlier_indices,
            'values': df.loc[outlier_indices, col].tolist() if outlier_indices else []
        }
    
    return convert_numpy_types(outliers)

def run_normality_tests(df):
    """Run normality tests on numerical columns"""
    numerical_cols = df.select_dtypes(include=[np.number])
    normality_results = {}
    
    for col in numerical_cols.columns:
        col_data = df[col].dropna()
        if len(col_data) < 3:
            continue
            
        try:
            # Shapiro-Wilk test
            shapiro_stat, shapiro_p = stats.shapiro(col_data)
            
            # Kolmogorov-Smirnov test
            ks_stat, ks_p = stats.kstest(col_data, 'norm', args=(col_data.mean(), col_data.std()))
            
            normality_results[col] = {
                'shapiro_wilk': {
                    'statistic': shapiro_stat,
                    'p_value': shapiro_p,
                    'is_normal': shapiro_p > 0.05
                },
                'kolmogorov_smirnov': {
                    'statistic': ks_stat,
                    'p_value': ks_p,
                    'is_normal': ks_p > 0.05
                }
            }
        except Exception as e:
            normality_results[col] = {'error': str(e)}
    
    return convert_numpy_types(normality_results)

def get_correlations(df):
    """Calculate correlations between numerical columns"""
    numerical_cols = df.select_dtypes(include=[np.number])
    if numerical_cols.empty or len(numerical_cols.columns) < 2:
        return {}
    
    # Pearson correlation
    pearson_corr = numerical_cols.corr(method='pearson')
    
    # Spearman correlation
    spearman_corr = numerical_cols.corr(method='spearman')
    
    return convert_numpy_types({
        'pearson': pearson_corr.to_dict(),
        'spearman': spearman_corr.to_dict()
    })

def create_histogram(df, column, bins=30):
    """Create histogram for a numerical column"""
    fig = px.histogram(df, x=column, nbins=bins, title=f'Distribution of {column}')
    fig.update_layout(
        xaxis_title=column,
        yaxis_title='Frequency',
        showlegend=False
    )
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

def create_boxplot(df, column):
    """Create boxplot for a numerical column"""
    fig = px.box(df, y=column, title=f'Boxplot of {column}')
    fig.update_layout(
        yaxis_title=column,
        showlegend=False
    )
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

def create_scatter_plot(df, x_col, y_col):
    """Create scatter plot for two numerical columns"""
    fig = px.scatter(df, x=x_col, y=y_col, title=f'{x_col} vs {y_col}')
    fig.update_layout(
        xaxis_title=x_col,
        yaxis_title=y_col
    )
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

def create_correlation_heatmap(df):
    """Create correlation heatmap"""
    numerical_cols = df.select_dtypes(include=[np.number])
    if numerical_cols.empty or len(numerical_cols.columns) < 2:
        return None
    
    corr_matrix = numerical_cols.corr()
    fig = px.imshow(
        corr_matrix,
        title='Correlation Heatmap',
        color_continuous_scale='RdBu',
        aspect='auto'
    )
    fig.update_layout(
        xaxis_title='Features',
        yaxis_title='Features'
    )
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

def create_bar_chart(df, column):
    """Create bar chart for categorical column"""
    value_counts = df[column].value_counts().head(20)  # Limit to top 20
    fig = px.bar(
        x=value_counts.index,
        y=value_counts.values,
        title=f'Value Counts for {column}'
    )
    fig.update_layout(
        xaxis_title=column,
        yaxis_title='Count'
    )
    return json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # Read the file
            if file.filename.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file)
            else:
                return jsonify({'error': 'Unsupported file format'}), 400
            
            # Store the full DataFrame in session
            session['data'] = df.to_dict('records')
            session['full_data'] = df.to_dict('records')  # Store full data separately
            
            # Generate data info
            data_info = get_data_info(df)
            
            # Generate preview data (head and tail) for display
            preview_head = df.head(10).to_dict('records')
            preview_tail = df.tail(10).to_dict('records')
            
            # Convert preview data to the expected format
            preview_head_formatted = {}
            preview_tail_formatted = {}
            
            for col in df.columns:
                preview_head_formatted[col] = {}
                preview_tail_formatted[col] = {}
                
                for i, row in enumerate(preview_head):
                    preview_head_formatted[col][i] = row[col]
                
                for i, row in enumerate(preview_tail):
                    preview_tail_formatted[col][i] = row[col]
            
            response_data = {
                'success': True,
                'message': 'File uploaded successfully',
                'data_info': data_info,
                'preview_head': preview_head_formatted,
                'preview_tail': preview_tail_formatted,
                'full_data': df.to_dict('records')  # Include full data in response
            }
            
            return jsonify(response_data)
        else:
            return jsonify({'error': 'File type not allowed'}), 400
            
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/analyze', methods=['POST'])
def analyze_data():
    try:
        if 'data' not in session:
            return jsonify({'error': 'No data available for analysis'}), 400
        
        data = session['data']
        df = pd.DataFrame(data)
        
        # Convert boolean columns to string to avoid JSON serialization issues
        for col in df.columns:
            if df[col].dtype == 'bool':
                df[col] = df[col].astype(str)
        
        # Perform analysis
        analysis_results = {}
        
        # Basic statistics
        analysis_results['basic_stats'] = df.describe().to_dict()
        
        # Data types
        analysis_results['dtypes'] = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        # Missing values
        analysis_results['missing_values'] = df.isnull().sum().to_dict()
        
        # Unique values for categorical columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        analysis_results['unique_values'] = {}
        for col in categorical_cols:
            unique_vals = df[col].unique()
            # Convert numpy types to native Python types
            analysis_results['unique_values'][col] = [str(val) if pd.isna(val) else val for val in unique_vals]
        
        # Numerical columns analysis
        numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
        analysis_results['numerical_analysis'] = {}
        
        for col in numerical_cols:
            col_data = df[col].dropna()
            if len(col_data) > 0:
                analysis_results['numerical_analysis'][col] = {
                    'mean': float(col_data.mean()) if not pd.isna(col_data.mean()) else None,
                    'median': float(col_data.median()) if not pd.isna(col_data.median()) else None,
                    'std': float(col_data.std()) if not pd.isna(col_data.std()) else None,
                    'min': float(col_data.min()) if not pd.isna(col_data.min()) else None,
                    'max': float(col_data.max()) if not pd.isna(col_data.max()) else None,
                    'skewness': float(col_data.skew()) if not pd.isna(col_data.skew()) else None,
                    'kurtosis': float(col_data.kurtosis()) if not pd.isna(col_data.kurtosis()) else None
                }
        
        # Correlation matrix for numerical columns
        if len(numerical_cols) > 1:
            corr_matrix = df[numerical_cols].corr()
            # Convert correlation matrix to serializable format
            analysis_results['correlation'] = {}
            for i, col1 in enumerate(numerical_cols):
                analysis_results['correlation'][col1] = {}
                for j, col2 in enumerate(numerical_cols):
                    corr_val = corr_matrix.iloc[i, j]
                    analysis_results['correlation'][col1][col2] = float(corr_val) if not pd.isna(corr_val) else None
        
        return jsonify(analysis_results)
        
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/visualize', methods=['POST'])
def visualize_data():
    try:
        if 'data' not in session:
            return jsonify({'error': 'No data available for visualization'}), 400
        
        data = session['data']
        df = pd.DataFrame(data)
        
        request_data = request.get_json()
        chart_type = request_data.get('chart_type')
        columns = request_data.get('columns', [])
        
        print(f'Visualization request: {chart_type} with columns {columns}')
        print(f'DataFrame shape: {df.shape}')
        
        if not chart_type:
            return jsonify({'error': 'Chart type not specified'}), 400
        
        # Create chart data based on type using FULL dataset
        if chart_type == 'histogram':
            plot_data = {
                'x': df[columns[0]].tolist(),
                'type': 'histogram',
                'name': columns[0],
                'marker': {'color': '#f59e0b'},
                'nbinsx': min(30, int(np.sqrt(len(df))))
            }
            layout = {
                'title': f'Histogram: {columns[0]} ({len(df)} data points)',
                'xaxis': {'title': columns[0]},
                'yaxis': {'title': 'Frequency'}
            }
            
        elif chart_type == 'boxplot':
            plot_data = {
                'y': df[columns[0]].tolist(),
                'type': 'box',
                'name': columns[0],
                'marker': {'color': '#f59e0b'},
                'boxpoints': 'outliers'
            }
            layout = {
                'title': f'Box Plot: {columns[0]} ({len(df)} data points)',
                'yaxis': {'title': columns[0]}
            }
            
        elif chart_type == 'scatter':
            plot_data = {
                'x': df[columns[0]].tolist(),
                'y': df[columns[1]].tolist(),
                'type': 'scatter',
                'mode': 'markers',
                'name': f'{columns[0]} vs {columns[1]}',
                'marker': {
                    'color': '#f59e0b',
                    'size': max(4, min(8, 1000 // len(df))),
                    'opacity': 0.7
                }
            }
            layout = {
                'title': f'Scatter Plot: {columns[0]} vs {columns[1]} ({len(df)} points)',
                'xaxis': {'title': columns[0]},
                'yaxis': {'title': columns[1]}
            }
            
        elif chart_type == 'correlation':
            # Get correlation matrix from data_info if available
            corr_matrix = df[df.select_dtypes(include=[np.number]).columns].corr()
            x_labels = corr_matrix.columns.tolist()
            y_labels = corr_matrix.columns.tolist()
            z_values = corr_matrix.values.tolist()
            
            plot_data = {
                'z': z_values,
                'x': x_labels,
                'y': y_labels,
                'type': 'heatmap',
                'colorscale': 'RdBu',
                'zmid': 0
            }
            layout = {
                'title': f'Correlation Heatmap ({len(df)} data points)'
            }
            
        elif chart_type == 'bar':
            # Count occurrences for categorical data
            value_counts = df[columns[0]].value_counts().to_dict()
            plot_data = {
                'x': list(value_counts.keys()),
                'y': list(value_counts.values()),
                'type': 'bar',
                'marker': {'color': '#f59e0b'}
            }
            layout = {
                'title': f'Bar Chart: {columns[0]} ({len(df)} data points)',
                'xaxis': {'title': columns[0]},
                'yaxis': {'title': 'Count'}
            }
        
        # Common layout properties
        layout.update({
            'font': {'color': '#f8fafc'},
            'paper_bgcolor': '#1e293b',
            'plot_bgcolor': '#1e293b',
            'xaxis': layout.get('xaxis', {}),
            'yaxis': layout.get('yaxis', {})
        })
        
        # Update axis colors for all charts
        if 'xaxis' in layout:
            layout['xaxis'].update({'gridcolor': '#334155', 'color': '#cbd5e1'})
        if 'yaxis' in layout:
            layout['yaxis'].update({'gridcolor': '#334155', 'color': '#cbd5e1'})
        
        return jsonify({
            'success': True,
            'chart_data': {
                'data': [plot_data],
                'layout': layout
            }
        })
        
    except Exception as e:
        print(f"Visualization error: {str(e)}")
        return jsonify({'error': f'Visualization failed: {str(e)}'}), 500

@app.route('/generate_report', methods=['POST'])
def generate_report():
    try:
        if 'data' not in session:
            return jsonify({'error': 'No data uploaded'}), 400
        
        # Reconstruct DataFrame from session
        df = pd.DataFrame.from_dict(session['data'])
        
        # Get all analysis data
        data_info = get_data_info(df)
        descriptive_stats = get_descriptive_stats(df)
        categorical_stats = get_categorical_stats(df)
        outliers = detect_outliers(df)
        normality_tests = run_normality_tests(df)
        correlations = get_correlations(df)
        
        # Generate HTML report
        report_html = render_template(
            'report_template.html',
            data_info=data_info,
            descriptive_stats=descriptive_stats,
            categorical_stats=categorical_stats,
            outliers=outliers,
            normality_tests=normality_tests,
            correlations=correlations,
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )
        
        return jsonify({
            'success': True,
            'report_html': report_html
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download_report', methods=['POST'])
def download_report():
    try:
        if 'data' not in session:
            return jsonify({'error': 'No data uploaded'}), 400
        
        # Reconstruct DataFrame from session
        df = pd.DataFrame.from_dict(session['data'])
        
        # Get all analysis data
        data_info = get_data_info(df)
        descriptive_stats = get_descriptive_stats(df)
        categorical_stats = get_categorical_stats(df)
        outliers = detect_outliers(df)
        normality_tests = run_normality_tests(df)
        correlations = get_correlations(df)
        
        # Generate HTML report
        report_html = render_template(
            'report_template.html',
            data_info=data_info,
            descriptive_stats=descriptive_stats,
            categorical_stats=categorical_stats,
            outliers=outliers,
            normality_tests=normality_tests,
            correlations=correlations,
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )
        
        # Create a temporary file for download
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as tmp_file:
            tmp_file.write(report_html)
            tmp_path = tmp_file.name
        
        return send_file(
            tmp_path,
            as_attachment=True,
            download_name=f'eda_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.html',
            mimetype='text/html'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/clean_data', methods=['POST'])
def clean_data():
    try:
        if 'data' not in session:
            return jsonify({'error': 'No data uploaded'}), 400
        
        data = request.get_json()
        action = data.get('action')
        columns = data.get('columns', [])
        
        # Reconstruct DataFrame from session
        df = pd.DataFrame.from_dict(session['data'])
        
        if action == 'drop_missing':
            if columns:
                df = df.dropna(subset=columns)
            else:
                df = df.dropna()
        elif action == 'fill_missing_mean':
            for col in columns:
                if col in df.select_dtypes(include=[np.number]).columns:
                    df[col] = df[col].fillna(df[col].mean())
        elif action == 'fill_missing_median':
            for col in columns:
                if col in df.select_dtypes(include=[np.number]).columns:
                    df[col] = df[col].fillna(df[col].median())
        elif action == 'fill_missing_mode':
            for col in columns:
                if col in df.select_dtypes(include=['object', 'category']).columns:
                    df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown')
        elif action == 'drop_duplicates':
            df = df.drop_duplicates()
        elif action == 'remove_outliers':
            for col in columns:
                if col in df.select_dtypes(include=[np.number]).columns:
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
        
        # Update session - convert to native Python types
        session['data'] = convert_numpy_types(df.to_dict())
        session['columns'] = list(df.columns)
        session['shape'] = df.shape
        
        # Get updated data info
        data_info = get_data_info(df)
        
        return jsonify({
            'success': True,
            'message': f'Data cleaned successfully. New shape: {df.shape}',
            'data_info': data_info
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_cleaning_recommendations', methods=['POST'])
def get_cleaning_recommendations():
    """Get LLM-based data cleaning recommendations"""
    try:
        if 'data' not in session:
            return jsonify({'error': 'No data available for analysis'}), 400
        
        if not gemini_service:
            return jsonify({'error': 'LLM service not available. Please check API configuration.'}), 503
        
        # Get comprehensive data statistics
        data = session['data']
        df = pd.DataFrame(data)
        
        # Collect all available statistics
        data_stats = {
            'data_info': get_data_info(df),
            'descriptive_stats': get_descriptive_stats(df),
            'categorical_stats': get_categorical_stats(df),
            'outliers': detect_outliers(df),
            'normality_tests': run_normality_tests(df),
            'correlations': get_correlations(df),
            'missing_values': df.isnull().sum().to_dict(),
            'data_types': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'shape': df.shape,
            'memory_usage': df.memory_usage(deep=True).sum()
        }
        
        # Get recommendations from Gemini
        recommendations = gemini_service.get_cleaning_recommendations(data_stats)
        
        if recommendations:
            # Store recommendations in session for reuse
            session['cleaning_recommendations'] = recommendations
            
            return jsonify({
                'success': True,
                'recommendations': recommendations
            })
        else:
            return jsonify({'error': 'Failed to generate cleaning recommendations'}), 500
            
    except Exception as e:
        print(f"Error getting cleaning recommendations: {str(e)}")
        return jsonify({'error': f'Failed to get recommendations: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
