import os
import json
import tempfile
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, jsonify, session, send_file
from werkzeug.utils import secure_filename
import plotly.graph_objs as go
import plotly.utils
from scipy import stats
from sklearn.preprocessing import StandardScaler
import io
import base64
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change in production

# Configuration
UPLOAD_FOLDER = 'temp_uploads'
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_dataframe_info(df):
    """Get comprehensive DataFrame information"""
    info = {
        'shape': df.shape,
        'dtypes': df.dtypes.to_dict(),
        'memory_usage': df.memory_usage(deep=True).sum(),
        'null_counts': df.isnull().sum().to_dict(),
        'null_percentages': (df.isnull().sum() / len(df) * 100).to_dict(),
        'unique_counts': df.nunique().to_dict(),
        'duplicate_rows': df.duplicated().sum(),
        'columns': list(df.columns)
    }
    return info

def get_summary_statistics(df):
    """Get comprehensive summary statistics"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    
    stats_data = {}
    
    # Numerical columns statistics
    if len(numeric_cols) > 0:
        numeric_stats = df[numeric_cols].describe()
        stats_data['numerical'] = {
            'columns': list(numeric_cols),
            'descriptive': numeric_stats.to_dict(),
            'skewness': df[numeric_cols].skew().to_dict(),
            'kurtosis': df[numeric_cols].kurtosis().to_dict()
        }
    
    # Categorical columns statistics
    if len(categorical_cols) > 0:
        categorical_stats = {}
        for col in categorical_cols:
            value_counts = df[col].value_counts()
            categorical_stats[col] = {
                'value_counts': value_counts.head(10).to_dict(),
                'unique_count': df[col].nunique(),
                'most_common': df[col].mode().iloc[0] if not df[col].mode().empty else None
            }
        stats_data['categorical'] = categorical_stats
    
    return stats_data

def detect_outliers(df, method='iqr'):
    """Detect outliers using IQR or Z-score method"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    outliers_data = {}
    
    for col in numeric_cols:
        if method == 'iqr':
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
        else:  # z-score
            z_scores = np.abs(stats.zscore(df[col].dropna()))
            outliers = df[z_scores > 3]
        
        outliers_data[col] = {
            'count': len(outliers),
            'indices': outliers.index.tolist(),
            'values': outliers[col].tolist(),
            'lower_bound': lower_bound if method == 'iqr' else None,
            'upper_bound': upper_bound if method == 'iqr' else None
        }
    
    return outliers_data

def run_normality_tests(df):
    """Run normality tests on numerical columns"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    normality_results = {}
    
    for col in numeric_cols:
        data = df[col].dropna()
        if len(data) < 3:
            continue
            
        # Shapiro-Wilk test
        try:
            shapiro_stat, shapiro_p = stats.shapiro(data)
            normality_results[col] = {
                'shapiro_wilk': {
                    'statistic': float(shapiro_stat),
                    'p_value': float(shapiro_p),
                    'is_normal': shapiro_p > 0.05
                }
            }
        except:
            normality_results[col] = {'shapiro_wilk': {'error': 'Test failed'}}
    
    return normality_results

def get_correlations(df, method='pearson'):
    """Calculate correlations between numerical columns"""
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty:
        return {}
    
    corr_matrix = numeric_df.corr(method=method)
    return corr_matrix.to_dict()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not supported'}), 400
    
    try:
        # Read file based on extension
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file, encoding='utf-8')
        else:
            df = pd.read_excel(file)
        
        # Store DataFrame in session (for small datasets)
        if len(df) < 10000:  # Store in session if < 10k rows
            session['df_data'] = df.to_dict()
            session['df_columns'] = list(df.columns)
            session['df_shape'] = df.shape
        else:
            # For larger datasets, save to temp file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pkl')
            df.to_pickle(temp_file.name)
            session['temp_file'] = temp_file.name
        
        # Get basic info
        info = get_dataframe_info(df)
        
        # Get preview data
        preview = {
            'head': df.head(10).to_dict('records'),
            'tail': df.tail(10).to_dict('records')
        }
        
        return jsonify({
            'success': True,
            'info': info,
            'preview': preview,
            'message': f'File uploaded successfully. Shape: {df.shape}'
        })
        
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@app.route('/analyze', methods=['POST'])
def analyze_data():
    try:
        # Retrieve DataFrame from session
        if 'df_data' in session:
            df = pd.DataFrame.from_dict(session['df_data'])
        elif 'temp_file' in session:
            df = pd.read_pickle(session['temp_file'])
        else:
            return jsonify({'error': 'No data available for analysis'}), 400
        
        # Get summary statistics
        summary_stats = get_summary_statistics(df)
        
        # Detect outliers
        outliers = detect_outliers(df)
        
        # Run normality tests
        normality_tests = run_normality_tests(df)
        
        # Get correlations
        correlations = get_correlations(df)
        
        return jsonify({
            'success': True,
            'summary_statistics': summary_stats,
            'outliers': outliers,
            'normality_tests': normality_tests,
            'correlations': correlations
        })
        
    except Exception as e:
        return jsonify({'error': f'Error during analysis: {str(e)}'}), 500

@app.route('/visualize', methods=['POST'])
def create_visualization():
    try:
        data = request.get_json()
        chart_type = data.get('chart_type')
        columns = data.get('columns', [])
        
        # Retrieve DataFrame from session
        if 'df_data' in session:
            df = pd.DataFrame.from_dict(session['df_data'])
        elif 'temp_file' in session:
            df = pd.read_pickle(session['temp_file'])
        else:
            return jsonify({'error': 'No data available for visualization'}), 400
        
        if chart_type == 'histogram':
            fig = go.Figure()
            for col in columns:
                fig.add_trace(go.Histogram(x=df[col], name=col, nbinsx=30))
            fig.update_layout(title=f'Histogram of {", ".join(columns)}', barmode='overlay')
            
        elif chart_type == 'boxplot':
            fig = go.Figure()
            for col in columns:
                fig.add_trace(go.Box(y=df[col], name=col))
            fig.update_layout(title=f'Box Plot of {", ".join(columns)}')
            
        elif chart_type == 'scatter':
            if len(columns) >= 2:
                fig = go.Figure(data=go.Scatter(x=df[columns[0]], y=df[columns[1]], mode='markers'))
                fig.update_layout(title=f'Scatter Plot: {columns[0]} vs {columns[1]}')
            else:
                return jsonify({'error': 'Scatter plot requires at least 2 columns'}), 400
                
        elif chart_type == 'correlation_heatmap':
            numeric_df = df[columns].select_dtypes(include=[np.number])
            corr_matrix = numeric_df.corr()
            fig = go.Figure(data=go.Heatmap(z=corr_matrix.values, x=corr_matrix.columns, y=corr_matrix.index))
            fig.update_layout(title='Correlation Heatmap')
            
        else:
            return jsonify({'error': 'Unsupported chart type'}), 400
        
        # Convert plot to JSON
        plot_json = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
        return jsonify({'success': True, 'plot': plot_json})
        
    except Exception as e:
        return jsonify({'error': f'Error creating visualization: {str(e)}'}), 500

@app.route('/clean_data', methods=['POST'])
def clean_data():
    try:
        data = request.get_json()
        action = data.get('action')
        
        # Retrieve DataFrame from session
        if 'df_data' in session:
            df = pd.DataFrame.from_dict(session['df_data'])
        elif 'temp_file' in session:
            df = pd.read_pickle(session['temp_file'])
        else:
            return jsonify({'error': 'No data available for cleaning'}), 400
        
        original_shape = df.shape
        
        if action == 'drop_missing':
            df = df.dropna()
        elif action == 'fill_missing_mean':
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        elif action == 'fill_missing_median':
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        elif action == 'drop_duplicates':
            df = df.drop_duplicates()
        
        # Update session
        if len(df) < 10000:
            session['df_data'] = df.to_dict()
            session['df_shape'] = df.shape
        else:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pkl')
            df.to_pickle(temp_file.name)
            session['temp_file'] = temp_file.name
        
        return jsonify({
            'success': True,
            'message': f'Data cleaned. Shape changed from {original_shape} to {df.shape}',
            'new_shape': df.shape
        })
        
    except Exception as e:
        return jsonify({'error': f'Error cleaning data: {str(e)}'}), 500

@app.route('/generate_report', methods=['POST'])
def generate_report():
    try:
        # Retrieve DataFrame from session
        if 'df_data' in session:
            df = pd.DataFrame.from_dict(session['df_data'])
        elif 'temp_file' in session:
            df = pd.read_pickle(session['temp_file'])
        else:
            return jsonify({'error': 'No data available for report generation'}), 400
        
        # Generate comprehensive report
        info = get_dataframe_info(df)
        summary_stats = get_summary_statistics(df)
        outliers = detect_outliers(df)
        normality_tests = run_normality_tests(df)
        correlations = get_correlations(df)
        
        # Create HTML report
        report_html = render_template('report_template.html',
                                   df=df,
                                   info=info,
                                   summary_stats=summary_stats,
                                   outliers=outliers,
                                   normality_tests=normality_tests,
                                   correlations=correlations,
                                   timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        
        return jsonify({
            'success': True,
            'report_html': report_html
        })
        
    except Exception as e:
        return jsonify({'error': f'Error generating report: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
