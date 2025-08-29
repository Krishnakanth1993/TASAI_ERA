// Global variables
let currentData = null;
let analysisResults = null;

// File upload handling
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    // File input change handler
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop handlers
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('dragleave', handleDragLeave);
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        uploadFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        uploadFile(files[0]);
    }
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function uploadFile(file) {
    // Validate file size
    if (file.size > 100 * 1024 * 1024) { // 100MB
        showMessage('File size exceeds 100MB limit', 'error');
        return;
    }
    
    // Validate file type
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedTypes.includes(fileExtension)) {
        showMessage('File type not supported. Please upload CSV or Excel files.', 'error');
        return;
    }
    
    // Show progress
    showUploadProgress();
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload file
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideUploadProgress();
        if (data.success) {
            currentData = data;
            showDataPreview(data);
            showMessage(data.message, 'success');
        } else {
            showMessage(data.error, 'error');
        }
    })
    .catch(error => {
        hideUploadProgress();
        showMessage('Upload failed: ' + error.message, 'error');
    });
}

function showUploadProgress() {
    document.getElementById('uploadProgress').style.display = 'block';
    document.getElementById('uploadArea').style.display = 'none';
    
    // Simulate progress
    let progress = 0;
    const progressFill = document.getElementById('progressFill');
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        progressFill.style.width = progress + '%';
    }, 200);
}

function hideUploadProgress() {
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('progressFill').style.width = '0%';
}

function showDataPreview(data) {
    // Update info cards
    document.getElementById('datasetShape').textContent = `${data.info.shape[0]} rows × ${data.info.shape[1]} columns`;
    document.getElementById('columnCount').textContent = data.info.shape[1];
    document.getElementById('memoryUsage').textContent = formatBytes(data.info.memory_usage);
    document.getElementById('missingValues').textContent = Object.values(data.info.null_counts).reduce((a, b) => a + b, 0);
    
    // Populate tables
    populateTable('headTable', data.preview.head);
    populateTable('tailTable', data.preview.tail);
    populateInfoTable(data.info);
    
    // Show sections
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('analysisSection').style.display = 'block';
    document.getElementById('visualizationSection').style.display = 'block';
    document.getElementById('reportSection').style.display = 'block';
    
    // Populate column selection for visualizations
    populateColumnSelection(data.info.columns);
}

function populateTable(tableId, data) {
    const table = document.getElementById(tableId);
    if (!data || data.length === 0) {
        table.innerHTML = '<tr><td colspan="100">No data available</td></tr>';
        return;
    }
    
    // Create header
    const headers = Object.keys(data[0]);
    let headerRow = '<tr>';
    headers.forEach(header => {
        headerRow += `<th>${header}</th>`;
    });
    headerRow += '</tr>';
    
    // Create data rows
    let dataRows = '';
    data.forEach(row => {
        dataRows += '<tr>';
        headers.forEach(header => {
            dataRows += `<td>${row[header] || ''}</td>`;
        });
        dataRows += '</tr>';
    });
    
    table.innerHTML = headerRow + dataRows;
}

function populateInfoTable(info) {
    const infoTable = document.getElementById('infoTable');
    
    let html = '<table>';
    html += '<tr><th>Column</th><th>Data Type</th><th>Non-Null Count</th><th>Null Count</th><th>Null %</th></tr>';
    
    Object.keys(info.dtypes).forEach(column => {
        const dtype = info.dtypes[column];
        const nonNullCount = info.shape[0] - info.null_counts[column];
        const nullCount = info.null_counts[column];
        const nullPercentage = info.null_percentages[column];
        
        html += `<tr>
            <td>${column}</td>
            <td>${dtype}</td>
            <td>${nonNullCount}</td>
            <td>${nullCount}</td>
            <td>${nullPercentage.toFixed(2)}%</td>
        </tr>`;
    });
    
    html += '</table>';
    infoTable.innerHTML = html;
}

function populateColumnSelection(columns) {
    const columnSelect = document.getElementById('columnSelection');
    columnSelect.innerHTML = '';
    
    columns.forEach(column => {
        const option = document.createElement('option');
        option.value = column;
        option.textContent = column;
        columnSelect.appendChild(option);
    });
}

function showTab(tabName) {
    // Hide all tabs
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

// Analysis functions
function runAnalysis() {
    showLoading();
    
    fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            analysisResults = data;
            displayAnalysisResults(data);
            showMessage('Analysis completed successfully!', 'success');
        } else {
            showMessage(data.error, 'error');
        }
    })
    .catch(error => {
        hideLoading();
        showMessage('Analysis failed: ' + error.message, 'error');
    });
}

function displayAnalysisResults(data) {
    const resultsContainer = document.getElementById('analysisResults');
    
    let html = '<div class="analysis-summary">';
    
    // Summary Statistics
    if (data.summary_statistics.numerical) {
        html += '<div class="analysis-section">';
        html += '<h3>📊 Numerical Columns Summary</h3>';
        html += '<div class="stats-table">';
        html += '<table><tr><th>Column</th><th>Mean</th><th>Std</th><th>Min</th><th>25%</th><th>50%</th><th>75%</th><th>Max</th><th>Skewness</th><th>Kurtosis</th></tr>';
        
        data.summary_statistics.numerical.columns.forEach(col => {
            const stats = data.summary_statistics.numerical.descriptive[col];
            const skew = data.summary_statistics.numerical.skewness[col];
            const kurt = data.summary_statistics.numerical.kurtosis[col];
            
            html += `<tr>
                <td><strong>${col}</strong></td>
                <td>${stats.mean?.toFixed(4) || 'N/A'}</td>
                <td>${stats.std?.toFixed(4) || 'N/A'}</td>
                <td>${stats.min?.toFixed(4) || 'N/A'}</td>
                <td>${stats['25%']?.toFixed(4) || 'N/A'}</td>
                <td>${stats['50%']?.toFixed(4) || 'N/A'}</td>
                <td>${stats['75%']?.toFixed(4) || 'N/A'}</td>
                <td>${stats.max?.toFixed(4) || 'N/A'}</td>
                <td>${skew?.toFixed(4) || 'N/A'}</td>
                <td>${kurt?.toFixed(4) || 'N/A'}</td>
            </tr>`;
        });
        
        html += '</table></div></div>';
    }
    
    // Categorical Statistics
    if (data.summary_statistics.categorical) {
        html += '<div class="analysis-section">';
        html += '<h3>📈 Categorical Columns Summary</h3>';
        
        Object.keys(data.summary_statistics.categorical).forEach(col => {
            const stats = data.summary_statistics.categorical[col];
            html += `<div class="categorical-stats">`;
            html += `<h4>${col}</h4>`;
            html += `<p><strong>Unique Values:</strong> ${stats.unique_count}</p>`;
            html += `<p><strong>Most Common:</strong> ${stats.most_common || 'N/A'}</p>`;
            
            if (Object.keys(stats.value_counts).length > 0) {
                html += '<div class="value-counts">';
                html += '<h5>Top 10 Values:</h5>';
                html += '<table><tr><th>Value</th><th>Count</th></tr>';
                
                Object.entries(stats.value_counts).forEach(([value, count]) => {
                    html += `<tr><td>${value}</td><td>${count}</td></tr>`;
                });
                
                html += '</table></div>';
            }
            
            html += '</div>';
        });
        
        html += '</div>';
    }
    
    // Outliers
    if (Object.keys(data.outliers).length > 0) {
        html += '<div class="analysis-section">';
        html += '<h3>🚨 Outlier Detection (IQR Method)</h3>';
        
        Object.keys(data.outliers).forEach(col => {
            const outlier = data.outliers[col];
            html += `<div class="outlier-info">`;
            html += `<h4>${col}</h4>`;
            html += `<p><strong>Outlier Count:</strong> ${outlier.count}</p>`;
            html += `<p><strong>Lower Bound:</strong> ${outlier.lower_bound?.toFixed(4) || 'N/A'}</p>`;
            html += `<p><strong>Upper Bound:</strong> ${outlier.upper_bound?.toFixed(4) || 'N/A'}</p>`;
            html += '</div>';
        });
        
        html += '</div>';
    }
    
    // Normality Tests
    if (Object.keys(data.normality_tests).length > 0) {
        html += '<div class="analysis-section">';
        html += '<h3>📏 Normality Tests (Shapiro-Wilk)</h3>';
        
        Object.keys(data.normality_tests).forEach(col => {
            const test = data.normality_tests[col].shapiro_wilk;
            if (test.error) {
                html += `<p><strong>${col}:</strong> Test failed</p>`;
            } else {
                const isNormal = test.is_normal ? '✅ Normal' : '❌ Not Normal';
                html += `<p><strong>${col}:</strong> Statistic: ${test.statistic.toFixed(4)}, p-value: ${test.p_value.toFixed(4)} - ${isNormal}</p>`;
            }
        });
        
        html += '</div>';
    }
    
    // Correlations
    if (Object.keys(data.correlations).length > 0) {
        html += '<div class="analysis-section">';
        html += '<h3>�� Correlation Matrix (Pearson)</h3>';
        html += '<div class="correlation-table">';
        html += '<table>';
        
        const columns = Object.keys(data.correlations);
        html += '<tr><th></th>';
        columns.forEach(col => html += `<th>${col}</th>`);
        html += '</tr>';
        
        columns.forEach(rowCol => {
            html += `<tr><td><strong>${rowCol}</strong></td>`;
            columns.forEach(colCol => {
                const corr = data.correlations[rowCol][colCol];
                const cellClass = corr > 0.7 ? 'high-positive' : corr < -0.7 ? 'high-negative' : 
                                 corr > 0.5 ? 'medium-positive' : corr < -0.5 ? 'medium-negative' : '';
                html += `<td class="${cellClass}">${corr?.toFixed(3) || 'N/A'}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</table></div></div>';
    }
    
    html += '</div>';
    resultsContainer.innerHTML = html;
}

// Data cleaning functions
function showDataCleaning() {
    const cleaningSection = document.getElementById('cleaningSection');
    if (cleaningSection.style.display === 'none') {
        cleaningSection.style.display = 'block';
    } else {
        cleaningSection.style.display = 'none';
    }
}

function cleanData(action) {
    showLoading();
    
    fetch('/clean_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: action })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            showMessage(data.message, 'success');
            // Refresh data preview
            if (currentData) {
                currentData.info.shape = data.new_shape;
                showDataPreview(currentData);
            }
        } else {
            showMessage(data.error, 'error');
        }
    })
    .catch(error => {
        hideLoading();
        showMessage('Data cleaning failed: ' + error.message, 'error');
    });
}

// Visualization functions
function updateColumnSelection() {
    const chartType = document.getElementById('chartType').value;
    const columnSelect = document.getElementById('columnSelection');
    
    // Clear current selection
    columnSelect.innerHTML = '';
    
    if (!currentData) return;
    
    const columns = currentData.info.columns;
    
    if (chartType === 'scatter') {
        // For scatter plots, we need at least 2 columns
        columns.forEach(column => {
            const option = document.createElement('option');
            option.value = column;
            option.textContent = column;
            columnSelect.appendChild(option);
        });
        columnSelect.setAttribute('multiple', 'true');
    } else if (chartType === 'correlation_heatmap') {
        // For correlation heatmap, show only numerical columns
        columns.forEach(column => {
            const option = document.createElement('option');
            option.value = column;
            option.textContent = column;
            columnSelect.appendChild(option);
        });
        columnSelect.setAttribute('multiple', 'true');
    } else {
        // For other charts, single or multiple selection
        columns.forEach(column => {
            const option = document.createElement('option');
            option.value = column;
            option.textContent = column;
            columnSelect.appendChild(option);
        });
        columnSelect.setAttribute('multiple', 'true');
    }
}

function createVisualization() {
    const chartType = document.getElementById('chartType').value;
    const columnSelect = document.getElementById('columnSelection');
    const selectedColumns = Array.from(columnSelect.selectedOptions).map(option => option.value);
    
    if (selectedColumns.length === 0) {
        showMessage('Please select at least one column for visualization', 'error');
        return;
    }
    
    if (chartType === 'scatter' && selectedColumns.length < 2) {
        showMessage('Scatter plot requires at least 2 columns', 'error');
        return;
    }
    
    showLoading();
    
    fetch('/visualize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chart_type: chartType,
            columns: selectedColumns
        })
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            displayChart(data.plot);
        } else {
            showMessage(data.error, 'error');
        }
    })
    .catch(error => {
        hideLoading();
        showMessage('Visualization failed: ' + error.message, 'error');
    });
}

function displayChart(plotJson) {
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.innerHTML = '';
    
    try {
        const plotData = JSON.parse(plotJson);
        Plotly.newPlot(chartContainer, plotData.data, plotData.layout, {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        });
    } catch (error) {
        showMessage('Error displaying chart: ' + error.message, 'error');
    }
}

// Report functions
function generateReport() {
    showLoading();
    
    fetch('/generate_report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            showReportPreview(data.report_html);
        } else {
            showMessage(data.error, 'error');
        }
    })
    .catch(error => {
        hideLoading();
        showMessage('Report generation failed: ' + error.message, 'error');
    });
}

function previewReport() {
    if (!analysisResults) {
        showMessage('Please run analysis first before generating report', 'info');
        return;
    }
    
    // Create a simple preview from analysis results
    let previewHtml = '<div class="report-preview-content">';
    previewHtml += '<h2>�� EDA Report Preview</h2>';
    previewHtml += '<p>This is a preview of your EDA report. Click "Generate Complete Report" for the full report.</p>';
    
    if (analysisResults.summary_statistics.numerical) {
        previewHtml += '<h3>Numerical Summary</h3>';
        previewHtml += `<p>${analysisResults.summary_statistics.numerical.columns.length} numerical columns analyzed</p>`;
    }
    
    if (analysisResults.summary_statistics.categorical) {
        previewHtml += '<h3>Categorical Summary</h3>';
        previewHtml += `<p>${Object.keys(analysisResults.summary_statistics.categorical).length} categorical columns analyzed</p>`;
    }
    
    if (Object.keys(analysisResults.outliers).length > 0) {
        previewHtml += '<h3>Outlier Detection</h3>';
        previewHtml += `<p>Outliers detected in ${Object.keys(analysisResults.outliers).length} columns</p>`;
    }
    
    previewHtml += '</div>';
    
    document.getElementById('reportPreview').innerHTML = previewHtml;
}

function showReportPreview(reportHtml) {
    const modal = document.getElementById('reportModal');
    const modalBody = document.getElementById('reportModalBody');
    
    modalBody.innerHTML = reportHtml;
    modal.style.display = 'block';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function downloadReport() {
    // Create a downloadable version of the report
    const reportContent = document.getElementById('reportModalBody').innerHTML;
    const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
            <title>EDA Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .section { margin: 20px 0; }
                h1, h2, h3 { color: #333; }
            </style>
        </head>
        <body>
            ${reportContent}
        </body>
        </html>
    `], { type: 'text/html' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eda_report.html';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Utility functions
function showLoading() {
    document.getElementById('loadingModal').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingModal').style.display = 'none';
}

function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageDiv, mainContent.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('reportModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeReportModal();
    }
});
