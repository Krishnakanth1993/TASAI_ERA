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
        console.log('EDAExplorer initialized'); // Debug log
    }

    setupEventListeners() {
        // File input change
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                console.log('File selected:', e.target.files[0]); // Debug log
                if (e.target.files.length > 0) {
                    this.handleFileSelect(e.target.files[0]);
                }
            });
        }

        // Analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                console.log('Analyze button clicked'); // Debug log
                this.startAnalysis();
            });
        }

        // Preview controls
        const headBtn = document.getElementById('headBtn');
        if (headBtn) {
            headBtn.addEventListener('click', () => {
                console.log('Head button clicked'); // Debug log
                this.showDataPreview('head');
            });
        }

        const tailBtn = document.getElementById('tailBtn');
        if (tailBtn) {
            tailBtn.addEventListener('click', () => {
                console.log('Tail button clicked'); // Debug log
                this.showDataPreview('tail');
            });
        }

        const infoBtn = document.getElementById('infoBtn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                console.log('Info button clicked'); // Debug log
                this.showDataInfo();
            });
        }

        // Analysis controls
        const runAnalysisBtn = document.getElementById('runAnalysisBtn');
        if (runAnalysisBtn) {
            runAnalysisBtn.addEventListener('click', () => {
                console.log('Run analysis button clicked'); // Debug log
                this.runAnalysis();
            });
        }

        // Chart generation
        const generateChartBtn = document.getElementById('generateChartBtn');
        if (generateChartBtn) {
            generateChartBtn.addEventListener('click', () => {
                console.log('Generate chart button clicked'); // Debug log
                this.generateChart();
            });
        }

        // Export buttons
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                this.exportPDF();
            });
        }

        const exportCsvBtn = document.getElementById('exportCsvBtn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                this.exportCSV();
            });
        }

        const exportChartBtn = document.getElementById('exportChartBtn');
        if (exportChartBtn) {
            exportChartBtn.addEventListener('click', () => {
                this.exportChart();
            });
        }
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
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
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                console.log('Navigation clicked:', targetId); // Debug log
                
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

        console.log('Processing file:', file.name, file.size); // Debug log

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
            if (fileExtension === '.csv') {
                // Handle CSV file
                await this.processCSVFile(file);
            } else {
                // Handle Excel file
                await this.simulateFileProcessing(file);
            }
            
            this.fileInfo = {
                name: file.name,
                size: this.formatFileSize(file.size),
                type: fileExtension
            };

            this.displayFileInfo();
            this.showDataPreview('head');
            
        } catch (error) {
            console.error('Error processing file:', error); // Debug log
            this.showError('Error processing file: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async processCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const csvText = e.target.result;
                    const lines = csvText.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim());
                    
                    const rows = [];
                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            const values = lines[i].split(',').map(v => v.trim());
                            rows.push(values);
                        }
                    }

                    this.data = {
                        columns: headers,
                        rows: rows,
                        info: {
                            rows: rows.length,
                            columns: headers.length,
                            memory: this.formatFileSize(file.size),
                            missing: 0
                        }
                    };

                    console.log('CSV data loaded:', this.data); // Debug log
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
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
                console.log('Mock data loaded:', this.data); // Debug log
                resolve();
            }, 2000);
        });
    }

    displayFileInfo() {
        console.log('Displaying file info'); // Debug log
        
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');

        if (fileInfo && fileName && fileSize) {
            fileName.textContent = this.fileInfo.name;
            fileSize.textContent = this.fileInfo.size;
            fileInfo.style.display = 'block';
        }

        // Show all sections
        this.showSection('dataPreview');
        this.showSection('analyze');
        this.showSection('visualize');
        this.showSection('export');
    }

    showSection(sectionId) {
        console.log('Showing section:', sectionId); // Debug log
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            console.log('Section shown:', sectionId); // Debug log
        } else {
            console.error('Section not found:', sectionId); // Debug log
        }
    }

    updateNavigation(activeSectionId) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${activeSectionId}`) {
                link.classList.add('active');
            }
        });
    }

    showDataPreview(type = 'head') {
        if (!this.data) {
            console.error('No data available for preview'); // Debug log
            return;
        }

        console.log('Showing data preview:', type, this.data); // Debug log

        const rows = type === 'head' ? this.data.rows.slice(0, 10) : this.data.rows.slice(-10);
        this.renderTable(rows);
        this.updateSummary();
        this.populateColumnSelectors();
    }

    renderTable(rows) {
        const tableWrapper = document.getElementById('tableWrapper');
        
        if (!tableWrapper) {
            console.error('Table wrapper not found!');
            return;
        }
        
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
        
        console.log('Table rendered with', rows.length, 'rows'); // Debug log
    }

    updateSummary() {
        const rowCount = document.getElementById('rowCount');
        const colCount = document.getElementById('colCount');
        const memoryUsage = document.getElementById('memoryUsage');
        const missingCount = document.getElementById('missingCount');

        if (rowCount) rowCount.textContent = this.data.info.rows;
        if (colCount) colCount.textContent = this.data.info.columns;
        if (memoryUsage) memoryUsage.textContent = this.data.info.memory;
        if (missingCount) missingCount.textContent = this.data.info.missing;
    }

    populateColumnSelectors() {
        const columnSelector = document.getElementById('columnSelector');
        const xAxisSelect = document.getElementById('xAxis');
        const yAxisSelect = document.getElementById('yAxis');

        // Clear existing options
        if (columnSelector) columnSelector.innerHTML = '';
        if (xAxisSelect) xAxisSelect.innerHTML = '<option value="">Select column</option>';
        if (yAxisSelect) yAxisSelect.innerHTML = '<option value="">Select column</option>';

        this.data.columns.forEach((column, index) => {
            // Column selector for analysis
            if (columnSelector) {
                const checkbox = document.createElement('div');
                checkbox.className = 'column-checkbox';
                checkbox.innerHTML = `
                    <input type="checkbox" id="col_${index}" value="${column}">
                    <label for="col_${index}">${column}</label>
                `;
                columnSelector.appendChild(checkbox);
            }

            // Chart axis selectors
            if (xAxisSelect) {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = column;
                xAxisSelect.appendChild(option.cloneNode(true));
            }
            
            if (yAxisSelect) {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = column;
                yAxisSelect.appendChild(option);
            }
        });
    }

    startAnalysis() {
        console.log('Starting analysis'); // Debug log
        
        // Show data preview first
        this.showDataPreview('head');
        
        // Then automatically show the analyze section
        this.showSection('analyze');
        
        // Update navigation
        this.updateNavigation('analyze');
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
        if (overlay) {
            if (show) {
                overlay.classList.add('show');
            } else {
                overlay.classList.remove('show');
            }
        }
    }

    showError(message) {
        console.error('Error:', message); // Debug log
        
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
        if (chartContainer && chartContainer.children.length === 0) {
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
    console.log('DOM loaded, initializing EDAExplorer'); // Debug log
    new EDAExplorer();
});