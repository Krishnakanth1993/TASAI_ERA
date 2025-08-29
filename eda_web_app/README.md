# 🔍 EDA Web App

A comprehensive Exploratory Data Analysis web application built with Flask, designed to help Data Science teams perform thorough EDA without writing code.

## ✨ Features

### 📊 Data Ingestion & Preparation
- **File Upload**: Support for CSV, Excel (.xlsx, .xls) files up to 100MB
- **Data Parsing**: Automatic parsing with encoding detection and header handling
- **Data Preview**: First/last 10 rows with comprehensive data info
- **Missing Values Analysis**: Count, percentage, and imputation options
- **Duplicate Detection**: Identify and remove duplicate rows
- **Data Cleaning**: Basic transformations and type conversions

### �� Summary Statistics
- **Descriptive Statistics**: Mean, std, min, max, quartiles for numerical columns
- **Categorical Analysis**: Value counts, unique values, most common values
- **Distribution Metrics**: Skewness and kurtosis analysis

### �� Statistical Tests
- **Normality Tests**: Shapiro-Wilk test with p-value interpretation
- **Outlier Detection**: IQR method (1.5 * IQR rule) with bounds
- **Correlation Analysis**: Pearson correlation matrix with strength interpretation

### 📊 Visualizations
- **Univariate**: Histograms, box plots with outlier highlighting
- **Bivariate**: Scatter plots for relationship analysis
- **Multivariate**: Correlation heatmaps and pair plots
- **Interactive**: Plotly-based charts with zoom, hover, and pan

### �� Data Cleaning
- **Missing Values**: Drop rows, fill with mean/median for numerical columns
- **Duplicates**: Remove duplicate rows
- **Data Types**: Automatic inference and conversion options

### 📄 Reporting
- **Comprehensive EDA Report**: HTML format with all analysis results
- **Report Preview**: Preview before download
- **Export Options**: Downloadable HTML report

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8 or higher
- UV package manager

### 1. Clone the Repository
```bash
git clone <repository-url>
cd eda_web_app
```

### 2. Install Dependencies
```bash
uv sync
```

### 3. Run the Application
```bash
uv run app.py
```

The application will be available at `http://localhost:5000`

## �� Usage Guide

### 1. Upload Your Dataset
- Drag and drop or click to upload CSV/Excel files
- Supported formats: CSV, XLSX, XLS
- Maximum file size: 100MB

### 2. Explore Your Data
- View dataset overview (shape, memory usage, missing values)
- Examine first/last rows and data structure
- Analyze data types and null value patterns

### 3. Run Complete Analysis
- Click "Run Complete Analysis" for comprehensive EDA
- Review summary statistics, outliers, normality tests
- Analyze correlations between numerical columns

### 4. Create Visualizations
- Select chart type (histogram, box plot, scatter, correlation heatmap)
- Choose columns for analysis
- Generate interactive charts with Plotly

### 5. Clean Your Data
- Handle missing values (drop or impute)
- Remove duplicate rows
- Apply data transformations

### 6. Generate Reports
- Preview your EDA report
- Download comprehensive HTML report
- Share findings with stakeholders

## ��️ Technical Stack

- **Backend**: Flask (Python web framework)
- **Data Processing**: Pandas, NumPy, SciPy
- **Visualization**: Plotly (interactive charts)
- **Machine Learning**: Scikit-learn (statistical tests)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Package Management**: UV (fast Python package manager)

## 📁 Project Structure

```
eda_web_app/
├── app.py                 # Main Flask application
├── pyproject.toml        # Project configuration and dependencies
├── README.md             # This file
├── static/
│   ├── app.js           # Frontend JavaScript application
│   └── styles.css       # CSS styles and responsive design
└── templates/
    ├── index.html        # Main application interface
    └── report_template.html  # EDA report template
```

##  Configuration

### Environment Variables
- `FLASK_SECRET_KEY`: Secret key for session management (change in production)

### File Upload Settings
- Maximum file size: 100MB (configurable in `app.py`)
- Supported formats: CSV, XLSX, XLS
- Temporary storage: Session-based for small datasets, file-based for large datasets

## 🚨 Limitations & Considerations

- **Memory Usage**: Large datasets (>10k rows) are stored in temporary files
- **Session Storage**: Data is stored in Flask sessions (not persistent across server restarts)
