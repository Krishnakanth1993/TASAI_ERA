import json
import os
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
import sys
import boto3
from botocore.exceptions import ClientError

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

warnings.filterwarnings('ignore')

# Initialize Flask app
app = Flask(__name__)

# Lambda-specific configuration
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB limit

# For Lambda, we'll use /tmp for uploads
app.config['UPLOAD_FOLDER'] = '/tmp'

# Supported file extensions
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_gemini_api_key():
    """Get Gemini API key from AWS Secrets Manager"""
    try:
        # Try to get from environment variable first (for local testing)
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key:
            return api_key
        
        # If not in environment, try AWS Secrets Manager
        secrets_client = boto3.client('secretsmanager')
        secret_name = os.environ.get('GEMINI_SECRET_NAME', 'prod/gemini/api_key')
        
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret = json.loads(response['SecretString'])
        return secret.get('api_key')
    except Exception as e:
        print(f"Error getting Gemini API key: {e}")
        return None

# Initialize Gemini service
gemini_service = None
try:
    from services.gemini_service import GeminiService
    api_key = get_gemini_api_key()
    if api_key:
        # Temporarily set the API key in environment for the service
        os.environ['GEMINI_API_KEY'] = api_key
        gemini_service = GeminiService()
        print("✅ Gemini service initialized successfully")
    else:
        print("⚠️  Gemini API key not found - LLM features disabled")
        gemini_service = None
except Exception as e:
    print(f"⚠️  Failed to initialize Gemini service: {str(e)}")
    gemini_service = None

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, bool):
        return bool(obj)
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
    try:
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            return {}
        
        stats = df[numeric_cols].describe()
        
        # Convert to dictionary and handle NaN values
        stats_dict = {}
        for col in numeric_cols:
            col_stats = {}
            for metric in ['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max']:
                value = stats.loc[metric, col]
                if pd.isna(value):
                    col_stats[metric] = 0 if metric == 'count' else 'N/A'
                else:
                    if metric == 'count':
                        col_stats[metric] = int(value)
                    else:
                        col_stats[metric] = float(value)
            stats_dict[col] = col_stats
        
        return stats_dict
    except Exception as e:
        print(f"Error in get_descriptive_stats: {e}")
        return {}

def get_categorical_stats(df):
    """Get statistics for categorical columns"""
    try:
        categorical_cols = df.select_dtypes(include=['object', 'string']).columns
        stats = {}
        
        for col in categorical_cols:
            col_stats = {}
            col_stats['count'] = int(df[col].count())
            col_stats['unique_count'] = int(df[col].nunique())
            col_stats['missing_count'] = int(df[col].isnull().sum())
            
            # Calculate missing percentage safely
            total_count = len(df)
            if total_count > 0:
                missing_percentage = (col_stats['missing_count'] / total_count) * 100
                col_stats['missing_percentage'] = round(missing_percentage, 2)
            else:
                col_stats['missing_percentage'] = 0
            
            # Get unique values (limit to first 20)
            unique_vals = df[col].dropna().unique()
            col_stats['unique_values'] = unique_vals[:20].tolist()
            
            stats[col] = col_stats
        
        return stats
    except Exception as e:
        print(f"Error in get_categorical_stats: {e}")
        return {}

def detect_outliers(df):
    """Detect outliers using IQR method"""
    try:
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        outliers_data = {}
        
        for col in numeric_cols:
            try:
                # Remove NaN values for calculation
                clean_data = df[col].dropna()
                if len(clean_data) < 4:  # Need at least 4 values for quartiles
                    outliers_data[col] = {
                        'count': 0,
                        'method': 'IQR',
                        'q1': 'N/A',
                        'q3': 'N/A',
                        'iqr': 'N/A',
                        'lower_bound': 'N/A',
                        'upper_bound': 'N/A',
                        'outlier_percentage': 0
                    }
                    continue
                
                Q1 = float(clean_data.quantile(0.25))
                Q3 = float(clean_data.quantile(0.75))
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                # Count outliers
                outlier_mask = (df[col] < lower_bound) | (df[col] > upper_bound)
                outlier_count = int(outlier_mask.sum())
                
                # Calculate percentage safely
                total_count = len(df[col])
                if total_count > 0:
                    outlier_percentage = (outlier_count / total_count) * 100
                else:
                    outlier_percentage = 0
                
                outliers_data[col] = {
                    'count': outlier_count,
                    'method': 'IQR',
                    'q1': round(Q1, 3),
                    'q3': round(Q3, 3),
                    'iqr': round(IQR, 3),
                    'lower_bound': round(lower_bound, 3),
                    'upper_bound': round(upper_bound, 3),
                    'outlier_percentage': round(outlier_percentage, 2)
                }
                
            except Exception as e:
                print(f"Error processing outliers for {col}: {e}")
                outliers_data[col] = {
                    'count': 0,
                    'method': 'IQR',
                    'error': str(e)
                }
        
        return outliers_data
    except Exception as e:
        print(f"Error in detect_outliers: {e}")
        return {}

def run_normality_tests(df):
    """Run normality tests on numerical columns"""
    try:
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        normality_data = {}
        
        for col in numeric_cols:
            try:
                # Remove NaN values for normality test
                clean_data = df[col].dropna()
                if len(clean_data) < 3:
                    normality_data[col] = {
                        'skewness': 'N/A',
                        'kurtosis': 'N/A',
                        'shapiro_wilk_p': 'N/A',
                        'assessment': 'Insufficient data'
                    }
                    continue
                
                # Calculate skewness and kurtosis
                skewness = float(clean_data.skew())
                kurtosis = float(clean_data.kurtosis())
                
                # Shapiro-Wilk test
                try:
                    shapiro_stat, shapiro_p = stats.shapiro(clean_data)
                    shapiro_p = float(shapiro_p)
                except:
                    shapiro_p = 'N/A'
                
                # Normality assessment
                if shapiro_p != 'N/A' and shapiro_p > 0.05:
                    assessment = 'Normal'
                elif abs(skewness) > 1 or abs(kurtosis) > 2:
                    assessment = 'Non-Normal'
                elif abs(skewness) > 0.5 or abs(kurtosis) > 1:
                    assessment = 'Moderately Skewed'
                else:
                    assessment = 'Approximately Normal'
                
                normality_data[col] = {
                    'skewness': round(skewness, 3),
                    'kurtosis': round(kurtosis, 3),
                    'shapiro_wilk_p': shapiro_p if shapiro_p == 'N/A' else round(shapiro_p, 6),
                    'assessment': assessment
                }
                
            except Exception as e:
                print(f"Error processing normality test for {col}: {e}")
                normality_data[col] = {'error': str(e)}
        
        return normality_data
    except Exception as e:
        print(f"Error in run_normality_tests: {e}")
        return {}

def get_correlations(df):
    """Get correlation matrix for numerical columns"""
    try:
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return {}
        
        corr_matrix = df[numeric_cols].corr()
        
        # Convert to dictionary and handle NaN values
        correlations = {}
        for col1 in numeric_cols:
            correlations[col1] = {}
            for col2 in numeric_cols:
                value = corr_matrix.loc[col1, col2]
                if pd.isna(value):
                    correlations[col1][col2] = 0.0
                else:
                    correlations[col1][col2] = round(float(value), 3)
        
        return correlations
    except Exception as e:
        print(f"Error in get_correlations: {e}")
        return {}

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

# Flask routes
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
            session['full_data'] = df.to_dict('records')
            
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
                'full_data': df.to_dict('records')
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
        
        # Get all the analysis results
        analysis_results = {}
        
        # Basic statistics
        analysis_results['basic_stats'] = get_descriptive_stats(df)
        
        # Data types
        analysis_results['dtypes'] = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        # Missing values
        analysis_results['missing_values'] = df.isnull().sum().to_dict()
        
        # Numerical analysis
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        analysis_results['numerical_analysis'] = {}
        for col in numerical_cols:
            analysis_results['numerical_analysis'][col] = {
                'skewness': float(df[col].skew()) if len(df[col].dropna()) > 0 else 0,
                'kurtosis': float(df[col].kurtosis()) if len(df[col].dropna()) > 0 else 0
            }
        
        # Outliers
        analysis_results['outliers'] = detect_outliers(df)
        
        # Normality tests
        analysis_results['normality_tests'] = run_normality_tests(df)
        
        # Correlations
        analysis_results['correlation'] = get_correlations(df)
        
        # Unique values
        analysis_results['unique_values'] = {}
        for col in df.columns:
            if df[col].dtype == 'object' or df[col].dtype == 'string':
                unique_vals = df[col].dropna().unique()
                analysis_results['unique_values'][col] = unique_vals[:20].tolist()
        
        # Preview data
        analysis_results['preview_head'] = df.head(10).to_dict('records')
        analysis_results['preview_tail'] = df.tail(10).to_dict('records')
        
        # Store the complete analysis results in session
        session['analysis_results'] = analysis_results
        
        return jsonify(analysis_results)
        
    except Exception as e:
        print(f"Error in analyze_data: {e}")
        import traceback
        traceback.print_exc()
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
            # Get correlation matrix
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

@app.route('/get_cleaning_recommendations', methods=['POST'])
def get_cleaning_recommendations():
    """Get LLM-based data cleaning recommendations using existing analysis results"""
    try:
        print("=== Starting cleaning recommendations request ===")
        
        # Check if data exists in session
        if 'data' not in session:
            print("No data in session")
            return jsonify({'error': 'No data available for analysis'}), 400
        
        # Check if Gemini service is available
        if not gemini_service:
            print("Gemini service not available")
            return jsonify({
                'error': 'LLM service not available. Please check API configuration.',
                'details': 'Make sure you have configured the Gemini API key in AWS Secrets Manager'
            }), 503
        
        # Check if analysis results exist in session
        if 'analysis_results' not in session:
            print("No analysis results found. Please run analysis first.")
            return jsonify({
                'error': 'No analysis results available. Please run the analysis first.',
                'details': 'Click "Run Analysis" to generate statistics before getting recommendations.'
            }), 400
        
        print("✓ Found existing analysis results in session")
        
        # Get the existing analysis results
        analysis_results = session['analysis_results']
        print(f"Analysis results keys: {list(analysis_results.keys())}")
        
        # Convert the analysis results to JSON-serializable format
        print("Converting analysis results to JSON-serializable format...")
        serializable_results = convert_numpy_types(analysis_results)
        print("✓ Conversion completed")
        
        # Call Gemini service with existing results
        try:
            print("Calling Gemini service with existing analysis data...")
            recommendations = gemini_service.get_cleaning_recommendations(serializable_results)
            
            if recommendations:
                print("✓ Gemini recommendations received")
                # Store in session
                session['cleaning_recommendations'] = recommendations
                
                return jsonify({
                    'success': True,
                    'recommendations': recommendations,
                    'message': 'Recommendations generated using existing analysis results'
                })
            else:
                print("✗ Gemini returned no recommendations")
                return jsonify({'error': 'Failed to generate recommendations from Gemini'}), 500
                
        except Exception as gemini_error:
            print(f"✗ Gemini service error: {gemini_error}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Gemini API error: {str(gemini_error)}'}), 500
            
    except Exception as e:
        print(f"✗ Unexpected error in get_cleaning_recommendations: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

# Lambda handler
def lambda_handler(event, context):
    """AWS Lambda handler function"""
    try:
        # Handle API Gateway events
        if 'httpMethod' in event:
            # This is an API Gateway event
            from mangum import Mangum
            handler = Mangum(app, lifespan="off")
            return handler(event, context)
        else:
            # This might be a direct invocation
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'EDA Tool Lambda function is running',
                    'version': '1.0.0'
                })
            }
    except Exception as e:
        print(f"Lambda handler error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

if __name__ == '__main__':
    # For local testing
    app.run(debug=True, host='0.0.0.0', port=5000)
