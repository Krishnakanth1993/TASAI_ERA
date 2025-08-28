# EDA Explorer - Exploratory Data Analysis Web Application

A modern, interactive web application for performing Exploratory Data Analysis (EDA) with a beautiful UI built using FastAPI, HTML, CSS, and JavaScript.

## Features

### 📊 Core Features
- **File Upload**: Support for CSV, Excel (.xlsx, .xls) files up to 100MB
- **Data Preview**: Interactive table view with head/tail functionality
- **Statistical Analysis**: Comprehensive descriptive statistics and data insights
- **Data Visualization**: Interactive charts using Plotly (histograms, box plots, scatter plots, etc.)
- **Export Options**: Download data as CSV, charts as images, and generate reports

### 📊 Analysis Capabilities
- Descriptive statistics (mean, std, min, max, quartiles)
- Missing value detection and reporting
- Duplicate row identification
- Outlier detection using IQR and Z-score methods
- Correlation analysis between numerical columns
- Normality tests for distribution analysis

### 🎨 Modern UI/UX
- Responsive design that works on all devices
- Drag-and-drop file upload
- Interactive navigation between sections
- Real-time data processing feedback
- Beautiful, modern design with smooth animations

## Technology Stack

- **Backend**: FastAPI (Python)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Plotly.js for interactive visualizations
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Icons**: Font Awesome 6.0
- **Fonts**: Inter (Google Fonts)

## Installation

### Prerequisites
- Python 3.8 or higher
- UV package manager

### Setup with UV

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd web_app_ec2
   ```

2. **Install dependencies using UV**
   ```bash
   uv sync
   ```

3. **Run the application**
   ```bash
   uv run main.py
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:8000`

### Alternative: Manual Installation

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python main.py
   ```

## Project Structure

```
web_app_ec2/
├── mai
```
