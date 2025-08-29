// Global variables
let currentData = null;
let currentColumns = [];
let currentDataView = 'head'; // Track current data view

// Debug function to log data
function debugLog(message, data) {
    console.log(`[EDA Debug] ${message}:`, data);
}

// Tab switching
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to selected tab
    event.target.classList.add('active');
}

// File upload handling
function handleFileUpload(event) {
    // Handle both event objects and manual calls
    let file;
    if (event && event.target && event.target.files) {
        file = event.target.files[0];
    } else if (event && event.files) {
        file = event.files[0];
    } else {
        console.error('No file found in event:', event);
        return;
    }
    
    if (!file) return;

    debugLog('File selected', file);

    const formData = new FormData();
    formData.append('file', file);

    document.getElementById('uploadStatus').innerHTML = '<div class="alert alert-info">Uploading file...</div>';

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        debugLog('Upload response status', response.status);
        return response.json();
    })
    .then(data => {
        debugLog('Upload response data', data);
        
        if (data.success) {
            currentData = data;
            currentColumns = data.data_info.columns;
            
            debugLog('Current data set', currentData);
            debugLog('Current columns set', currentColumns);
            
            document.getElementById('uploadStatus').innerHTML = 
                `<div class="alert alert-success">${data.message}</div>`;
            
            displayDataPreview(data);
            updateColumnSelections();
        } else {
            document.getElementById('uploadStatus').innerHTML = 
                `<div class="alert alert-error">${data.error}</div>`;
        }
    })
    .catch(error => {
        debugLog('Upload error', error);
        document.getElementById('uploadStatus').innerHTML = 
            `<div class="alert alert-error">Upload failed: ${error.message}</div>`;
    });
}

// Display data preview
function displayDataPreview(data) {
    debugLog('Displaying data preview', data);
    
    const previewDiv = document.getElementById('dataPreview');
    const infoDiv = document.getElementById('dataInfo');
    const tableContainer = document.getElementById('dataTableContainer');

    // Display data info (df.info equivalent)
    infoDiv.innerHTML = `
        <table class="data-info-table">
            <thead>
                <tr>
                    <th>Column</th>
                    <th>Non-Null Count</th>
                    <th>Dtype</th>
                    <th>Memory Usage</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(data.data_info.dtypes).map(([col, dtype]) => `
                    <tr>
                        <td><strong>${col}</strong></td>
                        <td>${data.data_info.shape[0] - data.data_info.null_counts[col]}</td>
                        <td>${dtype}</td>
                        <td>${(data.data_info.memory_usage / data.data_info.shape[1] / 1024).toFixed(2)} KB</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="stats-grid" style="margin-top: 20px;">
            <div class="stat-card">
                <h3>Dataset Shape</h3>
                <p><strong>Rows:</strong> ${data.data_info.shape[0]}</p>
                <p><strong>Columns:</strong> ${data.data_info.shape[1]}</p>
            </div>
            <div class="stat-card">
                <h3>Memory Usage</h3>
                <p><strong>Size:</strong> ${(data.data_info.memory_usage / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div class="stat-card">
                <h3>Missing Values</h3>
                <p><strong>Total:</strong> ${Object.values(data.data_info.null_counts).reduce((a, b) => a + b, 0)}</p>
            </div>
            <div class="stat-card">
                <h3>Duplicate Rows</h3>
                <p><strong>Count:</strong> ${data.data_info.duplicate_rows}</p>
            </div>
        </div>
    `;

    // Show initial data table (HEAD by default)
    showDataView('head');

    previewDiv.style.display = 'block';
}

// Show data view (HEAD or TAIL)
function showDataView(view) {
    currentDataView = view;
    
    // Update button states - Fix: Don't rely on event.target
    document.querySelectorAll('.data-view-toggle .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the correct button based on view
    if (view === 'head') {
        document.querySelector('.data-view-toggle .btn:first-child').classList.add('active');
    } else {
        document.querySelector('.data-view-toggle .btn:last-child').classList.add('active');
    }
    
    // Display appropriate data
    const tableContainer = document.getElementById('dataTableContainer');
    
    if (view === 'head') {
        tableContainer.innerHTML = `
            <h4>First 10 rows:</h4>
            ${createDataTable(currentData.preview_head, 'head')}
        `;
    } else {
        tableContainer.innerHTML = `
            <h4>Last 10 rows:</h4>
            ${createDataTable(currentData.preview_tail, 'tail')}
        `;
    }
}

// Create data table HTML - UNPIVOTED VERSION
function createDataTable(data, type) {
    debugLog(`Creating ${type} data table`, data);
    
    if (!data || Object.keys(data).length === 0) {
        debugLog(`No data for ${type} table`);
        return '<p>No data to display</p>';
    }

    // The data structure from backend is: {column_name: {row_index: value}}
    // We need to unpivot this to show rows as rows and columns as columns
    const columns = Object.keys(data);
    const maxRows = Math.max(...columns.map(col => Object.keys(data[col]).length));
    
    debugLog(`Columns: ${columns.length}, Max rows: ${maxRows}`);

    let tableHTML = '<table class="data-table"><thead><tr>';
    
    // Header row with column names
    tableHTML += '<th>Row #</th>';
    columns.forEach(col => {
        tableHTML += `<th>${col}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    // Data rows - each row index becomes a table row
    for (let i = 0; i < maxRows; i++) {
        tableHTML += '<tr>';
        tableHTML += `<td><strong>${i + 1}</strong></td>`;
        
        columns.forEach(column => {
            const value = data[column][i] !== undefined ? data[column][i] : '';
            // Handle different data types
            let displayValue = value;
            if (typeof value === 'number') {
                displayValue = value.toFixed(4);
            } else if (value === null || value === undefined) {
                displayValue = '<em>null</em>';
            }
            tableHTML += `<td>${displayValue}</td>`;
        });
        tableHTML += '</tr>';
    }

    tableHTML += '</tbody></table>';
    
    debugLog(`Generated ${type} table HTML length`, tableHTML.length);
    return tableHTML;
}

// Update column selections for various features
function updateColumnSelections() {
    debugLog('Updating column selections', currentColumns);
    
    if (!currentColumns || currentColumns.length === 0) return;

    // Update cleaning columns
    const cleaningSelect = document.getElementById('cleaningColumnSelect');
    if (cleaningSelect) {
        cleaningSelect.innerHTML = '';
        currentColumns.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            cleaningSelect.appendChild(option);
        });
    }
}

// Update column selection based on chart type
function updateColumnSelection() {
    const chartType = document.getElementById('chartType').value;
    const columnSelection = document.getElementById('columnSelection');
    const createChartBtn = document.getElementById('createChartBtn');

    debugLog('Updating column selection for chart type', chartType);

    if (!chartType) {
        columnSelection.innerHTML = '';
        createChartBtn.disabled = true;
        return;
    }

    if (!currentColumns || currentColumns.length === 0) {
        columnSelection.innerHTML = '<div class="alert alert-error">Please upload data first</div>';
        createChartBtn.disabled = true;
        return;
    }

    let html = '';
    if (chartType === 'histogram' || chartType === 'boxplot' || chartType === 'bar') {
        html = `
            <div class="form-group">
                <label>Select Column:</label>
                <select id="chartColumn1" class="form-control">
                    <option value="">Choose column</option>
                    ${currentColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
                </select>
            </div>
        `;
    } else if (chartType === 'scatter') {
        html = `
            <div class="form-group">
                <label>X Column:</label>
                <select id="chartColumn1" class="form-control">
                    <option value="">Choose X column</option>
                    ${currentColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Y Column:</label>
                <select id="chartColumn2" class="form-control">
                    <option value="">Choose Y column</option>
                    ${currentColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
                </select>
            </div>
        `;
    } else if (chartType === 'correlation') {
        html = '<div class="alert alert-info">Correlation heatmap will be generated for all numerical columns</div>';
    }

    columnSelection.innerHTML = html;
    createChartBtn.disabled = false;
}

// Analyze data
function analyzeData() {
    if (!currentData) {
        alert('Please upload data first');
        return;
    }

    debugLog('Starting data analysis');

    document.getElementById('analysisLoading').style.display = 'block';
    document.getElementById('analysisResults').innerHTML = '';

    fetch('/analyze', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('analysisLoading').style.display = 'none';
        
        debugLog('Analysis response', data);
        
        if (data.success) {
            displayAnalysisResults(data);
        } else {
            document.getElementById('analysisResults').innerHTML = 
                `<div class="alert alert-error">${data.error}</div>`;
        }
    })
    .catch(error => {
        debugLog('Analysis error', error);
        document.getElementById('analysisLoading').style.display = 'none';
        document.getElementById('analysisResults').innerHTML = 
            `<div class="alert alert-error">Analysis failed: ${error.message}</div>`;
    });
}

// Display analysis results
function displayAnalysisResults(data) {
    debugLog('Displaying analysis results', data);
    
    const resultsDiv = document.getElementById('analysisResults');
    
    let html = '<h3>Analysis Results</h3>';

    // Descriptive Statistics
    if (Object.keys(data.descriptive_stats).length > 0) {
        html += '<div class="stat-card"><h4>Descriptive Statistics</h4>';
        Object.entries(data.descriptive_stats).forEach(([col, stats]) => {
            html += `
                <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h5>${col}</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                        <div><strong>Count:</strong> ${stats.count}</div>
                        <div><strong>Mean:</strong> ${stats.mean.toFixed(4)}</div>
                        <div><strong>Std:</strong> ${stats.std.toFixed(4)}</div>
                        <div><strong>Min:</strong> ${stats.min.toFixed(4)}</div>
                        <div><strong>25%:</strong> ${stats['25%'].toFixed(4)}</div>
                        <div><strong>50%:</strong> ${stats['50%'].toFixed(4)}</div>
                        <div><strong>75%:</strong> ${stats['75%'].toFixed(4)}</div>
                        <div><strong>Max:</strong> ${stats.max.toFixed(4)}</div>
                        <div><strong>Skewness:</strong> ${stats.skewness.toFixed(4)}</div>
                        <div><strong>Kurtosis:</strong> ${stats.kurtosis.toFixed(4)}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    // Categorical Statistics
    if (Object.keys(data.categorical_stats).length > 0) {
        html += '<div class="stat-card"><h4>Categorical Statistics</h4>';
        Object.entries(data.categorical_stats).forEach(([col, stats]) => {
            html += `
                <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h5>${col}</h5>
                    <p><strong>Unique values:</strong> ${stats.unique_count}</p>
                    <p><strong>Most common:</strong> ${Object.entries(stats.most_common).map(([k, v]) => `${k} (${v})`).join(', ')}</p>
                </div>
            `;
        });
        html += '</div>';
    }

    // Outliers
    if (Object.keys(data.outliers).length > 0) {
        html += '<div class="stat-card"><h4>Outlier Detection</h4>';
        Object.entries(data.outliers).forEach(([col, outlier]) => {
            html += `
                <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h5>${col}</h5>
                    <p><strong>Outlier count:</strong> ${outlier.count}</p>
                    ${outlier.count > 0 ? `<p><strong>Outlier values:</strong> ${outlier.values.slice(0, 10).join(', ')}${outlier.values.length > 10 ? '...' : ''}</p>` : ''}
                </div>
            `;
        });
        html += '</div>';
    }

    // Normality Tests
    if (Object.keys(data.normality_tests).length > 0) {
        html += '<div class="stat-card"><h4>Normality Tests</h4>';
        Object.entries(data.normality_tests).forEach(([col, tests]) => {
            if (tests.error) {
                html += `<p><strong>${col}:</strong> Error - ${tests.error}</p>`;
            } else {
                html += `
                    <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h5>${col}</h5>
                        <p><strong>Shapiro-Wilk:</strong> p-value = ${tests.shapiro_wilk.p_value.toFixed(4)} (${tests.shapiro_wilk.is_normal ? 'Normal' : 'Not Normal'})</p>
                        <p><strong>Kolmogorov-Smirnov:</strong> p-value = ${tests.kolmogorov_smirnov.p_value.toFixed(4)} (${tests.kolmogorov_smirnov.is_normal ? 'Normal' : 'Not Normal'})</p>
                    </div>
                `;
            }
        });
        html += '</div>';
    }

    // Correlations
    if (data.correlations && Object.keys(data.correlations.pearson).length > 0) {
        html += '<div class="stat-card"><h4>Correlation Analysis</h4>';
        html += '<p><strong>Strong correlations (|r| > 0.7):</strong></p>';
        
        const strongCorrs = [];
        Object.entries(data.correlations.pearson).forEach(([col1, corrs]) => {
            Object.entries(corrs).forEach(([col2, corr]) => {
                if (col1 !== col2 && Math.abs(corr) > 0.7) {
                    strongCorrs.push({col1, col2, corr});
                }
            });
        });

        if (strongCorrs.length > 0) {
            strongCorrs.forEach(({col1, col2, corr}) => {
                const strength = Math.abs(corr) > 0.9 ? 'Very Strong' : 'Strong';
                html += `<p>${col1} ↔ ${col2}: ${corr.toFixed(4)} (${strength})</p>`;
            });
        } else {
            html += '<p>No strong correlations found</p>';
        }
        html += '</div>';
    }

    resultsDiv.innerHTML = html;
}

// Create visualization
function createVisualization() {
    const chartType = document.getElementById('chartType').value;
    if (!chartType) return;

    let columns = [];
    if (chartType === 'histogram' || chartType === 'boxplot' || chartType === 'bar') {
        const col1 = document.getElementById('chartColumn1').value;
        if (!col1) {
            alert('Please select a column');
            return;
        }
        columns = [col1];
    } else if (chartType === 'scatter') {
        const col1 = document.getElementById('chartColumn1').value;
        const col2 = document.getElementById('chartColumn2').value;
        if (!col1 || !col2) {
            alert('Please select both columns');
            return;
        }
        columns = [col1, col2];
    }

    debugLog('Creating visualization', {chartType, columns});

    fetch('/visualize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chart_type: chartType,
            columns: columns
        })
    })
    .then(response => response.json())
    .then(data => {
        debugLog('Visualization response', data);
        
        if (data.success) {
            displayChart(data.chart_data);
        } else {
            alert(data.error);
        }
    })
    .catch(error => {
        debugLog('Visualization error', error);
        alert('Visualization failed: ' + error.message);
    });
}

// Display chart
function displayChart(chartData) {
    debugLog('Displaying chart', chartData);
    
    const container = document.getElementById('chartContainer');
    container.style.display = 'block';
    
    try {
        const parsedData = JSON.parse(chartData);
        Plotly.newPlot(container, parsedData.data, parsedData.layout);
    } catch (error) {
        debugLog('Chart parsing error', error);
        container.innerHTML = '<div class="alert alert-error">Error displaying chart: ' + error.message + '</div>';
    }
}

// Clean data
function cleanData() {
    const action = document.getElementById('cleaningAction').value;
    if (!action) {
        alert('Please select an action');
        return;
    }

    const columns = Array.from(document.getElementById('cleaningColumnSelect').selectedOptions).map(opt => opt.value);

    debugLog('Cleaning data', {action, columns});

    fetch('/clean_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: action,
            columns: columns
        })
    })
    .then(response => response.json())
    .then(data => {
        debugLog('Cleaning response', data);
        
        if (data.success) {
            document.getElementById('cleaningStatus').innerHTML = 
                `<div class="alert alert-success">${data.message}</div>`;
            
            // Update current data info
            if (data.data_info) {
                currentData.data_info = data.data_info;
                currentData.shape = data.data_info.shape;
                currentColumns = data.data_info.columns;
                updateColumnSelections();
            }
        } else {
            document.getElementById('cleaningStatus').innerHTML = 
                `<div class="alert alert-error">${data.error}</div>`;
        }
    })
    .catch(error => {
        debugLog('Cleaning error', error);
        document.getElementById('cleaningStatus').innerHTML = 
            `<div class="alert alert-error">Cleaning failed: ${error.message}</div>`;
    });
}

// Generate report
function generateReport() {
    if (!currentData) {
        alert('Please upload data first');
        return;
    }

    debugLog('Generating report');

    document.getElementById('reportLoading').style.display = 'block';
    document.getElementById('reportPreview').style.display = 'none';

    fetch('/generate_report', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('reportLoading').style.display = 'none';
        
        debugLog('Report response', data);
        
        if (data.success) {
            document.getElementById('reportPreview').innerHTML = data.report_html;
            document.getElementById('reportPreview').style.display = 'block';
            document.getElementById('downloadBtn').style.display = 'inline-block';
        } else {
            alert(data.error);
        }
    })
    .catch(error => {
        debugLog('Report error', error);
        document.getElementById('reportLoading').style.display = 'none';
        alert('Report generation failed: ' + error.message);
    });
}

// Download report
function downloadReport() {
    debugLog('Downloading report');

    fetch('/download_report', {
        method: 'POST'
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eda_report_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    })
    .catch(error => {
        debugLog('Download error', error);
        alert('Download failed: ' + error.message);
    });
}

// Initialize the application
function initApp() {
    debugLog('Initializing EDA Tool');
    
    // Remove drag and drop functionality - just keep basic file input
    
    // Show/hide cleaning columns based on action
    const cleaningAction = document.getElementById('cleaningAction');
    if (cleaningAction) {
        cleaningAction.addEventListener('change', function() {
            const action = this.value;
            const columnsDiv = document.getElementById('cleaningColumns');
            
            if (action === 'drop_missing' || action === 'drop_duplicates') {
                columnsDiv.style.display = 'block';
            } else {
                columnsDiv.style.display = 'block';
            }
        });
    }
    
    debugLog('EDA Tool initialized successfully');
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
