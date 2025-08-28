class EDAExplorer {
    constructor() {
        this.data = null;
        this.fileInfo = null;
        this.currentAnalysis = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupNavigation();
    }

    setupEventListeners() {
        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Analyze button
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.startAnalysis();
        });

        // Preview controls
        document.getElementById('headBtn').addEventListener('click', () => {
            this.showDataPreview('head');
        });

        document.getElementById('tailBtn').addEventListener('click', () => {
            this.showDataPreview('tail');
        });

        document.getElementById('infoBtn').addEventListener('click', () => {
            this.showDataInfo();
        });

        // Analysis controls
        document.getElementById('runAnalysisBtn').addEventListener('click', () => {
            this.runAnalysis();
        });

        // Chart generation
        document.getElementById('generateChartBtn').addEventListener('click', () => {
            this.generateChart();
        });

        // Export buttons
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportPDF();
        });

        document.getElementById('exportCsvBtn').addEventListener('click', () => {
            this.exportCSV();
        });

        document.getElementById('exportChartBtn').addEventListener('click', () => {
            this.exportChart();
        });
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        uploadArea.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Show target section
                sections.forEach(section => {
                    if (section.id === targetId) {
                        section.style.display = 'block';
                    } else {
                        section.style.display = 'none';
                    }
                });
            });
        });
    }

    async handleFileSelect(file) {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['.csv', '.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            this.showError('Please select a valid file type (CSV, XLSX, or XLS)');
            return;
        }

        // Validate file size (100MB limit)
        if (file.size > 100 * 1024 * 1024) {
            this.showError('File size must be less than 100MB');
            return;
        }

        this.showLoading(true);
        
        try {
            // Simulate file processing (replace with actual API call)
            await this.simulateFileProcessing(file);
            
            this.fileInfo = {
                name: file.name,
                size: this.formatFileSize(file.size),
                type: fileExtension
            };

            this.displayFileInfo();
            this.showDataPreview('head');
            
        } catch (error) {
            this.showError('Error processing file: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async simulateFileProcessing(file) {
        // Simulate API delay
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock data for demonstration
                this.data = {
                    columns: ['id', 'name', 'age', 'salary', 'department'],
                    rows: [
                        [1, 'John Doe', 30, 50000, 'Engineering'],
                        [2, 'Jane Smith', 25, 45000, 'Marketing'],
                        [3, 'Bob Johnson', 35, 60000, 'Engineering'],
                        [4, 'Alice Brown', 28, 52000, 'HR'],
                        [5, 'Charlie Wilson', 32, 58000, 'Engineering'],
                        [6, 'Diana Davis', 27, 48000, 'Marketing'],
                        [7, 'Eve Miller', 29, 51000, 'HR'],
                        [8, 'Frank Garcia', 31, 54000, 'Engineering'],
                        [9, 'Grace Lee', 26, 47000, 'Marketing'],
                        [10, 'Henry Taylor', 33, 59000, 'Engineering']
                    ],
                    info: {
                        rows: 10,
                        columns: 5,
                        memory: '2.4 KB',
                        missing: 0
                    }
                };
                resolve();
            }, 2000);
        });
    }

    displayFileInfo() {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');

        fileName.textContent = this.fileInfo.name;
        fileSize.textContent = this.fileInfo.size;
        fileInfo.style.display = 'block';

        // Show data preview section
        document.getElementById('dataPreview').style.display = 'block';
        document.getElementById('analyze').style.display = 'block';
        document.getElementById('visualize').style.display = 'block';
        document.getElementById('export').style.display = 'block';
    }

    showDataPreview(type = 'head') {
        if (!this.data) return;

        const rows = type === 'head' ? this.data.rows.slice(0, 10) : this.data.rows.slice(-10);
        this.renderTable(rows);
        this.updateSummary();
        this.populateColumnSelectors();
    }

    renderTable(rows) {
        const tableWrapper = document.getElementById('tableWrapper');
        
        let tableHTML = '<table><thead><tr>';
        
        // Header row
        this.data.columns.forEach(column => {
            tableHTML += `<th>${column}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        // Data rows
        rows.forEach(row => {
            tableHTML += '<tr>';
            row.forEach(cell => {
                tableHTML += `<td>${cell}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody></table>';
        tableWrapper.innerHTML = tableHTML;
    }

    updateSummary() {
        document.getElementById('rowCount').textContent = this.data.info.rows;
        document.getElementById('colCount').textContent = this.data.info.columns;
        document.getElementById('memoryUsage').textContent = this.data.info.memory;
        document.getElementById('missingCount').textContent = this.data.info.missing;
    }

    populateColumnSelectors() {
        const columnSelector = document.getElementById('columnSelector');
        const xAxisSelect = document.getElementById('xAxis');
        const yAxisSelect = document.getElementById('yAxis');

        // Clear existing options
        columnSelector.innerHTML = '';
        xAxisSelect.innerHTML = '<option value="">Select column</option>';
        yAxisSelect.innerHTML = '<option value="">Select column</option>';

        this.data.columns.forEach((column, index) => {
            // Column selector for analysis
            const checkbox = document.createElement('div');
            checkbox.className = 'column-checkbox';
            checkbox.innerHTML = `
                <input type="checkbox" id="col_${index}" value="${column}">
                <label for="col_${index}">${column}</label>
            `;
            columnSelector.appendChild(checkbox);

            // Chart axis selectors
            const option = document.createElement('option');
            option.value = column;
            option.textContent = column;
            xAxisSelect.appendChild(option.cloneNode(true));
            yAxisSelect.appendChild(option);
        });
    }

    showDataInfo() {
        const resultsDiv = document.getElementById('analysisResults');
        resultsDiv.innerHTML = `
            <h3>Dataset Information</h3>
            <div class="info-grid">
                <div><strong>Shape:</strong> ${this.data.info.rows} rows × ${this.data.info.columns} columns</div>
                <div><strong>Memory Usage:</strong> ${this.data.info.memory}</div>
                <div><strong>Missing Values:</strong> ${this.data.info.missing}</div>
                <div><strong>Data Types:</strong> Mixed (automatically inferred)</div>
            </div>
        `;
    }

    async runAnalysis() {
        const selectedColumns = this.getSelectedColumns();
        if (selectedColumns.length === 0) {
            this.showError('Please select at least one column for analysis');
            return;
        }

        this.showLoading(true);
        
        try {
            // Simulate analysis (replace with actual API call)
            await this.simulateAnalysis(selectedColumns);
        } catch (error) {
            this.showError('Error running analysis: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async simulateAnalysis(columns) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const resultsDiv = document.getElementById('analysisResults');
                
                // Generate mock descriptive statistics
                const stats = columns.map(col => {
                    const colIndex = this.data.columns.indexOf(col);
                    const values = this.data.rows.map(row => row[colIndex]).filter(v => !isNaN(v));
                    
                    if (values.length > 0) {
                        const sorted = values.sort((a, b) => a - b);
                        const mean = values.reduce((a, b) => a + b, 0) / values.length;
                        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
                        const std = Math.sqrt(variance);
                        
                        return {
                            column: col,
                            count: values.length,
                            mean: mean.toFixed(2),
                            std: std.toFixed(2),
                            min: sorted[0],
                            '25%': sorted[Math.floor(sorted.length * 0.25)],
                            '50%': sorted[Math.floor(sorted.length * 0.5)],
                            '75%': sorted[Math.floor(sorted.length * 0.75)],
                            max: sorted[sorted.length - 1]
                        };
                    }
                    return null;
                }).filter(Boolean);

                let resultsHTML = '<h3>Descriptive Statistics</h3>';
                
                if (stats.length > 0) {
                    resultsHTML += '<div class="stats-table">';
                    resultsHTML += '<table><thead><tr><th>Column</th><th>Count</th><th>Mean</th><th>Std</th><th>Min</th><th>25%</th><th>50%</th><th>75%</th><th>Max</th></tr></thead><tbody>';
                    
                    stats.forEach(stat => {
                        resultsHTML += `<tr>
                            <td><strong>${stat.column}</strong></td>
                            <td>${stat.count}</td>
                            <td>${stat.mean}</td>
                            <td>${stat.std}</td>
                            <td>${stat.min}</td>
                            <td>${stat['25%']}</td>
                            <td>${stat['50%']}</td>
                            <td>${stat['75%']}</td>
                            <td>${stat.max}</td>
                        </tr>`;
                    });
                    
                    resultsHTML += '</tbody></table></div>';
                } else {
                    resultsHTML += '<p>No numerical columns selected for analysis.</p>';
                }

                resultsDiv.innerHTML = resultsHTML;
                resolve();
            }, 1500);
        });
    }

    async generateChart() {
        const chartType = document.getElementById('chartType').value;
        const xAxis = document.getElementById('xAxis').value;
        const yAxis = document.getElementById('yAxis').value;

        if (!xAxis) {
            this.showError('Please select an X-axis column');
            return;
        }

        this.showLoading(true);
        
        try {
            await this.simulateChartGeneration(chartType, xAxis, yAxis);
        } catch (error) {
            this.showError('Error generating chart: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async simulateChartGeneration(chartType, xAxis, yAxis) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const chartContainer = document.getElementById('chartContainer');
                
                // Generate mock chart data
                const xIndex = this.data.columns.indexOf(xAxis);
                const yIndex = this.data.columns.indexOf(yAxis);
                
                if (xIndex === -1) {
                    chartContainer.innerHTML = '<p>Invalid column selection</p>';
                    return;
                }

                const xData = this.data.rows.map(row => row[xIndex]);
                const yData = yAxis ? this.data.rows.map(row => row[yIndex]) : null;

                let chartData;
                let layout;

                switch (chartType) {
                    case 'histogram':
                        chartData = [{
                            x: xData,
                            type: 'histogram',
                            nbinsx: 10,
                            marker: {
                                color: '#6366f1',
                                line: { color: '#4f46e5', width: 1 }
                            }
                        }];
                        layout = {
                            title: `Distribution of ${xAxis}`,
                            xaxis: { title: xAxis },
                            yaxis: { title: 'Frequency' },
                            plot_bgcolor: '#f9fafb',
                            paper_bgcolor: '#f9fafb'
                        };
                        break;

                    case 'boxplot':
                        chartData = [{
                            y: xData,
                            type: 'box',
                            name: xAxis,
                            marker: { color: '#6366f1' }
                        }];
                        layout = {
                            title: `Box Plot of ${xAxis}`,
                            yaxis: { title: xAxis },
                            plot_bgcolor: '#f9fafb',
                            paper_bgcolor: '#f9fafb'
                        };
                        break;

                    case 'scatter':
                        if (!yAxis) {
                            chartContainer.innerHTML = '<p>Y-axis column required for scatter plot</p>';
                            return;
                        }
                        chartData = [{
                            x: xData,
                            y: yData,
                            mode: 'markers',
                            type: 'scatter',
                            marker: {
                                color: '#6366f1',
                                size: 8
                            }
                        }];
                        layout = {
                            title: `${xAxis} vs ${yAxis}`,
                            xaxis: { title: xAxis },
                            yaxis: { title: yAxis },
                            plot_bgcolor: '#f9fafb',
                            paper_bgcolor: '#f9fafb'
                        };
                        break;

                    case 'bar':
                        const valueCounts = {};
                        xData.forEach(val => {
                            valueCounts[val] = (valueCounts[val] || 0) + 1;
                        });
                        
                        chartData = [{
                            x: Object.keys(valueCounts),
                            y: Object.values(valueCounts),
                            type: 'bar',
                            marker: { color: '#6366f1' }
                        }];
                        layout = {
                            title: `Value Counts for ${xAxis}`,
                            yaxis: { title: 'Count' },
                            plot_bgcolor: '#f9fafb',
                            paper_bgcolor: '#f9fafb'
                        };
                        break;

                    default:
                        chartContainer.innerHTML = '<p>Unsupported chart type</p>';
                        return;
                }

                // Render chart using Plotly
                Plotly.newPlot(chartContainer, chartData, layout, {
                    responsive: true,
                    displayModeBar: true
                });

                resolve();
            }, 1000);
        });
    }

    getSelectedColumns() {
        const checkboxes = document.querySelectorAll('.column-checkbox input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showError(message) {
        // Create a simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            max-width: 300px;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Export functions (placeholder implementations)
    exportPDF() {
        this.showError('PDF export functionality coming soon!');
    }

    exportCSV() {
        if (!this.data) {
            this.showError('No data to export');
            return;
        }
        
        // Create CSV content
        const csvContent = [
            this.data.columns.join(','),
            ...this.data.rows.map(row => row.join(','))
        ].join('\n');
        
        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eda_export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    exportChart() {
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer.children.length === 0) {
            this.showError('No chart to export');
            return;
        }
        
        // Use Plotly's export functionality
        Plotly.downloadImage(chartContainer, {
            format: 'png',
            filename: 'eda_chart'
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EDAExplorer();
});