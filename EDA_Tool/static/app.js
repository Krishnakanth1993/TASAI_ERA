// Global variables
let currentData = null;
let currentColumns = [];
let currentDataView = 'head'; // Track current data view
let addedCharts = []; // Store charts added to report

// Global variables for cleaning recommendations
let cleaningRecommendations = null;

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
    
    // Auto-scroll to Data Review section
    setTimeout(() => {
        debugLog('Attempting to scroll to Data Review section');
        
        let targetElement = document.getElementById('dataPreview') || 
                           document.querySelector('.tab-content.active') ||
                           document.querySelector('[data-tab="dataPreview"]');
        
        if (targetElement) {
            debugLog('Found target element, scrolling...', targetElement);
            targetElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        } else {
            debugLog('Target element not found, trying alternative approach');
            const firstTabContent = document.querySelector('.tab-content');
            if (firstTabContent) {
                firstTabContent.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        }
    }, 1000);
    
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
    debugLog('Current data available:', currentData);
    debugLog('Current columns available:', currentColumns);

    if (!chartType) {
        columnSelection.innerHTML = '';
        columnSelection.style.display = 'none';
        createChartBtn.disabled = true;
        return;
    }

    // Get columns from currentData if currentColumns is empty
    let availableColumns = currentColumns;
    if (!availableColumns || availableColumns.length === 0) {
        if (currentData && currentData.data_info && currentData.data_info.columns) {
            availableColumns = currentData.data_info.columns;
            debugLog('Using columns from currentData:', availableColumns);
        } else {
            columnSelection.innerHTML = '<div class="alert alert-error">Please upload data first</div>';
            createChartBtn.disabled = true;
            return;
        }
    }

    debugLog('Available columns for selection:', availableColumns);

    let html = '';
    let columnClass = 'single-column';
    
    if (chartType === 'histogram' || chartType === 'boxplot' || chartType === 'bar') {
        columnClass = 'single-column';
        html = `
            <div class="column-selection-group">
                <label>Select Column:</label>
                <select id="chartColumn1" class="form-control">
                    <option value="">Choose column</option>
                    ${availableColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
                </select>
            </div>
        `;
    } else if (chartType === 'scatter') {
        columnClass = 'two-column';
        html = `
            <div class="column-selection-group">
                <label>X Column:</label>
                <select id="chartColumn1" class="form-control">
                    <option value="">Choose X column</option>
                    ${availableColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
                </select>
            </div>
            <div class="column-selection-group">
                <label>Y Column:</label>
                <select id="chartColumn2" class="form-control">
                    <option value="">Choose Y column</option>
                    ${availableColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
                </select>
            </div>
        `;
    } else if (chartType === 'correlation') {
        columnClass = 'single-column';
        html = '<div class="alert alert-info">Correlation heatmap will be generated for all numerical columns</div>';
    }

    // Update the column selection with proper classes and layout
    columnSelection.innerHTML = html;
    columnSelection.className = columnClass; // Apply the appropriate class
    columnSelection.style.display = 'block';
    createChartBtn.disabled = false;
    
    debugLog('Column selection HTML generated:', html);
    debugLog('Column selection class applied:', columnClass);
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
async function startAnalysis() {
    try {
        console.log('Starting analysis...');
    
    // Show loading state
        document.getElementById('analysisContent').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Analyzing your dataset...</p>
            </div>
        `;
        
        const response = await fetch('/analyze', {
        method: 'POST',
        headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('Analysis completed successfully');

// Display analysis results
            displayAnalysisResults(data);
            
            // Show the cleaning recommendations button AFTER analysis is complete
            document.getElementById('cleaningRecommendationsBtn').style.display = 'inline-block';
            
            // Show success message
            showNotification('Analysis completed successfully!', 'success');
            
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        document.getElementById('analysisContent').innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-triangle"></i>
                Analysis failed: ${error.message}
            </div>
        `;
        
        // Hide the button if analysis fails
        document.getElementById('cleaningRecommendationsBtn').style.display = 'none';
    }
}

// Function to display analysis results
function displayAnalysisResults(data) {
    const content = document.getElementById('analysisContent');
    
    let html = '<div class="analysis-results">';
    html += '<h3><i class="fas fa-chart-bar"></i> Analysis Results</h3>';
    
    // Basic statistics
    if (data.basic_stats) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-calculator"></i> Basic Statistics</h4>';
        html += '<div class="stats-table-container">';
        html += '<table class="stats-table">';
        html += '<thead><tr><th>Column</th><th>Count</th><th>Mean</th><th>Std</th><th>Min</th><th>25%</th><th>50%</th><th>75%</th><th>Max</th></tr></thead>';
        html += '<tbody>';
        
        for (const [col, stats] of Object.entries(data.basic_stats)) {
            if (typeof stats === 'object' && stats !== null) {
                html += '<tr>';
                html += `<td class="column-name"><i class="fas fa-columns"></i> ${col}</td>`;
                html += `<td class="stat-value">${stats.count || 'N/A'}</td>`;
                html += `<td class="stat-value">${stats.mean ? stats.mean.toFixed(4) : 'N/A'}</td>`;
                html += `<td class="stat-value">${stats.std ? stats.std.toFixed(4) : 'N/A'}</td>`;
                html += `<td class="stat-value">${stats.min || 'N/A'}</td>`;
                html += `<td class="stat-value">${stats['25%'] || 'N/A'}</td>`;
                html += `<td class="stat-value">${stats['50%'] || 'N/A'}</td>`;
                html += `<td class="stat-value">${stats['75%'] || 'N/A'}</td>`;
                html += `<td class="stat-value">${stats.max || 'N/A'}</td>`;
                html += '</tr>';
            }
        }
        html += '</tbody></table></div></div>';
    }
    
    // Missing values
    if (data.missing_values) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-exclamation-triangle"></i> Missing Values</h4>';
        html += '<div class="missing-values-container">';
        
        const hasMissingValues = Object.values(data.missing_values).some(count => count > 0);
        
        if (hasMissingValues) {
            html += '<table class="missing-table">';
            html += '<thead><tr><th>Column</th><th>Missing Count</th><th>Missing %</th><th>Status</th></tr></thead>';
            html += '<tbody>';
            
        for (const [col, count] of Object.entries(data.missing_values)) {
            if (count > 0) {
                    const percentage = ((count / data.basic_stats[col]?.count) * 100).toFixed(2);
                    const status = percentage > 20 ? 'high' : percentage > 5 ? 'medium' : 'low';
                    html += `<tr class="missing-row ${status}">`;
                    html += `<td><i class="fas fa-columns"></i> ${col}</td>`;
                    html += `<td>${count}</td>`;
                    html += `<td>${percentage}%</td>`;
                    html += `<td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>`;
            html += '</tr>';
        }
            }
            html += '</tbody></table>';
        } else {
            html += '<div class="no-missing-values">';
            html += '<i class="fas fa-check-circle"></i>';
            html += '<p>No missing values found in the dataset!</p>';
    html += '</div>';
        }
        html += '</div></div>';
    }
    
    // Outlier Analysis
    if (data.outliers) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-bullseye"></i> Outlier Analysis</h4>';
        html += '<div class="outliers-container">';
        
        const hasOutliers = Object.values(data.outliers).some(outlier => outlier.count > 0);
        
        if (hasOutliers) {
            html += '<table class="outliers-table">';
            html += '<thead><tr><th>Column</th><th>Outlier Count</th><th>Lower Bound</th><th>Upper Bound</th><th>Status</th></tr></thead>';
            html += '<tbody>';
            
            for (const [col, outlier] of Object.entries(data.outliers)) {
                if (outlier.count > 0) {
                    const percentage = ((outlier.count / data.basic_stats[col]?.count) * 100).toFixed(2);
                    const status = percentage > 10 ? 'high' : percentage > 5 ? 'medium' : 'low';
                    html += `<tr class="outlier-row ${status}">`;
                    html += `<td><i class="fas fa-columns"></i> ${col}</td>`;
                    html += `<td>${outlier.count} (${percentage}%)</td>`;
                    html += `<td>${outlier.lower_bound ? outlier.lower_bound.toFixed(4) : 'N/A'}</td>`;
                    html += `<td>${outlier.upper_bound ? outlier.upper_bound.toFixed(4) : 'N/A'}</td>`;
                    html += `<td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>`;
                    html += '</tr>';
                }
            }
            html += '</tbody></table>';
                } else {
            html += '<div class="no-outliers">';
            html += '<i class="fas fa-check-circle"></i>';
            html += '<p>No outliers detected using IQR method!</p>';
    html += '</div>';
        }
        html += '</div></div>';
    }
    
    // Normality Tests
    if (data.normality_tests) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-chart-line"></i> Normality Tests</h4>';
        html += '<div class="normality-container">';
        html += '<table class="normality-table">';
        html += '<thead><tr><th>Column</th><th>Skewness</th><th>Kurtosis</th><th>Normality</th><th>Assessment</th></tr></thead>';
        html += '<tbody>';
        
        for (const [col, test] of Object.entries(data.normality_tests)) {
            const skewness = test.skewness;
            const kurtosis = test.kurtosis;
            
            // Determine normality
            let normality, assessment, status;
            if (Math.abs(skewness) <= 0.5 && Math.abs(kurtosis) <= 1) {
                normality = 'Normal';
                assessment = 'Data follows normal distribution';
                status = 'normal';
            } else if (Math.abs(skewness) <= 1 && Math.abs(kurtosis) <= 2) {
                normality = 'Moderate';
                assessment = 'Slight deviation from normal';
                status = 'moderate';
        } else {
                normality = 'Non-Normal';
                assessment = 'Significant deviation from normal';
                status = 'non-normal';
            }
            
            html += `<tr class="normality-row ${status}">`;
            html += `<td><i class="fas fa-columns"></i> ${col}</td>`;
            html += `<td class="${Math.abs(skewness) > 1 ? 'highlight' : ''}">${skewness ? skewness.toFixed(4) : 'N/A'}</td>`;
            html += `<td class="${Math.abs(kurtosis) > 2 ? 'highlight' : ''}">${kurtosis ? kurtosis.toFixed(4) : 'N/A'}</td>`;
            html += `<td><span class="normality-badge ${status}">${normality}</span></td>`;
            html += `<td>${assessment}</td>`;
            html += '</tr>';
        }
        html += '</tbody></table></div></div>';
    }
    
    // Correlation matrix
    if (data.correlation) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-project-diagram"></i> Correlation Matrix</h4>';
        html += '<div class="correlation-container">';
        html += '<table class="correlation-table">';
        html += '<thead><tr><th>Column</th>';
        for (const col of Object.keys(data.correlation)) {
            html += `<th>${col}</th>`;
        }
        html += '</tr></thead><tbody>';
        
        for (const [col1, correlations] of Object.entries(data.correlation)) {
            html += '<tr>';
            html += `<td class="column-header"><i class="fas fa-columns"></i> ${col1}</td>`;
            for (const [col2, corr] of Object.entries(correlations)) {
                if (col1 === col2) {
                    html += '<td class="diagonal">1.000</td>';
                } else {
                    const corrValue = corr ? parseFloat(corr) : 0;
                    let correlationClass = '';
                    if (Math.abs(corrValue) >= 0.7) correlationClass = 'high-correlation';
                    else if (Math.abs(corrValue) >= 0.3) correlationClass = 'medium-correlation';
                    else correlationClass = 'low-correlation';
                    
                    html += `<td class="correlation-cell ${correlationClass}">${corrValue.toFixed(3)}</td>`;
                }
            }
            html += '</tr>';
        }
        html += '</tbody></table></div></div>';
    }
    
    // Data types
    if (data.dtypes) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-tags"></i> Data Types</h4>';
        html += '<div class="dtypes-container">';
        html += '<table class="dtypes-table">';
        html += '<thead><tr><th>Column</th><th>Data Type</th><th>Category</th></tr></thead>';
        html += '<tbody>';
        
        for (const [col, dtype] of Object.entries(data.dtypes)) {
            let category, icon;
            if (dtype.includes('int') || dtype.includes('float')) {
                category = 'Numerical';
                icon = 'fas fa-hashtag';
            } else if (dtype.includes('object') || dtype.includes('category')) {
                category = 'Categorical';
                icon = 'fas fa-list';
            } else if (dtype.includes('datetime')) {
                category = 'DateTime';
                icon = 'fas fa-calendar';
            } else {
                category = 'Other';
                icon = 'fas fa-question';
            }
            
            html += '<tr>';
            html += `<td><i class="fas fa-columns"></i> ${col}</td>`;
            html += `<td><code>${dtype}</code></td>`;
            html += `<td><i class="${icon}"></i> ${category}</td>`;
            html += '</tr>';
        }
        html += '</tbody></table></div></div>';
    }
    
    html += '</div>';
    content.innerHTML = html;
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

// Create visualization - Enhanced with labeling
function createVisualization() {
    const chartType = document.getElementById('chartType').value;
    if (!chartType) return;

    // Check if we have data
    if (!currentData || !currentData.data_info) {
        alert('Please upload data first');
        return;
    }

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

    debugLog('Creating visualization', {chartType, columns, currentData});

    // Show loading state
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.style.display = 'block';
    chartContainer.innerHTML = '<div class="loading">Generating chart...</div>';

    // Use backend for full dataset visualization
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
            // Show chart labeling section after chart is created
            showChartLabeling(chartType, columns);
        } else {
            chartContainer.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
        }
    })
    .catch(error => {
        debugLog('Visualization error', error);
        chartContainer.innerHTML = `<div class="alert alert-error">Visualization failed: ${error.message}</div>`;
    });
}

// Display chart - Updated for backend data
function displayChart(chartData) {
    debugLog('Displaying chart from backend', chartData);
    
    const container = document.getElementById('chartContainer');
    container.style.display = 'block';
    
    try {
        // chartData is already in the correct format from backend
        Plotly.newPlot(container, chartData.data, chartData.layout, {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: 'eda_chart',
                height: 400,
                width: undefined,
                scale: 2
            }
        });
        
        // Force a resize after plot creation
        setTimeout(() => {
            Plotly.Plots.resize(container);
        }, 100);
        
    } catch (error) {
        debugLog('Chart display error:', error);
        container.innerHTML = '<div class="alert alert-error">Error displaying chart: ' + error.message + '</div>';
    }
}

// Preview report - Enhanced to properly render charts
function previewReport() {
    if (!currentData) {
        alert('Please upload data first');
        return;
    }
    
    debugLog('Previewing report');
    
    // Show chart selection interface first
    showChartSelectionInterface();
    
    const reportTitle = document.getElementById('reportTitle').value || 'Exploratory Data Analysis Report';
    const reportDescription = document.getElementById('chartDescription').value || '';
    
    const previewDiv = document.getElementById('reportPreview');
    previewDiv.style.display = 'block';
    
    // Generate report HTML with chart placeholders
    const reportHTML = generateReportHTMLForPreview(reportTitle, reportDescription);
    previewDiv.innerHTML = reportHTML;
    
    // Now render all the charts properly in the report
    renderChartsInReport();
    
    // Scroll to preview
    previewDiv.scrollIntoView({ behavior: 'smooth' });
    
    debugLog('Report preview generated and displayed');
}

// Generate report - Updated to use selected charts
function generateReport() {
    if (!currentData) {
        alert('Please upload data first');
        return;
    }
    
    debugLog('Generating report');
    
    const reportTitle = document.getElementById('reportTitle').value || 'Exploratory Data Analysis Report';
    const reportDescription = document.getElementById('reportDescription').value || '';
    const reportFormat = document.getElementById('reportFormat').value;
    
    // Show loading
    document.getElementById('reportLoading').style.display = 'block';
    document.getElementById('reportPreview').style.display = 'none';
    
    // Generate report HTML
    const reportHTML = generateReportHTML(reportTitle, reportDescription);
    
    // Store report for download
    window.currentReport = {
        html: reportHTML,
        title: reportTitle,
        format: reportFormat
    };
    
    // Hide loading and show download button
    document.getElementById('reportLoading').style.display = 'none';
    document.getElementById('downloadBtn').style.display = 'inline-block';
    
    // Show success message
    showNotification('Report generated successfully! Click Download to save.', 'success');
}

// Download report
function downloadReport() {
    if (!window.currentReport) {
        alert('Please generate a report first');
        return;
    }
    
    const { html, title, format } = window.currentReport;
    
    if (format === 'html') {
        // Download as HTML
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
        // For PDF, we'll use html2pdf.js or similar library
        // For now, show a message
        alert('PDF generation requires additional libraries. Please use HTML format for now.');
    }
    
    showNotification('Report downloaded successfully!', 'success');
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

// Show chart labeling section
function showChartLabeling(chartType, columns) {
    const labelingSection = document.getElementById('chartLabeling');
    const chartTitle = document.getElementById('chartTitle');
    const chartDescription = document.getElementById('chartDescription');
    
    // Generate default title based on chart type and columns
    let defaultTitle = '';
    switch (chartType) {
        case 'histogram':
            defaultTitle = `Distribution of ${columns[0]}`;
            break;
        case 'boxplot':
            defaultTitle = `Box Plot of ${columns[0]}`;
            break;
        case 'scatter':
            defaultTitle = `${columns[0]} vs ${columns[1]} Relationship`;
            break;
        case 'correlation':
            defaultTitle = 'Correlation Heatmap';
            break;
        case 'bar':
            defaultTitle = `Frequency of ${columns[0]}`;
            break;
    }
    
    chartTitle.value = defaultTitle;
    chartDescription.value = '';
    
    labelingSection.style.display = 'grid';
    
    // Scroll to labeling section
    labelingSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Enhanced chart storage - Store chart configuration instead of raw data
function addChartToReport() {
    const chartTitle = document.getElementById('chartTitle').value.trim();
    const chartDescription = document.getElementById('chartDescription').value.trim();
    
    if (!chartTitle) {
        alert('Please enter a chart title');
        return;
    }
    
    // Get the current chart data
    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer.style.display === 'none') {
        alert('No chart available to add');
        return;
    }
    
    // Check if chart with same title already exists
    const existingChart = addedCharts.find(chart => chart.title === chartTitle);
    if (existingChart) {
        alert('A chart with this title already exists. Please use a different title.');
        return;
    }
    
    // Store the chart configuration for recreation
    const chartObj = {
        id: Date.now(),
        title: chartTitle,
        description: chartDescription,
        type: document.getElementById('chartType').value,
        columns: getSelectedColumns(),
        chartHTML: chartContainer.innerHTML,
        // Store the original data that was used to create the chart
        originalData: currentData,
        timestamp: new Date().toLocaleString(),
        selected: true
    };
    
    // Add to global array
    addedCharts.push(chartObj);
    
    // Update the summary
    updateAddedChartsSummary();
    
    // Show success message
    showNotification(`Chart "${chartTitle}" added to report!`, 'success');
    
    // Clear labeling section
    clearChartLabeling();
}

// Get selected columns for current chart
function getSelectedColumns() {
    const chartType = document.getElementById('chartType').value;
    let columns = [];
    
    if (chartType === 'histogram' || chartType === 'boxplot' || chartType === 'bar') {
        const col1 = document.getElementById('chartColumn1');
        if (col1) columns.push(col1.value);
    } else if (chartType === 'scatter') {
        const col1 = document.getElementById('chartColumn1');
        const col2 = document.getElementById('chartColumn2');
        if (col1 && col2) columns = [col1.value, col2.value];
    }
    
    return columns;
}

// Clear chart labeling
function clearChartLabeling() {
    document.getElementById('chartLabeling').style.display = 'none';
    document.getElementById('chartTitle').value = '';
    document.getElementById('chartDescription').value = '';
}

// Update added charts summary - Enhanced with selection interface
function updateAddedChartsSummary() {
    const summaryDiv = document.getElementById('addedChartsSummary');
    const listDiv = document.getElementById('addedChartsList');
    
    if (addedCharts.length === 0) {
        summaryDiv.style.display = 'none';
        return;
    }
    
    summaryDiv.style.display = 'block';
    
    listDiv.innerHTML = addedCharts.map(chart => `
        <div class="added-chart-item">
            <div class="added-chart-info">
                <h4>${chart.title}</h4>
                <p><strong>Type:</strong> ${chart.type} | <strong>Columns:</strong> ${chart.columns.join(', ')}</p>
                ${chart.description ? `<p><strong>Description:</strong> ${chart.description}</p>` : ''}
                <p><small>Added: ${chart.timestamp}</small></p>
            </div>
            <div class="added-chart-actions">
                <button class="btn-remove" onclick="removeChartFromReport(${chart.id})">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
}

// Show chart selection interface in report tab
function showChartSelectionInterface() {
    const interfaceDiv = document.getElementById('chartSelectionInterface');
    const listDiv = document.getElementById('chartSelectionList');
    
    if (addedCharts.length === 0) {
        interfaceDiv.style.display = 'none';
        return;
    }
    
    interfaceDiv.style.display = 'block';
    
    listDiv.innerHTML = addedCharts.map(chart => `
        <div class="chart-selection-item ${chart.selected ? 'selected' : ''}" data-chart-id="${chart.id}">
            <div class="chart-selection-header">
                <div class="chart-selection-info">
                    <h4>${chart.title}</h4>
                    <p><strong>Type:</strong> ${chart.type} | <strong>Columns:</strong> ${chart.columns.join(', ')}</p>
                </div>
                <div class="chart-selection-toggle">
                    <label>
                        <input type="checkbox" 
                               ${chart.selected ? 'checked' : ''} 
                               onchange="toggleChartSelection(${chart.id}, this.checked)">
                        Include in Report
                    </label>
                </div>
            </div>
            ${chart.description ? `<div class="chart-selection-description">${chart.description}</div>` : ''}
        </div>
    `).join('');
}

// Toggle chart selection
function toggleChartSelection(chartId, selected) {
    const chart = addedCharts.find(c => c.id === chartId);
    if (chart) {
        chart.selected = selected;
        
        // Update visual state
        const itemElement = document.querySelector(`[data-chart-id="${chartId}"]`);
        if (itemElement) {
            itemElement.classList.toggle('selected', selected);
        }
    }
}

// Remove chart from report
function removeChartFromReport(chartId) {
    addedCharts = addedCharts.filter(chart => chart.id !== chartId);
    updateAddedChartsSummary();
    showNotification('Chart removed from report', 'info');
}

// Enhanced report generation with chart placeholders
function generateReportHTMLForPreview(title, description) {
    if (!currentData) return '<div class="alert alert-error">No data available</div>';
    
    debugLog('Generating preview report HTML with title:', title);
    debugLog('Available charts:', addedCharts);
    
    const dataInfo = currentData.data_info;
    const timestamp = new Date().toLocaleString();
    
    let html = `
        <div class="report-content">
            <h1>${title}</h1>
            <p><strong>Generated:</strong> ${timestamp}</p>
            ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
            
            <h2>Dataset Overview</h2>
            <p><strong>Shape:</strong> ${dataInfo.shape[0]} rows × ${dataInfo.shape[1]} columns</p>
            <p><strong>Memory Usage:</strong> ${(dataInfo.memory_usage / 1024).toFixed(2)} KB</p>
            <p><strong>Missing Values:</strong> ${Object.values(dataInfo.null_counts).reduce((sum, count) => sum + count, 0)}</p>
            <p><strong>Duplicate Rows:</strong> ${dataInfo.duplicate_rows}</p>
            
            <h2>Data Types</h2>
            <table>
                <thead>
                    <tr><th>Column</th><th>Data Type</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(dataInfo.dtypes).map(([col, dtype]) => 
                        `<tr><td>${col}</td><td>${dtype}</td></tr>`
                    ).join('')}
                </tbody>
            </table>
            
            <h2>Missing Values Analysis</h2>
            <table>
                <thead>
                    <tr><th>Column</th><th>Missing Count</th><th>Missing Percentage</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(dataInfo.null_counts).map(([col, count]) => {
                        const percentage = ((count / dataInfo.shape[0]) * 100).toFixed(2);
                        return `<tr><td>${col}</td><td>${count}</td><td>${percentage}%</td></tr>`;
                    }).join('')}
                </tbody>
            </table>
    `;
    
    // Add numerical analysis if available
    if (dataInfo.numerical_analysis) {
        html += `
            <h2>Numerical Columns Analysis</h2>
            <table>
                <thead>
                    <tr><th>Column</th><th>Mean</th><th>Median</th><th>Std</th><th>Min</th><th>Max</th><th>Skewness</th><th>Kurtosis</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(dataInfo.numerical_analysis).map(([col, stats]) => 
                        `<tr>
                            <td>${col}</td>
                            <td>${stats.mean?.toFixed(3) || 'N/A'}</td>
                            <td>${stats.median?.toFixed(3) || 'N/A'}</td>
                            <td>${stats.std?.toFixed(3) || 'N/A'}</td>
                            <td>${stats.min || 'N/A'}</td>
                            <td>${stats.max || 'N/A'}</td>
                            <td>${stats.skewness?.toFixed(3) || 'N/A'}</td>
                            <td>${stats.kurtosis?.toFixed(3) || 'N/A'}</td>
                        </tr>`
                    ).join('')}
                </tbody>
            </table>
        `;
    }
    
    // Add correlation matrix if available
    if (dataInfo.correlation) {
        html += `
            <h2>Correlation Matrix</h2>
            <table>
                <thead>
                    <tr><th></th>${Object.keys(dataInfo.correlation).map(col => `<th>${col}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${Object.entries(dataInfo.correlation).map(([row, correlations]) => 
                        `<tr>
                            <td><strong>${row}</strong></td>
                            ${Object.values(correlations).map(val => 
                                `<td class="${getCorrelationClass(val)}">${val?.toFixed(3) || 'N/A'}</td>`
                            ).join('')}
                        </tr>`
                    ).join('')}
                </tbody>
            </table>
        `;
    }
    
    // Add only selected charts - Use a Set to prevent duplicates
    const selectedCharts = addedCharts.filter(chart => chart.selected);
    const uniqueChartIds = new Set();
    const uniqueSelectedCharts = selectedCharts.filter(chart => {
        if (uniqueChartIds.has(chart.id)) {
            return false;
        }
        uniqueChartIds.add(chart.id);
        return true;
    });
    
    debugLog('Selected charts for report:', uniqueSelectedCharts);
    
    if (uniqueSelectedCharts.length > 0) {
        html += `<h2>Selected Charts</h2>`;
        
        uniqueSelectedCharts.forEach((chart, index) => {
            html += `
                <div class="report-chart-section">
                    <h3>${chart.title}</h3>
                    ${chart.description ? `<p><strong>Description:</strong> ${chart.description}</p>` : ''}
                    <p><strong>Chart Type:</strong> ${chart.type} | <strong>Columns:</strong> ${chart.columns.join(', ')}</p>
                    <div id="report-chart-${chart.id}" class="report-chart-container" style="height: 300px; width: 100%;"></div>
                </div>
            `;
        });
    } else {
        html += '<p>No charts selected for this report. Use the chart selection interface above to choose charts!</p>';
    }
    
    html += '</div>';
    
    debugLog('Preview report HTML generated successfully, length:', html.length);
    return html;
}

// Preview report - Enhanced to properly render charts
function previewReport() {
    if (!currentData) {
        alert('Please upload data first');
        return;
    }
    
    debugLog('Previewing report');
    
    // Show chart selection interface first
    showChartSelectionInterface();
    
    const reportTitle = document.getElementById('reportTitle').value || 'Exploratory Data Analysis Report';
    const reportDescription = document.getElementById('chartDescription').value || '';
    
    const previewDiv = document.getElementById('reportPreview');
    previewDiv.style.display = 'block';
    
    // Generate report HTML with chart placeholders
    const reportHTML = generateReportHTMLForPreview(reportTitle, reportDescription);
    previewDiv.innerHTML = reportHTML;
    
    // Now render all the charts properly in the report
    renderChartsInReport();
    
    // Scroll to preview
    previewDiv.scrollIntoView({ behavior: 'smooth' });
    
    debugLog('Report preview generated and displayed');
}

// Render charts in the report preview - Fixed to prevent axis scaling errors
function renderChartsInReport() {
    const selectedCharts = addedCharts.filter(chart => chart.selected);
    
    selectedCharts.forEach(chart => {
        const chartContainer = document.getElementById(`report-chart-${chart.id}`);
        if (chartContainer) {
            try {
                // Recreate the chart using the original data and chart type
                const chartData = recreateChartData(chart);
                if (chartData) {
                    // Create a new plot with proper sizing for the report
                    const reportLayout = {
                        ...chartData.layout,
                        height: 300,
                        width: undefined,
                        autosize: true,
                        margin: {
                            l: 60,
                            r: 40,
                            t: 60,
                            b: 60,
                            pad: 4
                        },
                        font: { 
                            color: '#f8fafc',
                            size: 11
                        },
                        paper_bgcolor: '#1e293b',
                        plot_bgcolor: '#1e293b',
                        xaxis: { 
                            gridcolor: '#334155', 
                            color: '#cbd5e1',
                            showgrid: true,
                            zeroline: false
                        },
                        yaxis: { 
                            gridcolor: '#334155', 
                            color: '#cbd5e1',
                            showgrid: true,
                            zeroline: false
                        }
                    };
                    
                    Plotly.newPlot(chartContainer, chartData.data, reportLayout, {
                        responsive: true,
                        displayModeBar: false,
                        staticPlot: false
                    });
                }
            } catch (error) {
                debugLog(`Error rendering chart ${chart.id}:`, error);
                chartContainer.innerHTML = `<div class="alert alert-error">Error rendering chart: ${error.message}</div>`;
            }
        }
    });
}

// Convert data structure to DataFrame format - Enhanced to use full data
function convertDataToDataFrame(data) {
    try {
        // First try to use full data if available
        if (data.full_data && data.full_data.length > 0) {
            debugLog(`Using full data with ${data.full_data.length} rows`);
            return data.full_data;
        }
        
        // Fallback to preview data if full data not available
        if (!data.preview_head) return [];
        
        const columns = data.data_info?.columns || [];
        if (columns.length === 0) return [];
        
        // Convert from {column: {row_index: value}} to [{column1: value1, column2: value2, ...}]
        const df = [];
        const rowIndices = Object.keys(data.preview_head[columns[0]] || {});
        
        rowIndices.forEach(rowIndex => {
            const row = {};
            columns.forEach(col => {
                if (data.preview_head[col] && data.preview_head[col][rowIndex] !== undefined) {
                    row[col] = data.preview_head[col][rowIndex];
                }
            });
            df.push(row);
        });
        
        // Also add tail data if available
        if (data.preview_tail) {
            const tailRowIndices = Object.keys(data.preview_tail[columns[0]] || {});
            tailRowIndices.forEach(rowIndex => {
                const row = {};
                columns.forEach(col => {
                    if (data.preview_tail[col] && data.preview_tail[col][rowIndex] !== undefined) {
                        row[col] = data.preview_tail[col][rowIndex];
                    }
                });
                df.push(row);
            });
        }
        
        // Remove duplicates based on row content
        const uniqueDf = [];
        const seen = new Set();
        
        df.forEach(row => {
            const rowKey = JSON.stringify(row);
            if (!seen.has(rowKey)) {
                seen.add(rowKey);
                uniqueDf.push(row);
            }
        });
        
        debugLog(`DataFrame created with ${uniqueDf.length} unique rows from preview data`);
        return uniqueDf;
    } catch (error) {
        debugLog('Error converting data:', error);
        return [];
    }
}

// Recreate chart data from stored information - Fixed correlation handling
function recreateChartData(chart) {
    try {
        // Use the original data to recreate the chart
        const data = chart.originalData;
        const chartType = chart.type;
        const columns = chart.columns;
        
        debugLog('Recreating chart:', { chartType, columns, data });
        
        // Convert the data structure to a format suitable for plotting
        const df = convertDataToDataFrame(data);
        
        if (!df || df.length === 0) {
            debugLog('No data to plot for chart recreation');
            return null;
        }

        let plotData = [];
        let layout = {
            title: chart.title,
            font: { color: '#f8fafc' },
            paper_bgcolor: '#1e293b',
            plot_bgcolor: '#1e293b',
            xaxis: { gridcolor: '#334155', color: '#cbd5e1' },
            yaxis: { gridcolor: '#334155', color: '#cbd5e1' }
        };

        switch (chartType) {
            case 'histogram':
                plotData = [{
                    x: df.map(row => row[columns[0]]),
                    type: 'histogram',
                    name: columns[0],
                    marker: { color: '#f59e0b' },
                    nbinsx: Math.min(30, Math.ceil(Math.sqrt(df.length)))
                }];
                layout.xaxis.title = columns[0];
                layout.yaxis.title = 'Frequency';
                break;

            case 'boxplot':
                plotData = [{
                    y: df.map(row => row[columns[0]]),
                    type: 'box',
                    name: columns[0],
                    marker: { color: '#f59e0b' }
                }];
                layout.yaxis.title = columns[0];
                break;

            case 'scatter':
                plotData = [{
                    x: df.map(row => row[columns[0]]),
                    y: df.map(row => row[columns[1]]),
                    type: 'scatter',
                    mode: 'markers',
                    name: `${columns[0]} vs ${columns[1]}`,
                    marker: { 
                        color: '#f59e0b', 
                        size: Math.max(4, Math.min(8, 1000 / df.length)),
                        opacity: 0.7
                    }
                }];
                layout.xaxis.title = columns[0];
                layout.yaxis.title = columns[1];
                break;

            case 'correlation':
                debugLog('Processing correlation chart...');
                
                // First try to use the stored correlation data
                if (data.data_info && data.data_info.correlation) {
                    debugLog('Found stored correlation data:', data.data_info.correlation);
                    
                    const corrData = data.data_info.correlation;
                    const xLabels = Object.keys(corrData);
                    const yLabels = Object.keys(corrData);
                    
                    debugLog('Correlation labels:', { xLabels, yLabels });
                    
                    // Convert correlation data to z-values matrix
                    const zValues = [];
                    for (let i = 0; i < xLabels.length; i++) {
                        const row = [];
                        for (let j = 0; j < yLabels.length; j++) {
                            const xKey = xLabels[i];
                            const yKey = yLabels[j];
                            const value = corrData[xKey] && corrData[xKey][yKey];
                            row.push(typeof value === 'number' ? value : 0);
                        }
                        zValues.push(row);
                    }
                    
                    debugLog('Z-values matrix:', zValues);
                    
                    plotData = [{
                        z: zValues,
                        x: xLabels,
                        y: yLabels,
                        type: 'heatmap',
                        colorscale: 'RdBu',
                        zmid: 0,
                        hovertemplate: '<b>%{x} vs %{y}</b><br>Correlation: %{z:.3f}<extra></extra>',
                        showscale: true
                    }];
                    
                    layout.title = `Correlation Heatmap (${df.length} data points)`;
                    layout.xaxis = { 
                        title: 'Variables',
                        gridcolor: '#334155', 
                        color: '#cbd5e1',
                        showgrid: false,
                        side: 'bottom'
                    };
                    layout.yaxis = { 
                        title: 'Variables',
                        gridcolor: '#334155', 
                        color: '#cbd5e1',
                        showgrid: false,
                        side: 'left'
                    };
                    
                    debugLog('Correlation plot data created:', plotData);
                    
                } else {
                    debugLog('No stored correlation data, calculating from DataFrame');
                    
                    // Fallback: calculate correlation from numerical columns
                    const numericalCols = Object.keys(data.data_info?.dtypes || {}).filter(col => 
                        ['int64', 'float64'].includes(data.data_info.dtypes[col])
                    );
                    
                    debugLog('Numerical columns found:', numericalCols);
                    
                    if (numericalCols.length > 1) {
                        // Create correlation matrix
                        const corrMatrix = {};
                        numericalCols.forEach(col1 => {
                            corrMatrix[col1] = {};
                            numericalCols.forEach(col2 => {
                                if (col1 === col2) {
                                    corrMatrix[col1][col2] = 1.0;
                                } else {
                                    // Calculate simple correlation
                                    const values1 = df.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
                                    const values2 = df.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));
                                    
                                    if (values1.length > 0 && values2.length > 0) {
                                        const correlation = calculateSimpleCorrelation(values1, values2);
                                        corrMatrix[col1][col2] = correlation;
                                    } else {
                                        corrMatrix[col1][col2] = 0;
                                    }
                                }
                            });
                        });
                        
                        debugLog('Calculated correlation matrix:', corrMatrix);
                        
                        const xLabels = Object.keys(corrMatrix);
                        const yLabels = Object.keys(corrMatrix);
                        const zValues = xLabels.map(x => yLabels.map(y => corrMatrix[x][y]));
                        
                        plotData = [{
                            z: zValues,
                            x: xLabels,
                            y: yLabels,
                            type: 'heatmap',
                            colorscale: 'RdBu',
                            zmid: 0,
                            hovertemplate: '<b>%{x} vs %{y}</b><br>Correlation: %{z:.3f}<extra></extra>',
                            showscale: true
                        }];
                        
                        layout.title = `Correlation Heatmap (${df.length} data points)`;
                        layout.xaxis = { 
                            title: 'Variables',
                            gridcolor: '#334155', 
                            color: '#cbd5e1',
                            showgrid: false,
                            side: 'bottom'
                        };
                        layout.yaxis = { 
                            title: 'Variables',
                            gridcolor: '#334155', 
                            color: '#cbd5e1',
                            showgrid: false,
                            side: 'left'
                        };
                    }
                }
                break;

            case 'bar':
                const valueCounts = {};
                df.forEach(row => {
                    const value = row[columns[0]];
                    if (value !== null && value !== undefined) {
                        valueCounts[value] = (valueCounts[value] || 0) + 1;
                    }
                });
                
                plotData = [{
                    x: Object.keys(valueCounts),
                    y: Object.values(valueCounts),
                    type: 'bar',
                    marker: { color: '#f59e0b' }
                }];
                layout.xaxis.title = columns[0];
                layout.yaxis.title = 'Count';
                break;
        }

        debugLog('Final plot data:', plotData);
        debugLog('Final layout:', layout);
        
        return { data: plotData, layout: layout };
    } catch (error) {
        debugLog('Error recreating chart data:', error);
        return null;
    }
}

// Helper function to calculate simple correlation
function calculateSimpleCorrelation(x, y) {
    try {
        if (x.length !== y.length || x.length === 0) return 0;
        
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        if (denominator === 0) return 0;
        
        return numerator / denominator;
    } catch (error) {
        debugLog('Error calculating correlation:', error);
        return 0;
    }
}

// Enhanced report generation with selected charts only - For final report generation
function generateReportHTML(title, description) {
    if (!currentData) return '<div class="alert alert-error">No data available</div>';
    
    debugLog('Generating final report HTML with title:', title);
    debugLog('Available charts:', addedCharts);
    
    const dataInfo = currentData.data_info;
    const timestamp = new Date().toLocaleString();
    
    let html = `
        <div class="report-content">
            <h1>${title}</h1>
            <p><strong>Generated:</strong> ${timestamp}</p>
            ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
            
            <h2>Dataset Overview</h2>
            <p><strong>Shape:</strong> ${dataInfo.shape[0]} rows × ${dataInfo.shape[1]} columns</p>
            <p><strong>Memory Usage:</strong> ${(dataInfo.memory_usage / 1024).toFixed(2)} KB</p>
            <p><strong>Missing Values:</strong> ${Object.values(dataInfo.null_counts).reduce((sum, count) => sum + count, 0)}</p>
            <p><strong>Duplicate Rows:</strong> ${dataInfo.duplicate_rows}</p>
            
            <h2>Data Types</h2>
            <table>
                <thead>
                    <tr><th>Column</th><th>Data Type</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(dataInfo.dtypes).map(([col, dtype]) => 
                        `<tr><td>${col}</td><td>${dtype}</td></tr>`
                    ).join('')}
                </tbody>
            </table>
            
            <h2>Missing Values Analysis</h2>
            <table>
                <thead>
                    <tr><th>Column</th><th>Missing Count</th><th>Missing Percentage</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(dataInfo.null_counts).map(([col, count]) => {
                        const percentage = ((count / dataInfo.shape[0]) * 100).toFixed(2);
                        return `<tr><td>${col}</td><td>${count}</td><td>${percentage}%</td></tr>`;
                    }).join('')}
                </tbody>
            </table>
    `;
    
    // Add numerical analysis if available
    if (dataInfo.numerical_analysis) {
        html += `
            <h2>Numerical Columns Analysis</h2>
            <table>
                <thead>
                    <tr><th>Column</th><th>Mean</th><th>Median</th><th>Std</th><th>Min</th><th>Max</th><th>Skewness</th><th>Kurtosis</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(dataInfo.numerical_analysis).map(([col, stats]) => 
                        `<tr>
                            <td>${col}</td>
                            <td>${stats.mean?.toFixed(3) || 'N/A'}</td>
                            <td>${stats.median?.toFixed(3) || 'N/A'}</td>
                            <td>${stats.std?.toFixed(3) || 'N/A'}</td>
                            <td>${stats.min || 'N/A'}</td>
                            <td>${stats.max || 'N/A'}</td>
                            <td>${stats.skewness?.toFixed(3) || 'N/A'}</td>
                            <td>${stats.kurtosis?.toFixed(3) || 'N/A'}</td>
                        </tr>`
                    ).join('')}
                </tbody>
            </table>
        `;
    }
    
    // Add correlation matrix if available
    if (dataInfo.correlation) {
        html += `
            <h2>Correlation Matrix</h2>
            <table>
                <thead>
                    <tr><th></th>${Object.keys(dataInfo.correlation).map(col => `<th>${col}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${Object.entries(dataInfo.correlation).map(([row, correlations]) => 
                        `<tr>
                            <td><strong>${row}</strong></td>
                            ${Object.values(correlations).map(val => 
                                `<td class="${getCorrelationClass(val)}">${val?.toFixed(3) || 'N/A'}</td>`
                            ).join('')}
                        </tr>`
                    ).join('')}
                </tbody>
            </table>
        `;
    }
    
    // Add only selected charts - Use a Set to prevent duplicates
    const selectedCharts = addedCharts.filter(chart => chart.selected);
    const uniqueChartIds = new Set();
    const uniqueSelectedCharts = selectedCharts.filter(chart => {
        if (uniqueChartIds.has(chart.id)) {
            return false;
        }
        uniqueChartIds.add(chart.id);
        return true;
    });
    
    debugLog('Selected charts for final report:', uniqueSelectedCharts);
    
    if (uniqueSelectedCharts.length > 0) {
        html += `<h2>Selected Charts</h2>`;
        
        uniqueSelectedCharts.forEach(chart => {
            html += `
                <div class="report-chart-section">
                    <h3>${chart.title}</h3>
                    ${chart.description ? `<p><strong>Description:</strong> ${chart.description}</p>` : ''}
                    <p><strong>Chart Type:</strong> ${chart.type} | <strong>Columns:</strong> ${chart.columns.join(', ')}</p>
                    <div class="report-chart-container">
                        ${chart.chartHTML}
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p>No charts selected for this report. Use the chart selection interface above to choose charts!</p>';
    }
    
    html += '</div>';
    
    debugLog('Final report HTML generated successfully, length:', html.length);
    return html;
}

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Function to get cleaning recommendations - Add async keyword
async function getCleaningRecommendations() {
    try {
        console.log('Getting cleaning recommendations...');
        
        // Show modal
        document.getElementById('cleaningModal').style.display = 'block';
        
        // Show loading state
        document.getElementById('cleaningLoading').style.display = 'block';
        document.getElementById('cleaningRecommendations').style.display = 'none';
        
        // Check if we already have recommendations
        if (cleaningRecommendations) {
            console.log('Using cached recommendations');
            displayCleaningRecommendations(cleaningRecommendations);
            return;
        }
        
        // Make API call to get recommendations
        console.log('Calling /get_cleaning_recommendations endpoint...');
        const response = await fetch('/get_cleaning_recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            cleaningRecommendations = data.recommendations;
            displayCleaningRecommendations(cleaningRecommendations);
        } else {
            throw new Error(data.error || 'Failed to get recommendations');
        }
        
    } catch (error) {
        console.error('Error getting cleaning recommendations:', error);
        
        // Hide loading and show error
        const loadingElement = document.getElementById('cleaningLoading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        const contentElement = document.getElementById('cleaningContent');
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Failed to get cleaning recommendations: ${error.message}
                    <br><br>
                    <small>Make sure you have run the analysis first and have a valid Gemini API key configured.</small>
                </div>
            `;
        }
    }
}

// Function to display cleaning recommendations
function displayCleaningRecommendations(recommendations) {
    const content = document.getElementById('cleaningRecommendations');
    
    // Hide loading
    document.getElementById('cleaningLoading').style.display = 'none';
    content.style.display = 'block';
    
    // Show export button
    document.getElementById('exportBtn').style.display = 'inline-block';
    
    let html = '';
    
    // Summary section
    html += `
        <div class="recommendation-section">
            <h4><i class="fas fa-info-circle"></i> Summary</h4>
            <p>${recommendations.summary}</p>
        </div>
    `;
    
    // Data quality score
    html += `
        <div class="data-quality-score">
            <div class="score-label">Data Quality Score</div>
            <div class="score-value">${recommendations.data_quality_score}</div>
        </div>
    `;
    
    // Critical issues
    if (recommendations.critical_issues && recommendations.critical_issues.length > 0) {
        html += `
            <div class="recommendation-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Critical Issues</h4>
        `;
        
        recommendations.critical_issues.forEach(issue => {
            html += `
                <div class="critical-issue ${issue.severity}">
                    <div class="issue-header">
                        <strong>${issue.issue}</strong>
                        <span class="severity-badge ${issue.severity}">${issue.severity.toUpperCase()}</span>
                    </div>
                    <p><strong>Impact:</strong> ${issue.impact}</p>
                    <p><strong>Recommendation:</strong> ${issue.recommendation}</p>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Cleaning steps
    if (recommendations.cleaning_steps && recommendations.cleaning_steps.length > 0) {
        html += `
            <div class="recommendation-section">
                <h4><i class="fas fa-tools"></i> Recommended Cleaning Steps</h4>
        `;
        
        recommendations.cleaning_steps.forEach(step => {
            html += `
                <div class="cleaning-step">
                    <div class="step-header">
                        <span class="step-number">${step.step}</span>
                        <span class="priority-badge ${step.priority}">${step.priority}</span>
                    </div>
                    <h5>${step.action}</h5>
                    <p><strong>Columns:</strong> ${step.columns.join(', ')}</p>
                    <p><strong>Method:</strong> ${step.method}</p>
                    <p><strong>Expected Outcome:</strong> ${step.expected_outcome}</p>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Next steps
    if (recommendations.next_steps) {
        html += `
            <div class="recommendation-section">
                <h4><i class="fas fa-arrow-right"></i> Next Steps</h4>
                <p>${recommendations.next_steps}</p>
            </div>
        `;
    }
    
    content.innerHTML = html;
}

// Function to close cleaning modal
function closeCleaningModal() {
    document.getElementById('cleaningModal').style.display = 'none';
}

// Function to export recommendations
function exportRecommendations() {
    if (!cleaningRecommendations) return;
    
    const dataStr = JSON.stringify(cleaningRecommendations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `cleaning_recommendations_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Update the startAnalysis function to show the cleaning recommendations button
async function startAnalysis() {
    try {
        console.log('Starting analysis...');
        
        // Show loading state
        document.getElementById('analysisContent').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Analyzing your dataset...</p>
            </div>
        `;
        
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('Analysis completed successfully');
            
            // Display analysis results
            displayAnalysisResults(data);
            
            // Show the cleaning recommendations button AFTER analysis is complete
            document.getElementById('cleaningRecommendationsBtn').style.display = 'inline-block';
            
            // Show success message
            showNotification('Analysis completed successfully!', 'success');
            
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        document.getElementById('analysisContent').innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-triangle"></i>
                Analysis failed: ${error.message}
            </div>
        `;
        
        // Hide the button if analysis fails
        document.getElementById('cleaningRecommendationsBtn').style.display = 'none';
    }
}

// Function to display analysis results
function displayAnalysisResults(data) {
    const content = document.getElementById('analysisContent');
    
    let html = '<div class="analysis-results">';
    html += '<h3><i class="fas fa-chart-bar"></i> Analysis Results</h3>';
    
    // Basic statistics
    if (data.basic_stats) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-calculator"></i> Basic Statistics</h4>';
        html += '<div class="stats-table-container">';
        html += '<table class="stats-table">';
        html += '<thead><tr><th>Column</th><th>Count</th><th>Mean</th><th>Std</th><th>Min</th><th>25%</th><th>50%</th><th>75%</th><th>Max</th></tr></thead>';
        html += '<tbody>';
        
        for (const [col, stats] of Object.entries(data.basic_stats)) {
            if (typeof stats === 'object' && stats !== null) {
                html += '<tr>';
                html += `<td class="column-name"><i class="fas fa-columns"></i> ${col}</td>`;
                html += `<td class="stat-value">${stats.count || 'N/A'}</td>`;
                html += `<td class="stat-value">${stats.mean ? stats.mean.toFixed(4) : 'N/A'}</td>`;
                html += `<td class="stat-value">${stats.std ? stats.std.toFixed(4) : 'N/A'}</td>`;
                html += `<td class="stat-value">${stats.min || 'N/A'}</td>`;
                html += `<td class="stat-value">${stats['25%'] || 'N/A'}</td>`;
                html += `<td class="stat-value">${stats['50%'] || 'N/A'}</td>`;
                html += `<td class="stat-value">${stats['75%'] || 'N/A'}</td>`;
                html += `<td class="stat-value">${stats.max || 'N/A'}</td>`;
                html += '</tr>';
            }
        }
        html += '</tbody></table></div></div>';
    }
    
    // Missing values
    if (data.missing_values) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-exclamation-triangle"></i> Missing Values</h4>';
        html += '<div class="missing-values-container">';
        
        const hasMissingValues = Object.values(data.missing_values).some(count => count > 0);
        
        if (hasMissingValues) {
            html += '<table class="missing-table">';
            html += '<thead><tr><th>Column</th><th>Missing Count</th><th>Missing %</th><th>Status</th></tr></thead>';
            html += '<tbody>';
            
            for (const [col, count] of Object.entries(data.missing_values)) {
                if (count > 0) {
                    const percentage = ((count / data.basic_stats[col]?.count) * 100).toFixed(2);
                    const status = percentage > 20 ? 'high' : percentage > 5 ? 'medium' : 'low';
                    html += `<tr class="missing-row ${status}">`;
                    html += `<td><i class="fas fa-columns"></i> ${col}</td>`;
                    html += `<td>${count}</td>`;
                    html += `<td>${percentage}%</td>`;
                    html += `<td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>`;
                    html += '</tr>';
                }
            }
            html += '</tbody></table>';
        } else {
            html += '<div class="no-missing-values">';
            html += '<i class="fas fa-check-circle"></i>';
            html += '<p>No missing values found in the dataset!</p>';
            html += '</div>';
        }
        html += '</div></div>';
    }
    
    // Outlier Analysis
    if (data.outliers) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-bullseye"></i> Outlier Analysis</h4>';
        html += '<div class="outliers-container">';
        
        const hasOutliers = Object.values(data.outliers).some(outlier => outlier.count > 0);
        
        if (hasOutliers) {
            html += '<table class="outliers-table">';
            html += '<thead><tr><th>Column</th><th>Outlier Count</th><th>Lower Bound</th><th>Upper Bound</th><th>Status</th></tr></thead>';
            html += '<tbody>';
            
            for (const [col, outlier] of Object.entries(data.outliers)) {
                if (outlier.count > 0) {
                    const percentage = ((outlier.count / data.basic_stats[col]?.count) * 100).toFixed(2);
                    const status = percentage > 10 ? 'high' : percentage > 5 ? 'medium' : 'low';
                    html += `<tr class="outlier-row ${status}">`;
                    html += `<td><i class="fas fa-columns"></i> ${col}</td>`;
                    html += `<td>${outlier.count} (${percentage}%)</td>`;
                    html += `<td>${outlier.lower_bound ? outlier.lower_bound.toFixed(4) : 'N/A'}</td>`;
                    html += `<td>${outlier.upper_bound ? outlier.upper_bound.toFixed(4) : 'N/A'}</td>`;
                    html += `<td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>`;
                    html += '</tr>';
                }
            }
            html += '</tbody></table>';
        } else {
            html += '<div class="no-outliers">';
            html += '<i class="fas fa-check-circle"></i>';
            html += '<p>No outliers detected using IQR method!</p>';
            html += '</div>';
        }
        html += '</div></div>';
    }
    
    // Normality Tests
    if (data.normality_tests) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-chart-line"></i> Normality Tests</h4>';
        html += '<div class="normality-container">';
        html += '<table class="normality-table">';
        html += '<thead><tr><th>Column</th><th>Skewness</th><th>Kurtosis</th><th>Normality</th><th>Assessment</th></tr></thead>';
        html += '<tbody>';
        
        for (const [col, test] of Object.entries(data.normality_tests)) {
            const skewness = test.skewness;
            const kurtosis = test.kurtosis;
            
            // Determine normality
            let normality, assessment, status;
            if (Math.abs(skewness) <= 0.5 && Math.abs(kurtosis) <= 1) {
                normality = 'Normal';
                assessment = 'Data follows normal distribution';
                status = 'normal';
            } else if (Math.abs(skewness) <= 1 && Math.abs(kurtosis) <= 2) {
                normality = 'Moderate';
                assessment = 'Slight deviation from normal';
                status = 'moderate';
            } else {
                normality = 'Non-Normal';
                assessment = 'Significant deviation from normal';
                status = 'non-normal';
            }
            
            html += `<tr class="normality-row ${status}">`;
            html += `<td><i class="fas fa-columns"></i> ${col}</td>`;
            html += `<td class="${Math.abs(skewness) > 1 ? 'highlight' : ''}">${skewness ? skewness.toFixed(4) : 'N/A'}</td>`;
            html += `<td class="${Math.abs(kurtosis) > 2 ? 'highlight' : ''}">${kurtosis ? kurtosis.toFixed(4) : 'N/A'}</td>`;
            html += `<td><span class="normality-badge ${status}">${normality}</span></td>`;
            html += `<td>${assessment}</td>`;
            html += '</tr>';
        }
        html += '</tbody></table></div></div>';
    }
    
    // Correlation matrix
    if (data.correlation) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-project-diagram"></i> Correlation Matrix</h4>';
        html += '<div class="correlation-container">';
        html += '<table class="correlation-table">';
        html += '<thead><tr><th>Column</th>';
        for (const col of Object.keys(data.correlation)) {
            html += `<th>${col}</th>`;
        }
        html += '</tr></thead><tbody>';
        
        for (const [col1, correlations] of Object.entries(data.correlation)) {
            html += '<tr>';
            html += `<td class="column-header"><i class="fas fa-columns"></i> ${col1}</td>`;
            for (const [col2, corr] of Object.entries(correlations)) {
                if (col1 === col2) {
                    html += '<td class="diagonal">1.000</td>';
                } else {
                    const corrValue = corr ? parseFloat(corr) : 0;
                    let correlationClass = '';
                    if (Math.abs(corrValue) >= 0.7) correlationClass = 'high-correlation';
                    else if (Math.abs(corrValue) >= 0.3) correlationClass = 'medium-correlation';
                    else correlationClass = 'low-correlation';
                    
                    html += `<td class="correlation-cell ${correlationClass}">${corrValue.toFixed(3)}</td>`;
                }
            }
            html += '</tr>';
        }
        html += '</tbody></table></div></div>';
    }
    
    // Data types
    if (data.dtypes) {
        html += '<div class="analysis-section">';
        html += '<h4><i class="fas fa-tags"></i> Data Types</h4>';
        html += '<div class="dtypes-container">';
        html += '<table class="dtypes-table">';
        html += '<thead><tr><th>Column</th><th>Data Type</th><th>Category</th></tr></thead>';
        html += '<tbody>';
        
        for (const [col, dtype] of Object.entries(data.dtypes)) {
            let category, icon;
            if (dtype.includes('int') || dtype.includes('float')) {
                category = 'Numerical';
                icon = 'fas fa-hashtag';
            } else if (dtype.includes('object') || dtype.includes('category')) {
                category = 'Categorical';
                icon = 'fas fa-list';
            } else if (dtype.includes('datetime')) {
                category = 'DateTime';
                icon = 'fas fa-calendar';
            } else {
                category = 'Other';
                icon = 'fas fa-question';
            }
            
            html += '<tr>';
            html += `<td><i class="fas fa-columns"></i> ${col}</td>`;
            html += `<td><code>${dtype}</code></td>`;
            html += `<td><i class="${icon}"></i> ${category}</td>`;
            html += '</tr>';
        }
        html += '</tbody></table></div></div>';
    }
    
    html += '</div>';
    content.innerHTML = html;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('cleaningModal');
    if (event.target === modal) {
        closeCleaningModal();
    }
}
