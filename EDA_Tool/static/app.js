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
            // Call handleUploadSuccess instead of duplicating logic
            handleUploadSuccess(data);
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

// Update upload status
function updateUploadStatus(message, type) {
    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadStatus) {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
        uploadStatus.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    }
}

// Enable other tabs after data upload
function enableTabs() {
    debugLog('Enabling tabs');
    
    // Enable all tabs except Data Upload
    const tabs = document.querySelectorAll('.tab:not([data-tab="dataUpload"])');
    tabs.forEach(tab => {
        tab.classList.remove('disabled');
        tab.style.pointerEvents = 'auto';
        tab.style.opacity = '1';
    });
    
    // Add click event listeners to enabled tabs
    tabs.forEach(tab => {
        const tabName = tab.getAttribute('data-tab');
        if (tabName) {
            tab.addEventListener('click', () => showTab(tabName));
        }
    });
    
    debugLog('Tabs enabled');
}

// Handle successful data upload
function handleUploadSuccess(data) {
    debugLog('=== UPLOAD SUCCESS ===');
    debugLog('Raw data received:', data);
    debugLog('Data type:', typeof data);
    debugLog('Data keys:', Object.keys(data));
    
    // Store data globally - ensure it's accessible
    window.currentData = data;
    currentData = data;
    currentColumns = data.data_info?.columns || [];
    
    // Also store in sessionStorage as backup
    try {
        sessionStorage.setItem('currentData', JSON.stringify(data));
        debugLog('Data stored in sessionStorage');
    } catch (e) {
        debugLog('Failed to store in sessionStorage:', e);
    }
    
    debugLog('Stored currentData:', currentData);
    debugLog('Stored currentColumns:', currentColumns);
    debugLog('Window currentData:', window.currentData);
    
    // Update UI
    updateUploadStatus('Data loaded successfully!', 'success');
    
    // Display data preview
    displayDataPreview(data);
    
    // Enable other tabs
    enableTabs();
    
    debugLog('=== UPLOAD SUCCESS COMPLETE ===');
}

// Display data preview
function displayDataPreview(data) {
    debugLog('Displaying data preview', data);
    
    const previewDiv = document.getElementById('dataPreview');
    const infoDiv = document.getElementById('dataInfo');
    const tableContainer = document.getElementById('dataTableContainer');

    // Extract data from the correct structure
    const dataInfo = data.data_info;
    
    // Safely get values with fallbacks
    const shape = dataInfo?.shape || [0, 0];
    const memoryUsage = dataInfo?.memory_usage || 0;
    const nullCounts = dataInfo?.null_counts || {};
    const duplicateRows = dataInfo?.duplicate_rows || 0;
    const dtypes = dataInfo?.dtypes || {};
    
    // Calculate missing values total
    const missingTotal = Object.values(nullCounts).reduce((sum, count) => sum + (count || 0), 0);
    
    // Calculate data quality metrics
    const totalCells = shape[0] * shape[1];
    const completeness = totalCells > 0 ? ((totalCells - missingTotal) / totalCells * 100).toFixed(2) : '0.00';
    const missingRate = totalCells > 0 ? (missingTotal / totalCells * 100).toFixed(2) : '0.00';
    const duplicateRate = shape[0] > 0 ? (duplicateRows / shape[0] * 100).toFixed(2) : '0.00';

    debugLog('Processed values:', {
        shape,
        memoryUsage,
        missingTotal,
        duplicateRows,
        completeness,
        missingRate,
        duplicateRate
    });

    // Create the HTML content
    const htmlContent = `
        <!-- Summary Stats Grid (1x4) - Single Row -->
        <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 30px;">
            <div class="stat-card">
                <div class="stat-header">
                    <i class="fas fa-table"></i>
                    <h3>Dataset Shape</h3>
                </div>
                <div class="stat-content">
                    <p><strong>Rows:</strong> ${shape[0]}</p>
                    <p><strong>Columns:</strong> ${shape[1]}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <i class="fas fa-hdd"></i>
                    <h3>Memory Usage</h3>
                </div>
                <div class="stat-content">
                    <p><strong>Size:</strong> ${(memoryUsage / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Missing Values</h3>
                </div>
                <div class="stat-content">
                    <p><strong>Total:</strong> ${missingTotal}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <i class="fas fa-copy"></i>
                    <h3>Duplicate Rows</h3>
                </div>
                <div class="stat-content">
                    <p><strong>Count:</strong> ${duplicateRows}</p>
                </div>
            </div>
        </div>
        
        <!-- Dataset Information Table (df.info equivalent) -->
        <h4 style="margin: 20px 0 15px 0; color: var(--text-primary);">Dataset Information</h4>
        <table class="data-info-table">
            <thead>
                <tr>
                    <th>Column</th>
                    <th>Non-Null Count</th>
                    <th>Missing Values</th>
                    <th>Dtype</th>
                    <th>Memory Usage</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(dtypes).map(([col, dtype]) => {
                    const nullCount = nullCounts[col] || 0;
                    const nonNullCount = shape[0] - nullCount;
                    const colMemory = (memoryUsage / shape[1] / 1024).toFixed(2);
                    
                    return `
                        <tr>
                            <td><strong>${col}</strong></td>
                            <td>${nonNullCount}</td>
                            <td>${nullCount}</td>
                            <td>${dtype}</td>
                            <td>${colMemory} KB</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        
        <!-- File Information -->
        <h4 style="margin: 30px 0 15px 0; color: var(--text-primary);">File Information</h4>
        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
            <div class="stat-card">
                <div class="stat-header">
                    <i class="fas fa-file-alt"></i>
                    <h3>File Details</h3>
                </div>
                <div class="stat-content">
                    <p><strong>Upload Time:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>File Size:</strong> ${(memoryUsage / 1024 / 1024).toFixed(2)} MB</p>
                    <p><strong>Data Format:</strong> Table</p>
                    <p><strong>Encoding:</strong> UTF-8</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <i class="fas fa-chart-line"></i>
                    <h3>Data Quality</h3>
                </div>
                <div class="stat-content">
                    <p><strong>Completeness:</strong> ${completeness}%</p>
                    <p><strong>Missing Rate:</strong> ${missingRate}%</p>
                    <p><strong>Duplicate Rate:</strong> ${duplicateRate}%</p>
                </div>
            </div>
        </div>
    `;

    // Set the HTML content
    infoDiv.innerHTML = htmlContent;
    
    // Debug: Check if content was set
    debugLog('HTML content length:', htmlContent.length);
    debugLog('First stat card content:', infoDiv.querySelector('.stat-card .stat-content')?.innerHTML);

    // Show initial data table (HEAD by default)
    showDataView('head');

    previewDiv.style.display = 'block';
}

// Show data view (HEAD or TAIL)
function showDataView(view) {
    currentDataView = view;
    
    debugLog(`Switching to ${view} view`);
    debugLog('Current data:', currentData);
    
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
        debugLog('Displaying HEAD data:', currentData.preview_head);
        tableContainer.innerHTML = `
            <h4>First 10 rows:</h4>
            ${createDataTable(currentData.preview_head, 'head')}
        `;
    } else {
        debugLog('Displaying TAIL data:', currentData.preview_tail);
        tableContainer.innerHTML = `
            <h4>Last 10 rows:</h4>
            ${createDataTable(currentData.preview_tail, 'tail')}
        `;
    }
}

// Create data table HTML - UNPIVOTED VERSION with better debugging
function createDataTable(data, type) {
    debugLog(`Creating ${type} data table`, data);
    
    if (!data || Object.keys(data).length === 0) {
        debugLog(`No data for ${type} table`);
        return '<p>No data to display</p>';
    }

    // The data structure from backend is: {column_name: {row_index: value}}
    // We need to unpivot this to show rows as rows and columns as columns
    const columns = Object.keys(data);
    
    // Fix: Handle empty data more gracefully
    if (columns.length === 0) {
        debugLog(`No columns found for ${type} table`);
        return '<p>No data available</p>';
    }
    
    // Debug: Log the structure of each column
    columns.forEach(col => {
        debugLog(`Column ${col} data:`, data[col]);
    });
    
    const maxRows = Math.max(...columns.map(col => {
        const colData = data[col];
        if (!colData || typeof colData !== 'object') {
            debugLog(`Column ${col} has invalid data:`, colData);
            return 0;
        }
        const rowCount = Object.keys(colData).length;
        debugLog(`Column ${col} has ${rowCount} rows`);
        return rowCount;
    }));
    
    debugLog(`Columns: ${columns.length}, Max rows: ${maxRows}`);
    
    if (maxRows === 0) {
        debugLog(`No rows found for ${type} table`);
        return '<p>No rows available</p>';
    }

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
            const colData = data[column];
            let value = '';
            
            if (colData && typeof colData === 'object') {
                // Try to get value by index
                value = colData[i] !== undefined ? colData[i] : '';
                
                // If that fails, try to get the last few values for tail
                if (type === 'tail' && value === '') {
                    const rowKeys = Object.keys(colData).map(Number).sort((a, b) => a - b);
                    const lastIndex = rowKeys[rowKeys.length - 1];
                    if (lastIndex !== undefined) {
                        value = colData[lastIndex - (maxRows - 1 - i)] || '';
                    }
                }
            }
            
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

// Start data analysis - with comprehensive debugging
function startAnalysis() {
    debugLog('=== STARTING ANALYSIS ===');
    debugLog('Local currentData:', currentData);
    debugLog('Global currentData:', window.currentData);
    debugLog('SessionStorage data:', sessionStorage.getItem('currentData'));
    
    // Try to get data from multiple sources
    let dataToAnalyze = null;
    
    if (currentData) {
        dataToAnalyze = currentData;
        debugLog('Using local currentData');
    } else if (window.currentData) {
        dataToAnalyze = window.currentData;
        debugLog('Using global currentData');
    } else {
        const storedData = sessionStorage.getItem('currentData');
        if (storedData) {
            try {
                dataToAnalyze = JSON.parse(storedData);
                debugLog('Using sessionStorage data');
            } catch (e) {
                debugLog('Failed to parse sessionStorage data:', e);
            }
        }
    }
    
    if (!dataToAnalyze) {
        debugLog('NO DATA FOUND ANYWHERE!');
        showNotification('No data available for analysis. Please upload a file first.', 'error');
        return;
    }
    
    debugLog('Final data to analyze:', dataToAnalyze);
    debugLog('Data type:', typeof dataToAnalyze);
    debugLog('Data keys:', Object.keys(dataToAnalyze));
    
    // Show loading state
    const analysisContent = document.getElementById('analysisContent');
    if (analysisContent) {
        analysisContent.innerHTML = '<div class="loading">Analyzing data...</div>';
    } else {
        debugLog('analysisContent element not found!');
        return;
    }
    
    // Send analysis request
    fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: dataToAnalyze
        })
    })
    .then(response => {
        debugLog('Analysis response status:', response.status);
        return response.json();
    })
    .then(data => {
        debugLog('Analysis response received:', data);
        
        if (data.error) {
            showNotification(`Analysis failed: ${data.error}`, 'error');
            if (analysisContent) {
                analysisContent.innerHTML = `<div class="error">Analysis failed: ${data.error}</div>`;
            }
        } else {
            displayAnalysisResults(data);
        }
    })
    .catch(error => {
        debugLog('Analysis error:', error);
        showNotification('Analysis failed. Please try again.', 'error');
        if (analysisContent) {
            analysisContent.innerHTML = `<div class="error">Analysis failed: ${error.message}</div>`;
        }
    });
}

// Display analysis results
function displayAnalysisResults(data) {
    debugLog('Displaying analysis results:', data);
    
    const analysisContent = document.getElementById('analysisContent');
    
    let html = '<div class="analysis-results">';
    
    // Basic Statistics Section - Tabular Format
    if (data.basic_stats) {
        html += `
            <div class="analysis-section">
                <h3><i class="fas fa-chart-bar"></i> Basic Statistics</h3>
                <div class="table-container">
                    <table class="analysis-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                ${Object.keys(data.basic_stats).map(col => `<th>${col}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td><strong>Count</strong></td>${Object.keys(data.basic_stats).map(col => `<td>${data.basic_stats[col].count}</td>`).join('')}</tr>
                            <tr><td><strong>Mean</strong></td>${Object.keys(data.basic_stats).map(col => `<td>${data.basic_stats[col].mean?.toFixed(3) || 'N/A'}</td>`).join('')}</tr>
                            <tr><td><strong>Std</strong></td>${Object.keys(data.basic_stats).map(col => `<td>${data.basic_stats[col].std?.toFixed(3) || 'N/A'}</td>`).join('')}</tr>
                            <tr><td><strong>Min</strong></td>${Object.keys(data.basic_stats).map(col => `<td>${data.basic_stats[col].min}</td>`).join('')}</tr>
                            <tr><td><strong>25%</strong></td>${Object.keys(data.basic_stats).map(col => `<td>${data.basic_stats[col]['25%']}</td>`).join('')}</tr>
                            <tr><td><strong>50%</strong></td>${Object.keys(data.basic_stats).map(col => `<td>${data.basic_stats[col]['50%']}</td>`).join('')}</tr>
                            <tr><td><strong>75%</strong></td>${Object.keys(data.basic_stats).map(col => `<td>${data.basic_stats[col]['75%']}</td>`).join('')}</tr>
                            <tr><td><strong>Max</strong></td>${Object.keys(data.basic_stats).map(col => `<td>${data.basic_stats[col].max}</td>`).join('')}</tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Data Types Section - Tabular Format
    if (data.dtypes) {
        html += `
            <div class="analysis-section">
                <h3><i class="fas fa-cogs"></i> Data Types</h3>
                <div class="table-container">
                    <table class="analysis-table">
                        <thead>
                            <tr>
                                <th>Column</th>
                                <th>Data Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(data.dtypes).map(column => `
                                <tr>
                                    <td><strong>${column}</strong></td>
                                    <td><span class="dtype-badge">${data.dtypes[column]}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Missing Values Section - Tabular Format
    if (data.missing_values) {
        html += `
            <div class="analysis-section">
                <h3><i class="fas fa-exclamation-triangle"></i> Missing Values</h3>
                <div class="table-container">
                    <table class="analysis-table">
                        <thead>
                            <tr>
                                <th>Column</th>
                                <th>Missing Count</th>
                                <th>Missing Percentage</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(data.missing_values).map(column => {
                                const missingCount = data.missing_values[column];
                                const totalCount = data.basic_stats?.[column]?.count || 0;
                                const missingPercentage = totalCount > 0 ? ((missingCount / totalCount) * 100).toFixed(2) : 0;
                                const status = missingPercentage == 0 ? 'Perfect' : missingPercentage < 5 ? 'Good' : missingPercentage < 20 ? 'Warning' : 'Critical';
                                const statusClass = status === 'Perfect' ? 'status-perfect' : status === 'Good' ? 'status-good' : status === 'Warning' ? 'status-warning' : 'status-critical';
                                
                                return `
                                    <tr>
                                        <td><strong>${column}</strong></td>
                                        <td>${missingCount}</td>
                                        <td>${missingPercentage}%</td>
                                        <td><span class="status-badge ${statusClass}">${status}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Correlation Matrix Section - Enhanced with Conditional Formatting
    if (data.correlation) {
        html += `
            <div class="analysis-section">
                <h3><i class="fas fa-project-diagram"></i> Correlation Matrix</h3>
                <div class="table-container">
                    <table class="correlation-table">
                        <thead>
                            <tr>
                                <th></th>
                                ${Object.keys(data.correlation).map(col => `<th>${col}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(data.correlation).map(row => `
                                <tr>
                                    <td><strong>${row}</strong></td>
                                    ${Object.keys(data.correlation[row]).map(col => {
                                        const corrValue = data.correlation[row][col];
                                        const cellClass = getCorrelationClass(corrValue);
                                        const displayValue = corrValue !== null && corrValue !== undefined ? corrValue.toFixed(3) : 'N/A';
                                        
                                        return `<td class="${cellClass}">${displayValue}</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="correlation-legend">
                    <span class="legend-item"><span class="legend-color perfect"></span> Perfect (1.0)</span>
                    <span class="legend-item"><span class="legend-color strong"></span> Strong (≥0.7)</span>
                    <span class="legend-item"><span class="legend-color moderate"></span> Moderate (≥0.3)</span>
                    <span class="legend-item"><span class="legend-color weak"></span> Weak (≥0.0)</span>
                    <span class="legend-item"><span class="legend-color weak-neg"></span> Weak Negative (≥-0.3)</span>
                    <span class="legend-item"><span class="legend-color moderate-neg"></span> Moderate Negative (≥-0.7)</span>
                    <span class="legend-item"><span class="legend-color strong-neg"></span> Strong Negative (<-0.7)</span>
                </div>
            </div>
        `;
    }
    
    // Outlier Analysis Section - Fixed with Real Calculations
    if (data.numerical_analysis) {
        html += `
            <div class="analysis-section">
                <h3><i class="fas fa-bullseye"></i> Outlier Analysis</h3>
                <div class="table-container">
                    <table class="analysis-table">
                        <thead>
                            <tr>
                                <th>Column</th>
                                <th>Q1</th>
                                <th>Q3</th>
                                <th>IQR</th>
                                <th>Lower Bound</th>
                                <th>Upper Bound</th>
                                <th>Outlier Count</th>
                                <th>Outlier %</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(data.numerical_analysis).map(column => {
                                const stats = data.basic_stats[column];
                                const q1 = stats['25%'];
                                const q3 = stats['75%'];
                                const iqr = q3 - q1;
                                const lowerBound = q1 - (1.5 * iqr);
                                const upperBound = q3 + (1.5 * iqr);
                                
                                // Calculate actual outliers from the data
                                let outlierCount = 0;
                                if (data.preview_head && data.preview_head[column]) {
                                    // Count outliers in the data
                                    const columnData = data.preview_head[column];
                                    Object.values(columnData).forEach(value => {
                                        if (value !== null && value !== undefined) {
                                            const numValue = parseFloat(value);
                                            if (!isNaN(numValue) && (numValue < lowerBound || numValue > upperBound)) {
                                                outlierCount++;
                                            }
                                        }
                                    });
                                }
                                
                                // Also check tail data if available
                                if (data.preview_tail && data.preview_tail[column]) {
                                    const columnData = data.preview_tail[column];
                                    Object.values(columnData).forEach(value => {
                                        if (value !== null && value !== undefined) {
                                            const numValue = parseFloat(value);
                                            if (!isNaN(numValue) && (numValue < lowerBound || numValue > upperBound)) {
                                                outlierCount++;
                                            }
                                        }
                                    });
                                }
                                
                                const totalCount = stats.count;
                                const outlierPercentage = totalCount > 0 ? ((outlierCount / totalCount) * 100).toFixed(2) : '0.00';
                                
                                return `
                                    <tr>
                                        <td><strong>${column}</strong></td>
                                        <td>${q1?.toFixed(3) || 'N/A'}</td>
                                        <td>${q3?.toFixed(3) || 'N/A'}</td>
                                        <td>${iqr?.toFixed(3) || 'N/A'}</td>
                                        <td>${lowerBound?.toFixed(3) || 'N/A'}</td>
                                        <td>${upperBound?.toFixed(3) || 'N/A'}</td>
                                        <td>${outlierCount}</td>
                                        <td>${outlierPercentage}%</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="outlier-info">
                    <p><strong>Outlier Detection Method:</strong> IQR (Interquartile Range) Method</p>
                    <ul>
                        <li><strong>Lower Bound:</strong> Q1 - 1.5 × IQR</li>
                        <li><strong>Upper Bound:</strong> Q3 + 1.5 × IQR</li>
                        <li><strong>Outliers:</strong> Values outside these bounds</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    // Normality Tests Section - New
    if (data.numerical_analysis) {
        html += `
            <div class="analysis-section">
                <h3><i class="fas fa-bell-curve"></i> Normality Tests</h3>
                <div class="table-container">
                    <table class="analysis-table">
                        <thead>
                            <tr>
                                <th>Column</th>
                                <th>Skewness</th>
                                <th>Kurtosis</th>
                                <th>Normality Assessment</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(data.numerical_analysis).map(column => {
                                const analysis = data.numerical_analysis[column];
                                const skewness = analysis.skewness;
                                const kurtosis = analysis.kurtosis;
                                
                                // Normality assessment based on skewness and kurtosis
                                let normalityAssessment = 'Normal';
                                let assessmentClass = 'assessment-normal';
                                
                                if (Math.abs(skewness) > 1 || Math.abs(kurtosis) > 2) {
                                    normalityAssessment = 'Non-Normal';
                                    assessmentClass = 'assessment-non-normal';
                                } else if (Math.abs(skewness) > 0.5 || Math.abs(kurtosis) > 1) {
                                    normalityAssessment = 'Moderately Skewed';
                                    assessmentClass = 'assessment-moderate';
                                }
                                
                                return `
                                    <tr>
                                        <td><strong>${column}</strong></td>
                                        <td>${skewness?.toFixed(3) || 'N/A'}</td>
                                        <td>${kurtosis?.toFixed(3) || 'N/A'}</td>
                                        <td><span class="assessment-badge ${assessmentClass}">${normalityAssessment}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="normality-legend">
                    <p><strong>Normality Assessment Guide:</strong></p>
                    <ul>
                        <li><strong>Normal:</strong> |Skewness| ≤ 0.5 and |Kurtosis| ≤ 1</li>
                        <li><strong>Moderately Skewed:</strong> |Skewness| > 0.5 or |Kurtosis| > 1</li>
                        <li><strong>Non-Normal:</strong> |Skewness| > 1 or |Kurtosis| > 2</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    // Unique Values Section - Enhanced
    if (data.unique_values) {
        html += `
            <div class="analysis-section">
                <h3><i class="fas fa-tags"></i> Unique Values</h3>
                <div class="unique-values-grid">
                    ${Object.keys(data.unique_values).map(column => {
                        const uniqueVals = data.unique_values[column];
                        const totalCount = data.basic_stats?.[column]?.count || 0;
                        const uniqueCount = uniqueVals.length;
                        const cardinality = totalCount > 0 ? (uniqueCount / totalCount * 100).toFixed(2) : 0;
                        
                        return `
                            <div class="unique-value-item">
                                <h4>${column}</h4>
                                <div class="unique-stats">
                                    <span class="stat-item">Total: ${totalCount}</span>
                                    <span class="stat-item">Unique: ${uniqueCount}</span>
                                    <span class="stat-item">Cardinality: ${cardinality}%</span>
                                </div>
                                <div class="unique-values-list">
                                    ${uniqueVals.map(val => `<span class="unique-value">${val}</span>`).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    
    analysisContent.innerHTML = html;
}

// Enhanced correlation class function
function getCorrelationClass(value) {
    if (value === null || value === undefined) return 'correlation-na';
    if (value === 1) return 'correlation-perfect';
    if (value >= 0.7) return 'correlation-strong';
    if (value >= 0.3) return 'correlation-moderate';
    if (value >= 0) return 'correlation-weak';
    if (value >= -0.3) return 'correlation-weak-neg';
    if (value >= -0.7) return 'correlation-moderate-neg';
    return 'correlation-strong-neg';
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
