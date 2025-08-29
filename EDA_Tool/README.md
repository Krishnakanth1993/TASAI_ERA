# EDA Tool - Exploratory Data Analysis Tool

A comprehensive, modern web-based tool for performing exploratory data analysis (EDA) with interactive visualizations and automated report generation.

## 🚀 Features

### 📊 **Data Management**
- **Multi-format Support**: CSV, Excel (.xlsx, .xls) files up to 100MB
- **Full Dataset Processing**: Utilizes complete datasets (not just previews) for accurate analysis
- **Smart Data Detection**: Automatic identification of numerical, categorical, and datetime columns
- **Memory Optimization**: Efficient data handling for large datasets

### 🔍 **Comprehensive Analysis**
- **Basic Statistics**: Count, mean, median, std, min, max, percentiles (25%, 50%, 75%)
- **Data Quality Assessment**: Missing values analysis, duplicate detection, data completeness
- **Outlier Analysis**: IQR method with detailed bounds and outlier counts
- **Normality Tests**: Skewness and kurtosis analysis with normality assessment
- **Correlation Analysis**: Complete correlation matrix with conditional formatting
- **Data Type Analysis**: Automatic detection and classification of column types

### 📈 **Interactive Visualizations**
- **Chart Types**: Histogram, Boxplot, Scatter Plot, Correlation Heatmap, Bar Chart
- **Full Dataset Charts**: All visualizations use complete datasets (150+ points, not just 20)
- **Dynamic Column Selection**: Smart dropdowns based on chart type requirements
- **Chart Labeling**: Custom titles and descriptions for each visualization
- **Responsive Design**: Charts adapt to different screen sizes and orientations

### 📋 **Report Generation**
- **Professional Reports**: Comprehensive HTML reports with all analysis results
- **Chart Selection**: Choose which visualizations to include in reports
- **Custom Titles & Descriptions**: Personalized report headers and notes
- **Preview Functionality**: Review reports before generation
- **Download Options**: HTML format with clean, shareable output
- **Chart Integration**: All selected charts properly rendered in reports

### 🎨 **Modern User Interface**
- **Dark Theme**: High-contrast dark color scheme for better readability
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive Navigation**: Tab-based interface with clear workflow
- **Interactive Elements**: Hover effects, smooth transitions, and visual feedback
- **Professional Styling**: Clean, modern design with proper spacing and typography

## 🛠️ Technology Stack

- **Backend**: Python Flask with pandas, numpy, scipy
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Plotly.js for interactive visualizations
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Icons**: Font Awesome for consistent iconography
- **Fonts**: Inter font family for modern typography

## 📁 Project Structure

```
EDA_Tool/
├── app.py                 # Flask backend application
├── static/
│   ├── app.js            # Main JavaScript functionality
│   └── styles.css        # Custom styling and themes
├── templates/
│   └── index.html        # Main application interface
├── temp_uploads/         # Temporary file storage
├── pyproject.toml        # Python dependencies
├── uv.lock              # Dependency lock file
└── README.md            # This file
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip or uv package manager

### Quick Start
1. **Clone or download** the project files
2. **Install dependencies**:
   ```bash
   # Using uv (recommended)
   uv sync
   
   # Or using pip
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Open your browser** and navigate to `http://localhost:5000`

##  Usage Guide

### 1. **Data Upload**
- Click "Data Upload" tab
- Select your CSV or Excel file
- File will be processed and analyzed automatically
- Data preview will show with comprehensive statistics

### 2. **Data Analysis**
- Navigate to "Analysis" tab
- Click "Run Analysis" to generate comprehensive statistics
- View detailed analysis including:
  - Basic statistics for all columns
  - Missing values analysis
  - Outlier detection with IQR method
  - Normality tests (skewness/kurtosis)
  - Correlation matrix with color coding

### 3. **Creating Visualizations**
- Go to "Visualization" tab
- Select chart type (histogram, boxplot, scatter, etc.)
- Choose relevant columns for your chart
- Click "Create Chart" to generate visualization
- Add custom title and description
- Use "Add to Report" to include in final report

### 4. **Generating Reports**
- Navigate to "Report" tab
- Customize report title and description
- Select which charts to include
- Preview the report before generation
- Generate and download the final HTML report

##  Configuration

### Chart Settings
- **Histogram**: Dynamic binning based on data size
- **Boxplot**: Outlier display with IQR calculations
- **Scatter**: Dynamic marker sizing based on data points
- **Correlation**: Red-blue color scale with hover information
- **Bar Charts**: Automatic value counting for categorical data

### Analysis Parameters
- **Outlier Detection**: 1.5 × IQR method
- **Normality Thresholds**: 
  - Normal: |Skewness| ≤ 0.5 and |Kurtosis| ≤ 1
  - Moderate: |Skewness| > 0.5 or |Kurtosis| > 1
  - Non-Normal: |Skewness| > 1 or |Kurtosis| > 2

## 📊 Supported Data Types

### Numerical Data
- **Integer**: int64, int32
- **Float**: float64, float32
- **Analysis**: Statistics, outliers, normality tests

### Categorical Data
- **Object/String**: Text-based categories
- **Analysis**: Value counts, frequency analysis

### Mixed Data
- **Automatic Detection**: Tool identifies and handles mixed data types
- **Smart Processing**: Appropriate analysis for each column type

## 🎯 Key Benefits

1. **Complete Dataset Analysis**: No more 20-row limitations - uses full datasets
2. **Professional Reports**: Ready-to-share HTML reports with embedded charts
3. **Interactive Workflow**: Seamless transition from analysis to visualization to reporting
4. **Modern UI/UX**: Professional appearance with intuitive navigation
5. **Comprehensive Analysis**: Covers all aspects of exploratory data analysis
6. **Chart Management**: Selective chart inclusion with custom labeling

## 🔍 Troubleshooting

### Common Issues
- **Charts not displaying**: Ensure JavaScript is enabled and Plotly.js is loaded
- **Data not loading**: Check file format (CSV/Excel) and file size (<100MB)
- **Report generation fails**: Verify that charts have been added to the report

### Debug Information
- Open browser console (F12) to view detailed logs
- All operations include debug logging for troubleshooting

## 🚀 Future Enhancements

- **PDF Export**: Direct PDF report generation
- **Additional Chart Types**: More visualization options
- **Data Export**: Save processed/cleaned data
- **Batch Processing**: Handle multiple files simultaneously
- **Advanced Analytics**: Statistical tests and machine learning insights

##  Contributing

This tool is designed for data science teams and analysts. Feel free to:
- Report bugs or issues
- Suggest new features
- Contribute code improvements
- Share feedback on usability

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For questions, issues, or feature requests, please:
1. Check the troubleshooting section above
2. Review the debug logs in browser console
3. Ensure all dependencies are properly installed
4. Verify file formats and sizes meet requirements

---

**Built with ❤️ for the Data Science Community**

*Transform your data exploration workflow with this comprehensive EDA Tool!*

This README provides:

1. **Complete feature overview** of all implemented functionality
2. **Clear installation instructions** for users
3. **Comprehensive usage guide** for each feature
4. **Technical details** about the implementation
5. **Troubleshooting section** for common issues
6. **Professional presentation** that matches your tool's quality

The README now accurately reflects your EDA Tool's capabilities, including the full dataset processing, comprehensive analysis features, and professional report generation system.
