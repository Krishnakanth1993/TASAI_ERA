# EDA Tool - Exploratory Data Analysis Tool

A comprehensive, modern web-based tool for performing exploratory data analysis (EDA) with interactive visualizations, automated report generation, and **AI-powered data cleaning recommendations** using Google Gemini 2.5 Flash.

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
- **Normality Tests**: Skewness and kurtosis analysis with normality assessment and color-coded badges
- **Correlation Analysis**: Complete correlation matrix with conditional formatting
- **Data Type Analysis**: Automatic detection and classification of column types
- **Unique Values Analysis**: Cardinality analysis with visual badges for categorical data

### 🤖 **AI-Powered Data Cleaning Recommendations**
- **Gemini 2.5 Flash Integration**: Advanced LLM-based analysis and recommendations
- **Intelligent Assessment**: AI analyzes your data statistics and provides targeted cleaning suggestions
- **Structured Recommendations**: Organized into critical issues, cleaning steps, and next steps
- **Data Quality Scoring**: AI-generated quality assessment with actionable insights
- **Smart Workflow**: Generate recommendations once, view multiple times without re-processing

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
- **Smart Notifications**: Real-time feedback for all operations

## 🛠️ Technology Stack

- **Backend**: Python Flask with pandas, numpy, scipy, scikit-learn
- **AI Integration**: Google Gemini 2.5 Flash API for intelligent recommendations
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Plotly.js for interactive visualizations
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Icons**: Font Awesome for consistent iconography
- **Fonts**: Inter font family for modern typography

## 📁 Project Structure

```
EDA_Tool/
├── app.py                 # Flask backend application
├── services/
│   └── gemini_service.py # Google Gemini API integration
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
- Google Gemini API key

### Quick Start
1. **Clone or download** the project files
2. **Set up Google Gemini API**:
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a `.env` file in the project root:
     ```bash
     GEMINI_API_KEY=your_api_key_here
     ```

3. **Install dependencies**:
   ```bash
   # Using uv (recommended)
   uv sync
   
   # Or using pip
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   python app.py
   ```

5. **Open your browser** and navigate to `http://localhost:5000`

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
  - Basic statistics for all columns (unpivoted format)
  - Missing values analysis with data types
  - Outlier detection with IQR method
  - Normality tests with color-coded assessment badges
  - Correlation matrix with color coding and legend
  - Unique values analysis with cardinality metrics

### 3. **AI Data Cleaning Recommendations**
- After running analysis, click "Get AI Data Cleaning Recommendations"
- AI will analyze your data and generate intelligent cleaning suggestions
- View recommendations in a professional modal with:
  - **Executive Summary**: AI-generated overview of data quality
  - **Data Quality Score**: Numerical assessment with visual indicators
  - **Critical Issues**: Prioritized problems requiring immediate attention
  - **Cleaning Steps**: Detailed, actionable cleaning procedures
  - **Next Steps**: Strategic guidance for further analysis
- Recommendations are stored locally and can be viewed multiple times

### 4. **Creating Visualizations**
- Go to "Visualization" tab
- Select chart type (histogram, boxplot, scatter, etc.)
- Choose relevant columns for your chart
- Click "Create Chart" to generate visualization
- Add custom title and description
- Use "Add to Report" to include in final report

### 5. **Generating Reports**
- Navigate to "Report" tab
- Customize report title and description
- Select which charts to include
- Preview the report before generation
- Generate and download the final HTML report

## ⚙️ Configuration

### AI Recommendations Settings
- **Model**: Google Gemini 2.5 Flash for optimal performance
- **Analysis Scope**: Comprehensive data quality assessment
- **Output Format**: Structured JSON with actionable insights
- **Caching**: Local storage for efficient re-access

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
- **Analysis**: Value counts, frequency analysis, cardinality

### Mixed Data
- **Automatic Detection**: Tool identifies and handles mixed data types
- **Smart Processing**: Appropriate analysis for each column type

## 🎯 Key Benefits

1. **Complete Dataset Analysis**: No more 20-row limitations - uses full datasets
2. **AI-Powered Insights**: Intelligent data cleaning recommendations from Google Gemini
3. **Professional Reports**: Ready-to-share HTML reports with embedded charts
4. **Interactive Workflow**: Seamless transition from analysis to AI recommendations to visualization
5. **Modern UI/UX**: Professional appearance with intuitive navigation and smart notifications
6. **Comprehensive Analysis**: Covers all aspects of exploratory data analysis
7. **Chart Management**: Selective chart inclusion with custom labeling

## 🔍 Troubleshooting

### Common Issues
- **Charts not displaying**: Ensure JavaScript is enabled and Plotly.js is loaded
- **Data not loading**: Check file format (CSV/Excel) and file size (<100MB)
- **Report generation fails**: Verify that charts have been added to the report
- **AI recommendations not working**: Check your `.env` file and Gemini API key

### Debug Information
- Open browser console (F12) to view detailed logs
- All operations include debug logging for troubleshooting
- AI recommendation generation includes detailed error logging

## 🚀 Future Enhancements

- **PDF Export**: Direct PDF report generation
- **Additional Chart Types**: More visualization options
- **Data Export**: Save processed/cleaned data
- **Batch Processing**: Handle multiple files simultaneously
- **Advanced Analytics**: Statistical tests and machine learning insights
- **Custom AI Prompts**: User-defined recommendation criteria
- **Recommendation History**: Track and compare AI suggestions over time
- **Data Cleanup Support**: Built-in data cleaning tools and transformations
- **Before/After Visualization**: Compare raw and cleaned data with side-by-side charts
- **Data Quality Monitoring**: Track data quality improvements over time
- **Automated Cleaning Pipelines**: Save and reuse cleaning workflows
- **Data Validation Rules**: Custom validation criteria and automated checks


##  Contributing

This tool is designed for data science teams and analysts. Feel free to:
- Report bugs or issues
- Suggest new features
- Contribute code improvements
- Share feedback on usability
- Enhance AI recommendation capabilities

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For questions, issues, or feature requests, please:
1. Check the troubleshooting section above
2. Review the debug logs in browser console
3. Ensure all dependencies are properly installed
4. Verify file formats and sizes meet requirements
5. Check your Google Gemini API key configuration

---

**Built with ❤️ for the Data Science Community**

*Transform your data exploration workflow with this comprehensive EDA Tool featuring AI-powered insights!*

## 🔐 Security Notes

- **API Key Protection**: Your Google Gemini API key is stored securely in environment variables
- **Local Processing**: All data analysis is performed locally on your machine
- **No Data Transmission**: Raw data is never sent to external servers (only statistics for AI analysis)
- **Secure Storage**: Recommendations are stored locally in your browser

---

*This README now accurately reflects your EDA Tool's enhanced capabilities, including the new AI-powered data cleaning recommendations feature powered by Google Gemini 2.5 Flash.*
