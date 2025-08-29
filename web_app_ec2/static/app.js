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

        // Preview controls with highlighting
        const headBtn = document.getElementById('headBtn');
        if (headBtn) {
            headBtn.addEventListener('click', () => {
                this.highlightPreviewButton('head');
                this.showDataPreview('head');
            });
        }

        const tailBtn = document.getElementById('tailBtn');
        if (tailBtn) {
            tailBtn.addEventListener('click', () => {
                this.highlightPreviewButton('tail');
                this.showDataPreview('tail');
            });
        }

        const infoBtn = document.getElementById('infoBtn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                this.highlightPreviewButton('info');
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

        // Add analysis type selection
        const analysisButtons = document.querySelectorAll('.analysis-options button');
        analysisButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                analysisButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');
                console.log('Analysis type selected:', button.dataset.analysis);
            });
        });
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

            // Chart axis selectors with clear buttons
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

        // Add clear buttons for axis selection
        this.addAxisClearButtons();
    }

    addAxisClearButtons() {
        const xAxisContainer = document.getElementById('xAxis').parentNode;
        const yAxisContainer = document.getElementById('yAxis').parentNode;

        // Add clear button for X-axis
        if (!document.getElementById('clearXAxis')) {
            const clearXBtn = document.createElement('button');
            clearXBtn.id = 'clearXAxis';
            clearXBtn.className = 'btn btn-outline btn-sm';
            clearXBtn.innerHTML = '<i class="fas fa-times"></i>';
            clearXBtn.style.marginLeft = '0.5rem';
            clearXBtn.onclick = () => {
                document.getElementById('xAxis').value = '';
            };
            xAxisContainer.appendChild(clearXBtn);
        }

        // Add clear button for Y-axis
        if (!document.getElementById('clearYAxis')) {
            const clearYBtn = document.createElement('button');
            clearYBtn.id = 'clearYAxis';
            clearYBtn.className = 'btn btn-outline btn-sm';
            clearYBtn.innerHTML = '<i class="fas fa-times"></i>';
            clearYBtn.style.marginLeft = '0.5rem';
            clearYBtn.onclick = () => {
                document.getElementById('yAxis').value = '';
            };
            yAxisContainer.appendChild(clearYBtn);
        }
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
        if (!this.data) {
            console.error('No data available for info');
            return;
        }

        const resultsDiv = document.getElementById('analysisResults');
        if (!resultsDiv) {
            console.error('Analysis results div not found');
            return;
        }

        // Calculate missing values per column
        const missingInfo = this.data.columns.map((col, colIndex) => {
            const missingCount = this.data.rows.filter(row => 
                row[colIndex] === null || row[colIndex] === undefined || row[colIndex] === ''
            ).length;
            const missingPercent = ((missingCount / this.data.rows.length) * 100).toFixed(1);
            return { column: col, missing: missingCount, percent: missingPercent };
        });

        // Determine data types
        const dataTypes = this.data.columns.map((col, colIndex) => {
            const sampleValues = this.data.rows.slice(0, 10).map(row => row[colIndex]);
            const hasNumbers = sampleValues.some(val => !isNaN(parseFloat(val)) && val !== '');
            const hasDates = sampleValues.some(val => !isNaN(Date.parse(val)) && val !== '');
            
            if (hasDates) return 'datetime';
            if (hasNumbers) return 'numeric';
            return 'categorical';
        });

        let infoHTML = `
            <h3>Dataset Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Shape:</strong> ${this.data.info.rows} rows × ${this.data.info.columns} columns
                </div>
                <div class="info-item">
                    <strong>Memory Usage:</strong> ${this.data.info.memory}
                </div>
                <div class="info-item">
                    <strong>Total Missing Values:</strong> ${this.data.info.missing}
                </div>
            </div>
            
            <h4>Column Information</h4>
            <div class="column-info-table">
                <table>
                    <thead>
                        <tr>
                            <th>Column</th>
                            <th>Data Type</th>
                            <th>Missing Values</th>
                            <th>Missing %</th>
                            <th>Unique Values</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.data.columns.forEach((col, index) => {
            const uniqueValues = new Set(this.data.rows.map(row => row[index])).size;
            const missingInfo = missingInfo[index];
            const dataType = dataTypes[index];
            
            infoHTML += `
                <tr>
                    <td><strong>${col}</strong></td>
                    <td><span class="data-type ${dataType}">${dataType}</span></td>
                    <td>${missingInfo.missing}</td>
                    <td>${missingInfo.percent}%</td>
                    <td>${uniqueValues}</td>
                </tr>
            `;
        });

        infoHTML += `
                    </tbody>
                </table>
            </div>
        `;

        resultsDiv.innerHTML = infoHTML;
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
                const activeAnalysis = document.querySelector('.analysis-options button.active');
                const analysisType = activeAnalysis ? activeAnalysis.dataset.analysis : 'descriptive';
                
                console.log('Running analysis type:', analysisType, 'on columns:', columns);
                
                let resultsHTML = `<h3>${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Analysis</h3>`;
                
                if (analysisType === 'descriptive') {
                    resultsHTML += this.generateDescriptiveStats(columns);
                } else if (analysisType === 'correlation') {
                    resultsHTML += this.generateCorrelationAnalysis(columns);
                } else if (analysisType === 'outliers') {
                    resultsHTML += this.generateOutlierAnalysis(columns);
                } else if (analysisType === 'normality') {
                    resultsHTML += this.generateNormalityTests(columns);
                }

                resultsDiv.innerHTML = resultsHTML;
                resolve();
            }, 1500);
        });
    }

    generateDescriptiveStats(columns) {
                    const stats = columns.map(col => {
                        const colIndex = this.data.columns.indexOf(col);
                        const values = this.data.rows.map(row => {
                            const val = row[colIndex];
                            const numVal = parseFloat(val);
                            return isNaN(numVal) ? null : numVal;
                        }).filter(v => v !== null);
                        
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
                                min: sorted[0].toFixed(2),
                                '25%': sorted[Math.floor(sorted.length * 0.25)].toFixed(2),
                                '50%': sorted[Math.floor(sorted.length * 0.5)].toFixed(2),
                                '75%': sorted[Math.floor(sorted.length * 0.75)].toFixed(2),
                                max: sorted[sorted.length - 1].toFixed(2)
                            };
                        }
                        return null;
                    }).filter(Boolean);

                    if (stats.length > 0) {
            let html = '<div class="stats-table">';
            html += '<table><thead><tr><th>Column</th><th>Count</th><th>Mean</th><th>Std</th><th>Min</th><th>25%</th><th>50%</th><th>75%</th><th>Max</th></tr></thead><tbody>';
                        
                        stats.forEach(stat => {
                html += `<tr>
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
                        
            html += '</tbody></table></div>';
            return html;
                    } else {
            return '<p>No numerical columns selected for analysis.</p>';
                    }
    }

    generateCorrelationAnalysis(columns) {
                    const numericColumns = columns.filter(col => {
                        const colIndex = this.data.columns.indexOf(col);
                        const values = this.data.rows.map(row => parseFloat(row[colIndex]));
                        return values.some(v => !isNaN(v));
                    });
                    
        if (numericColumns.length < 2) {
            return '<p>Need at least 2 numerical columns for correlation analysis.</p>';
        }

        // Calculate correlation matrix
        const correlationMatrix = [];
        const correlationData = [];
        
        for (let i = 0; i < numericColumns.length; i++) {
            const row = [];
            const col1Index = this.data.columns.indexOf(numericColumns[i]);
            const values1 = this.data.rows.map(row => parseFloat(row[col1Index])).filter(v => !isNaN(v));
            
            for (let j = 0; j < numericColumns.length; j++) {
                const col2Index = this.data.columns.indexOf(numericColumns[j]);
                const values2 = this.data.rows.map(row => parseFloat(row[col2Index])).filter(v => !isNaN(v));
                
                // Calculate Pearson correlation
                const correlation = this.calculatePearsonCorrelation(values1, values2);
                row.push(correlation);
                
                if (i !== j) {
                    correlationData.push({
                        col1: numericColumns[i],
                        col2: numericColumns[j],
                        correlation: correlation
                    });
                }
            }
            correlationMatrix.push(row);
        }

        // Sort correlations by absolute value
        correlationData.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

        let html = '<div class="correlation-analysis">';
        
        // Correlation matrix table
        html += '<h4>Correlation Matrix</h4>';
        html += '<div class="correlation-matrix">';
        html += '<table><thead><tr><th>Column</th>';
        numericColumns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        numericColumns.forEach((col, i) => {
            html += '<tr>';
            html += `<td><strong>${col}</strong></td>`;
            correlationMatrix[i].forEach(corr => {
                const colorClass = this.getCorrelationColorClass(corr);
                html += `<td class="${colorClass}">${corr.toFixed(3)}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        
        // Top correlations
        html += '<h4>Top Correlations</h4>';
        html += '<div class="top-correlations">';
        html += '<table><thead><tr><th>Column 1</th><th>Column 2</th><th>Correlation</th><th>Strength</th></tr></thead><tbody>';
        
        correlationData.slice(0, 10).forEach(item => {
            const strength = this.getCorrelationStrength(item.correlation);
            const colorClass = this.getCorrelationColorClass(item.correlation);
            html += `<tr>
                <td>${item.col1}</td>
                <td>${item.col2}</td>
                <td class="${colorClass}">${item.correlation.toFixed(3)}</td>
                <td>${strength}</td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        html += '</div>';
        
        return html;
    }

    generateOutlierAnalysis(columns) {
        const outlierResults = [];
        
        columns.forEach(col => {
            const colIndex = this.data.columns.indexOf(col);
            const values = this.data.rows.map(row => {
                const val = row[colIndex];
                const numVal = parseFloat(val);
                return isNaN(numVal) ? null : numVal;
            }).filter(v => v !== null);
            
            if (values.length > 0) {
                const sorted = values.sort((a, b) => a - b);
                const q1 = sorted[Math.floor(sorted.length * 0.25)];
                const q3 = sorted[Math.floor(sorted.length * 0.75)];
                const iqr = q3 - q1;
                const lowerBound = q1 - 1.5 * iqr;
                const upperBound = q3 + 1.5 * iqr;
                
                const outliers = values.filter(v => v < lowerBound || v > upperBound);
                const outlierIndices = this.data.rows
                    .map((row, idx) => ({ row, idx }))
                    .filter(({ row }) => {
                        const val = parseFloat(row[colIndex]);
                        return !isNaN(val) && (val < lowerBound || val > upperBound);
                    })
                    .map(({ idx }) => idx + 1); // +1 for 1-based indexing
                
                outlierResults.push({
                    column: col,
                    totalValues: values.length,
                    outliers: outliers.length,
                    outlierPercentage: ((outliers.length / values.length) * 100).toFixed(1),
                    lowerBound: lowerBound.toFixed(2),
                    upperBound: upperBound.toFixed(2),
                    outlierValues: outliers.slice(0, 10), // Show first 10 outliers
                    outlierIndices: outlierIndices.slice(0, 10) // Show first 10 indices
                });
            }
        });

        if (outlierResults.length === 0) {
            return '<p>No numerical columns selected for outlier analysis.</p>';
        }

        let html = '<div class="outlier-analysis">';
        html += '<h4>Outlier Detection Results (IQR Method)</h4>';
        
        outlierResults.forEach(result => {
            html += `<div class="outlier-result">`;
            html += `<h5>${result.column}</h5>`;
            html += `<div class="outlier-stats">`;
            html += `<p><strong>Total Values:</strong> ${result.totalValues}</p>`;
            html += `<p><strong>Outliers Found:</strong> ${result.outliers} (${result.outlierPercentage}%)</p>`;
            html += `<p><strong>Lower Bound:</strong> ${result.lowerBound}</p>`;
            html += `<p><strong>Upper Bound:</strong> ${result.upperBound}</p>`;
            html += `</div>`;
            
            if (result.outliers > 0) {
                html += `<div class="outlier-details">`;
                html += `<p><strong>Sample Outlier Values:</strong> ${result.outlierValues.join(', ')}</p>`;
                html += `<p><strong>Sample Outlier Row Indices:</strong> ${result.outlierIndices.join(', ')}</p>`;
                html += `</div>`;
            }
            
            html += `</div>`;
        });
        
        html += '</div>';
        return html;
    }

    generateNormalityTests(columns) {
        const normalityResults = [];
        
        columns.forEach(col => {
            const colIndex = this.data.columns.indexOf(col);
            const values = this.data.rows.map(row => {
                const val = row[colIndex];
                const numVal = parseFloat(val);
                return isNaN(numVal) ? null : numVal;
            }).filter(v => v !== null);
            
            if (values.length >= 3) { // Need at least 3 values for normality tests
                const sorted = values.sort((a, b) => a - b);
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
                const std = Math.sqrt(variance);
                
                // Calculate skewness
                const skewness = this.calculateSkewness(values, mean, std);
                
                // Calculate kurtosis
                const kurtosis = this.calculateKurtosis(values, mean, std);
                
                // Simple normality assessment based on skewness and kurtosis
                const isNormal = Math.abs(skewness) < 1 && Math.abs(kurtosis - 3) < 2;
                
                normalityResults.push({
                    column: col,
                    sampleSize: values.length,
                    mean: mean.toFixed(2),
                    std: std.toFixed(2),
                    skewness: skewness.toFixed(3),
                    kurtosis: kurtosis.toFixed(3),
                    isNormal: isNormal,
                    assessment: this.getNormalityAssessment(skewness, kurtosis)
                });
            }
        });

        if (normalityResults.length === 0) {
            return '<p>No numerical columns with sufficient data for normality tests.</p>';
        }

        let html = '<div class="normality-analysis">';
        html += '<h4>Normality Test Results</h4>';
        html += '<p><em>Note: This is a simplified normality assessment based on skewness and kurtosis.</em></p>';
        
        html += '<div class="normality-table">';
        html += '<table><thead><tr><th>Column</th><th>Sample Size</th><th>Mean</th><th>Std</th><th>Skewness</th><th>Kurtosis</th><th>Assessment</th></tr></thead><tbody>';
        
        normalityResults.forEach(result => {
            const normalClass = result.isNormal ? 'normal' : 'not-normal';
            html += `<tr class="${normalClass}">
                <td><strong>${result.column}</strong></td>
                <td>${result.sampleSize}</td>
                <td>${result.mean}</td>
                <td>${result.std}</td>
                <td>${result.skewness}</td>
                <td>${result.kurtosis}</td>
                <td class="assessment ${normalClass}">${result.assessment}</td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        
        // Interpretation guide
        html += '<div class="normality-guide">';
        html += '<h5>Interpretation Guide:</h5>';
        html += '<ul>';
        html += '<li><strong>Skewness:</strong> Values close to 0 indicate symmetric distribution</li>';
        html += '<li><strong>Kurtosis:</strong> Values close to 3 indicate normal-like tails</li>';
        html += '<li><strong>Assessment:</strong> Based on skewness < 1 and kurtosis between 1-5</li>';
        html += '</ul>';
        html += '</div>';
        
        html += '</div>';
        return html;
    }

    // Helper methods for calculations
    calculatePearsonCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0) return 0;
        
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);
        const sumY2 = y.reduce((a, b) => a + b * b, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    calculateSkewness(values, mean, std) {
        if (std === 0) return 0;
        const n = values.length;
        const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / n;
        return skewness;
    }

    calculateKurtosis(values, mean, std) {
        if (std === 0) return 0;
        const n = values.length;
        const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / n;
        return kurtosis;
    }

    getCorrelationColorClass(correlation) {
        const absCorr = Math.abs(correlation);
        if (absCorr >= 0.8) return 'correlation-strong';
        if (absCorr >= 0.5) return 'correlation-moderate';
        if (absCorr >= 0.3) return 'correlation-weak';
        return 'correlation-none';
    }

    getCorrelationStrength(correlation) {
        const absCorr = Math.abs(correlation);
        if (absCorr >= 0.8) return 'Very Strong';
        if (absCorr >= 0.6) return 'Strong';
        if (absCorr >= 0.4) return 'Moderate';
        if (absCorr >= 0.2) return 'Weak';
        return 'Very Weak';
    }

    getNormalityAssessment(skewness, kurtosis) {
        if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis - 3) < 1) return 'Likely Normal';
        if (Math.abs(skewness) < 1 && Math.abs(kurtosis - 3) < 2) return 'Approximately Normal';
        if (Math.abs(skewness) < 2 && Math.abs(kurtosis - 3) < 4) return 'Moderately Non-Normal';
        return 'Highly Non-Normal';
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
                            paper_bgcolor: '#f9fafb',
                            autosize: true,
                            margin: { l: 50, r: 50, t: 50, b: 50 }
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
                            paper_bgcolor: '#f9fafb',
                            autosize: true,
                            margin: { l: 50, r: 50, t: 50, b: 50 }
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
                            paper_bgcolor: '#f9fafb',
                            autosize: true,
                            margin: { l: 50, r: 50, t: 50, b: 50 }
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
                            xaxis: { title: xAxis },
                            yaxis: { title: 'Count' },
                            plot_bgcolor: '#f9fafb',
                            paper_bgcolor: '#f9fafb',
                            autosize: true,
                            margin: { l: 50, r: 50, t: 50, b: 50 }
                        };
                        break;

                    default:
                        chartContainer.innerHTML = '<p>Unsupported chart type</p>';
                        return;
                }

                // Render chart using Plotly with responsive settings
                Plotly.newPlot(chartContainer, chartData, layout, {
                    responsive: true,
                    displayModeBar: true,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
                    displaylogo: false
                });

                // Make chart responsive
                window.addEventListener('resize', () => {
                    Plotly.Plots.resize(chartContainer);
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

    highlightPreviewButton(activeButton) {
        const previewButtons = ['headBtn', 'tailBtn', 'infoBtn'];
        previewButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                if (btnId === activeButton + 'Btn') {
                    btn.classList.add('active');
                    btn.classList.remove('btn-outline');
                    btn.classList.add('btn-primary');
                } else {
                    btn.classList.remove('active');
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline');
                }
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing EDAExplorer'); // Debug log
    new EDAExplorer();
});