class EDAExplorer {
    constructor() {
        this.data = null;
        this.fileInfo = null;
        this.currentAnalysis = null;
        this.report = {
            dataInfo: null,
            correlationAnalysis: null,
            descriptiveStats: null,
            outlierAnalysis: null,
            normalityTests: null,
            charts: [],
            timestamp: null
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.updateColumnSelectionUI();
    }

    setupEventListeners() {
        // File input change
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Drag and drop events
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        }

        // Analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.runAnalysis());
        }

        // Data preview buttons
        const headBtn = document.getElementById('headBtn');
        const tailBtn = document.getElementById('tailBtn');
        const infoBtn = document.getElementById('infoBtn');

        if (headBtn) headBtn.addEventListener('click', () => this.showDataPreview('head'));
        if (tailBtn) tailBtn.addEventListener('click', () => this.showDataPreview('tail'));
        if (infoBtn) infoBtn.addEventListener('click', () => this.showDataPreview('info'));

        // Chart type change handler
        const chartTypeSelect = document.getElementById('chartType');
        if (chartTypeSelect) {
            chartTypeSelect.addEventListener('change', () => {
                this.updateColumnSelectionUI();
            });
        }

        // Generate chart button
        const generateChartBtn = document.getElementById('generateChartBtn');
        if (generateChartBtn) {
            generateChartBtn.addEventListener('click', () => this.generateChart());
        }

        // Add to report button
        const addToReportBtn = document.getElementById('addToReportBtn');
        if (addToReportBtn) {
            addToReportBtn.addEventListener('click', () => this.addChartToReport());
        }

        // Preview report button
        const previewReportBtn = document.getElementById('previewReportBtn');
        if (previewReportBtn) {
            previewReportBtn.addEventListener('click', () => this.previewReport());
        }

        // Download report button
        const downloadReportBtn = document.getElementById('downloadReportBtn');
        if (downloadReportBtn) {
            downloadReportBtn.addEventListener('click', () => this.downloadReport());
        }

        // Clear selections button
        const clearSelectionsBtn = document.getElementById('clearSelectionsBtn');
        if (clearSelectionsBtn) {
            clearSelectionsBtn.addEventListener('click', () => this.clearSelections());
        }

        // Analysis type selection
        const analysisButtons = document.querySelectorAll('.analysis-options button');
        analysisButtons.forEach(button => {
            button.addEventListener('click', () => {
                analysisButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                console.log('Analysis type selected:', button.dataset.analysis);
            });
        });
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.classList.add('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.classList.remove('drag-over');
        }
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    async handleFile(file) {
        if (!this.validateFile(file)) return;

        try {
            this.showLoading(true);
            const formData = new FormData();
            formData.append('file', file);

            console.log('Uploading file:', file.name, 'Size:', file.size);

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Upload successful:', result);
                console.log('Data received:', result.data);
                console.log('Data length:', result.data.length);
                console.log('First row:', result.data[0]);
                
                this.data = result.data;
                this.fileInfo = {
                    name: file.name,
                    size: this.formatFileSize(file.size),
                    rows: result.data.length,
                    columns: Object.keys(result.data[0]).length
                };
                
                console.log('File info set:', this.fileInfo);
                console.log('Data stored:', this.data);
                
                this.displayFileInfo();
                this.showDataPreview('head');
                this.updateColumnSelectionUI();
                this.showSection('dataPreview');
                this.showSection('analyze');
                this.showSection('visualize');
                this.showSection('report');
            } else {
                const errorText = await response.text();
                console.error('Upload failed:', errorText);
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            this.showError(`Failed to upload file: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    validateFile(file) {
        const allowedTypes = [
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        const maxSize = 100 * 1024 * 1024; // 100MB

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
            this.showError('Please select a valid CSV or Excel file.');
            return false;
        }

        if (file.size > maxSize) {
            this.showError('File size must be less than 100MB.');
            return false;
        }

        return true;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    displayFileInfo() {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');

        if (fileInfo && fileName && fileSize) {
            fileName.textContent = this.fileInfo.name;
            fileSize.textContent = `${this.fileInfo.size} • ${this.fileInfo.rows} rows • ${this.fileInfo.columns} columns`;
            fileInfo.style.display = 'flex';
        }
    }

    showDataPreview(type) {
        console.log('showDataPreview called with type:', type);
        console.log('Current data:', this.data);
        
        if (!this.data || this.data.length === 0) {
            console.error('No data available for preview');
            return;
        }

        const previewContainer = document.getElementById('dataPreviewContent');
        if (!previewContainer) {
            console.error('Preview container not found');
            return;
        }

        console.log('Preview container found:', previewContainer);

        // Update button states
        const headBtn = document.getElementById('headBtn');
        const tailBtn = document.getElementById('tailBtn');
        const infoBtn = document.getElementById('infoBtn');

        if (headBtn) headBtn.classList.remove('active');
        if (tailBtn) tailBtn.classList.remove('active');
        if (infoBtn) infoBtn.classList.remove('active');

        if (type === 'head') {
            if (headBtn) headBtn.classList.add('active');
            console.log('Displaying head data');
            this.displayTable(this.data.slice(0, 10), 'First 10 Rows');
        } else if (type === 'tail') {
            if (tailBtn) tailBtn.classList.add('active');
            console.log('Displaying tail data');
            this.displayTable(this.data.slice(-10), 'Last 10 Rows');
        } else if (type === 'info') {
            if (infoBtn) infoBtn.classList.add('active');
            console.log('Displaying data info');
            this.displayDataInfo();
        }
    }

    displayTable(data, title) {
        console.log('displayTable called with:', title, data);
        
        const previewContainer = document.getElementById('dataPreviewContent');
        if (!previewContainer) {
            console.error('Preview container not found in displayTable');
            return;
        }

        if (!data || data.length === 0) {
            console.error('No data to display');
            previewContainer.innerHTML = '<p class="no-data">No data to display</p>';
            return;
        }

        console.log('Data to display:', data);
        console.log('First row keys:', Object.keys(data[0]));

        const columns = Object.keys(data[0]);
        let tableHTML = `<h3>${title}</h3>`;
        tableHTML += '<div class="table-wrapper">';
        tableHTML += '<table class="data-table">';
        
        // Header
        tableHTML += '<thead><tr>';
        columns.forEach(col => {
            tableHTML += `<th>${col}</th>`;
        });
        tableHTML += '</tr></thead>';
        
        // Body
        tableHTML += '<tbody>';
        data.forEach((row, index) => {
            tableHTML += '<tr>';
            columns.forEach(col => {
                const value = row[col] !== null && row[col] !== undefined ? row[col] : '';
                tableHTML += `<td>${value}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody>';
        tableHTML += '</table></div>';

        console.log('Generated table HTML length:', tableHTML.length);
        previewContainer.innerHTML = tableHTML;
        console.log('Table rendered successfully');
    }

    displayDataInfo() {
        const previewContainer = document.getElementById('dataPreviewContent');
        if (!previewContainer || !this.data || this.data.length === 0) return;

        const columns = Object.keys(this.data[0]);
        let infoHTML = '<h3>Dataset Information</h3>';
        infoHTML += '<div class="info-grid">';
        
        // Basic info
        infoHTML += '<div class="info-card">';
        infoHTML += '<h4>Basic Information</h4>';
        infoHTML += `<p><strong>Total Rows:</strong> ${this.data.length}</p>`;
        infoHTML += `<p><strong>Total Columns:</strong> ${columns.length}</p>`;
        infoHTML += `<p><strong>Memory Usage:</strong> ${this.estimateMemoryUsage()} MB</p>`;
        infoHTML += '</div>';

        // Column types
        infoHTML += '<div class="info-card">';
        infoHTML += '<h4>Column Types</h4>';
        columns.forEach(col => {
            const sampleValues = this.data.slice(0, 100).map(row => row[col]).filter(val => val !== null && val !== undefined);
            const type = this.inferColumnType(sampleValues);
            infoHTML += `<p><strong>${col}:</strong> ${type}</p>`;
        });
        infoHTML += '</div>';

        // Missing values
        infoHTML += '<div class="info-card">';
        infoHTML += '<h4>Missing Values</h4>';
        columns.forEach(col => {
            const missingCount = this.data.filter(row => row[col] === null || row[col] === undefined || row[col] === '').length;
            const missingPercent = ((missingCount / this.data.length) * 100).toFixed(2);
            infoHTML += `<p><strong>${col}:</strong> ${missingCount} (${missingPercent}%)</p>`;
        });
        infoHTML += '</div>';

        infoHTML += '</div>';
        previewContainer.innerHTML = infoHTML;
    }

    inferColumnType(values) {
        if (values.length === 0) return 'Unknown';
        
        const numericCount = values.filter(val => !isNaN(parseFloat(val)) && isFinite(val)).length;
        const dateCount = values.filter(val => !isNaN(Date.parse(val))).length;
        
        if (numericCount / values.length > 0.8) return 'Numeric';
        if (dateCount / values.length > 0.8) return 'Date';
        return 'Categorical';
    }

    estimateMemoryUsage() {
        // Rough estimation
        const sampleSize = Math.min(1000, this.data.length);
        const sample = this.data.slice(0, sampleSize);
        const sampleSizeBytes = JSON.stringify(sample).length;
        const estimatedBytes = (sampleSizeBytes / sampleSize) * this.data.length;
        return (estimatedBytes / (1024 * 1024)).toFixed(2);
    }

    updateColumnSelectionUI() {
        const chartType = document.getElementById('chartType')?.value || 'scatter';
        const columnSelect = document.getElementById('columnSelect');
        
        if (!columnSelect) return;

        // Clear previous options
        columnSelect.innerHTML = '';

        if (!this.data || this.data.length === 0) return;

        const columns = Object.keys(this.data[0]);
        const numericColumns = columns.filter(col => this.isNumericColumn(col));

        if (chartType === 'scatter') {
            // Single select for X and Y axis
            columnSelect.innerHTML = `
                <option value="">Select X-Axis Column</option>
                ${numericColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
            `;
            
            // Add Y-axis select
            const yAxisSelect = document.createElement('select');
            yAxisSelect.id = 'yAxisSelect';
            yAxisSelect.className = 'form-select';
            yAxisSelect.innerHTML = `
                <option value="">Select Y-Axis Column</option>
                ${numericColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
            `;
            
            // Insert Y-axis select after X-axis select
            columnSelect.parentNode.insertBefore(yAxisSelect, columnSelect.nextSibling);
            
        } else if (chartType === 'box') {
            // Multi-select for multiple columns
            columnSelect.innerHTML = `
                <option value="">Select Columns (Multiple)</option>
                ${numericColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
            `;
            columnSelect.multiple = true;
            columnSelect.size = Math.min(6, numericColumns.length);
            
        } else if (chartType === 'histogram') {
            // Single select for column
            columnSelect.innerHTML = `
                <option value="">Select Column</option>
                ${numericColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
            `;
            columnSelect.multiple = false;
            columnSelect.size = 1;
            
        } else if (chartType === 'bar') {
            // Single select for categorical column
            columnSelect.innerHTML = `
                <option value="">Select Column</option>
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            `;
            columnSelect.multiple = false;
            columnSelect.size = 1;
        }
    }

    isNumericColumn(columnName) {
        if (!this.data || this.data.length === 0) return false;
        
        const sampleValues = this.data.slice(0, 100).map(row => row[columnName]);
        const numericCount = sampleValues.filter(val => 
            val !== null && val !== undefined && val !== '' && !isNaN(parseFloat(val)) && isFinite(val)
        ).length;
        
        return (numericCount / sampleValues.length) > 0.8;
    }

    async runAnalysis() {
        if (!this.data || this.data.length === 0) {
            this.showError('No data loaded. Please upload a file first.');
            return;
        }

        const selectedColumns = this.getSelectedColumns();
        if (selectedColumns.length === 0) {
            this.showError('Please select at least one column for analysis.');
            return;
        }

        this.showLoading(true);
        const activeAnalysis = document.querySelector('.analysis-options button.active');
        const analysisType = activeAnalysis ? activeAnalysis.dataset.analysis : 'descriptive';

        try {
            const results = await this.simulateAnalysis(selectedColumns);
            this.displayAnalysisResults(results, analysisType);
            
            // Auto-add to report
            this.addAnalysisToReport(results, analysisType);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Analysis failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    getSelectedColumns() {
        const columnSelect = document.getElementById('columnSelect');
        if (!columnSelect) return [];

        if (columnSelect.multiple) {
            return Array.from(columnSelect.selectedOptions).map(option => option.value);
        } else {
            return columnSelect.value ? [columnSelect.value] : [];
        }
    }

    async simulateAnalysis(columns) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const resultsDiv = document.getElementById('analysisResults');
                const activeAnalysis = document.querySelector('.analysis-options button.active');
                const analysisType = activeAnalysis ? activeAnalysis.dataset.analysis : 'descriptive';
                
                console.log('Running analysis:', analysisType, 'on columns:', columns);
                
                let results = {};
                
                if (analysisType === 'descriptive') {
                    results = this.generateDescriptiveStats(columns);
                } else if (analysisType === 'correlation') {
                    results = this.generateCorrelationAnalysis(columns);
                } else if (analysisType === 'outliers') {
                    results = this.generateOutlierAnalysis(columns);
                } else if (analysisType === 'normality') {
                    results = this.generateNormalityTests(columns);
                }
                
                resolve(results);
            }, 1000);
        });
    }

    generateDescriptiveStats(columns) {
        const stats = {};
        
        columns.forEach(col => {
            if (this.isNumericColumn(col)) {
                const values = this.data.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
                if (values.length > 0) {
                    const sorted = values.sort((a, b) => a - b);
                    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                    const std = Math.sqrt(variance);
                    
                    stats[col] = {
                        count: values.length,
                        mean: mean.toFixed(4),
                        std: std.toFixed(4),
                        min: sorted[0].toFixed(4),
                        q25: sorted[Math.floor(values.length * 0.25)].toFixed(4),
                        q50: sorted[Math.floor(values.length * 0.5)].toFixed(4),
                        q75: sorted[Math.floor(values.length * 0.75)].toFixed(4),
                        max: sorted[sorted.length - 1].toFixed(4),
                        skewness: this.calculateSkewness(values, mean, std).toFixed(4),
                        kurtosis: this.calculateKurtosis(values, mean, std).toFixed(4)
                    };
                }
            }
        });
        
        return { type: 'descriptive', data: stats };
    }

    generateCorrelationAnalysis(columns) {
        const numericColumns = columns.filter(col => this.isNumericColumn(col));
        const correlationMatrix = {};
        
        numericColumns.forEach(col1 => {
            correlationMatrix[col1] = {};
            numericColumns.forEach(col2 => {
                if (col1 === col2) {
                    correlationMatrix[col1][col2] = 1.0;
                } else {
                    correlationMatrix[col1][col2] = this.calculateCorrelation(col1, col2);
                }
            });
        });
        
        return { type: 'correlation', data: correlationMatrix };
    }

    generateOutlierAnalysis(columns) {
        const outliers = {};
        
        columns.forEach(col => {
            if (this.isNumericColumn(col)) {
                const values = this.data.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
                if (values.length > 0) {
                    const sorted = values.sort((a, b) => a - b);
                    const q1 = sorted[Math.floor(values.length * 0.25)];
                    const q3 = sorted[Math.floor(values.length * 0.75)];
                    const iqr = q3 - q1;
                    const lowerBound = q1 - 1.5 * iqr;
                    const upperBound = q3 + 1.5 * iqr;
                    
                    const outlierIndices = [];
                    this.data.forEach((row, index) => {
                        const value = parseFloat(row[col]);
                        if (!isNaN(value) && (value < lowerBound || value > upperBound)) {
                            outlierIndices.push(index);
                        }
                    });
                    
                    outliers[col] = {
                        totalValues: values.length,
                        outlierCount: outlierIndices.length,
                        outlierPercentage: ((outlierIndices.length / values.length) * 100).toFixed(2),
                        outlierIndices: outlierIndices,
                        bounds: { lower: lowerBound.toFixed(4), upper: upperBound.toFixed(4) }
                    };
                }
            }
        });
        
        return { type: 'outliers', data: outliers };
    }

    generateNormalityTests(columns) {
        const normalityResults = {};
        
        columns.forEach(col => {
            if (this.isNumericColumn(col)) {
                const values = this.data.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
                if (values.length > 0) {
                    // Simplified normality test (Shapiro-Wilk approximation)
                    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                    const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
                    const skewness = this.calculateSkewness(values, mean, std);
                    const kurtosis = this.calculateKurtosis(values, mean, std);
                    
                    // Simple normality assessment based on skewness and kurtosis
                    const isNormal = Math.abs(skewness) < 1 && Math.abs(kurtosis - 3) < 2;
                    
                    normalityResults[col] = {
                        sampleSize: values.length,
                        skewness: skewness.toFixed(4),
                        kurtosis: kurtosis.toFixed(4),
                        isNormal: isNormal,
                        interpretation: isNormal ? 'Approximately normal' : 'Not normal',
                        pValue: this.estimatePValue(skewness, kurtosis, values.length)
                    };
                }
            }
        });
        
        return { type: 'normality', data: normalityResults };
    }

    calculateCorrelation(col1, col2) {
        const values1 = this.data.map(row => parseFloat(row[col1])).filter(val => !isNaN(val));
        const values2 = this.data.map(row => parseFloat(row[col2])).filter(val => !isNaN(val));
        
        if (values1.length !== values2.length || values1.length === 0) return 0;
        
        const n = values1.length;
        const sum1 = values1.reduce((sum, val) => sum + val, 0);
        const sum2 = values2.reduce((sum, val) => sum + val, 0);
        const sum1Sq = values1.reduce((sum, val) => sum + val * val, 0);
        const sum2Sq = values2.reduce((sum, val) => sum + val * val, 0);
        const sum12 = values1.reduce((sum, val, i) => sum + val * values2[i], 0);
        
        const numerator = n * sum12 - sum1 * sum2;
        const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));
        
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

    estimatePValue(skewness, kurtosis, sampleSize) {
        // Simplified p-value estimation
        const skewnessScore = Math.abs(skewness);
        const kurtosisScore = Math.abs(kurtosis - 3);
        const combinedScore = (skewnessScore + kurtosisScore) / 2;
        
        if (combinedScore < 0.5) return 0.8;
        if (combinedScore < 1.0) return 0.6;
        if (combinedScore < 1.5) return 0.4;
        if (combinedScore < 2.0) return 0.2;
        return 0.1;
    }

    displayAnalysisResults(results, analysisType) {
        const resultsDiv = document.getElementById('analysisResults');
        if (!resultsDiv) return;

        let html = `<h3>${this.getAnalysisTitle(analysisType)}</h3>`;
        
        if (analysisType === 'descriptive') {
            html += this.renderDescriptiveStats(results.data);
        } else if (analysisType === 'correlation') {
            html += this.renderCorrelationMatrix(results.data);
        } else if (analysisType === 'outliers') {
            html += this.renderOutlierResults(results.data);
        } else if (analysisType === 'normality') {
            html += this.renderNormalityResults(results.data);
        }
        
        resultsDiv.innerHTML = html;
        this.showSection('analysisResults');
    }

    getAnalysisTitle(analysisType) {
        const titles = {
            'descriptive': 'Descriptive Statistics',
            'correlation': 'Correlation Analysis',
            'outliers': 'Outlier Detection',
            'normality': 'Normality Tests'
        };
        return titles[analysisType] || 'Analysis Results';
    }

    renderDescriptiveStats(stats) {
        let html = '<div class="stats-grid">';
        
        Object.keys(stats).forEach(column => {
            const stat = stats[column];
            html += `
                <div class="stat-card">
                    <h4>${column}</h4>
                    <div class="stat-values">
                        <div class="stat-row">
                            <span class="stat-label">Count:</span>
                            <span class="stat-value">${stat.count}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Mean:</span>
                            <span class="stat-value">${stat.mean}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Std Dev:</span>
                            <span class="stat-value">${stat.std}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Min:</span>
                            <span class="stat-value">${stat.min}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Q1 (25%):</span>
                            <span class="stat-value">${stat.q25}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Q2 (50%):</span>
                            <span class="stat-value">${stat.q50}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Q3 (75%):</span>
                            <span class="stat-value">${stat.q75}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Max:</span>
                            <span class="stat-value">${stat.max}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Skewness:</span>
                            <span class="stat-value">${stat.skewness}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Kurtosis:</span>
                            <span class="stat-value">${stat.kurtosis}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    renderCorrelationMatrix(correlationData) {
        const columns = Object.keys(correlationData);
        let html = '<div class="correlation-matrix">';
        
        // Header row
        html += '<div class="correlation-header">';
        html += '<div class="correlation-cell header"></div>';
        columns.forEach(col => {
            html += `<div class="correlation-cell header">${col}</div>`;
        });
        html += '</div>';
        
        // Data rows
        columns.forEach(col1 => {
            html += '<div class="correlation-row">';
            html += `<div class="correlation-cell header">${col1}</div>`;
            columns.forEach(col2 => {
                const value = correlationData[col1][col2];
                const intensity = Math.abs(value);
                const colorClass = this.getCorrelationColorClass(intensity);
                html += `<div class="correlation-cell ${colorClass}">${value.toFixed(3)}</div>`;
            });
            html += '</div>';
        });
        
        html += '</div>';
        return html;
    }

    renderOutlierResults(outlierData) {
        let html = '<div class="outlier-results">';
        
        Object.keys(outlierData).forEach(column => {
            const outlier = outlierData[column];
            html += `
                <div class="outlier-card">
                    <h4>${column}</h4>
                    <div class="outlier-stats">
                        <div class="outlier-stat">
                            <span class="stat-label">Total Values:</span>
                            <span class="stat-value">${outlier.totalValues}</span>
                        </div>
                        <div class="outlier-stat">
                            <span class="stat-label">Outliers:</span>
                            <span class="stat-value">${outlier.outlierCount} (${outlier.outlierPercentage}%)</span>
                        </div>
                        <div class="outlier-stat">
                            <span class="stat-label">Bounds:</span>
                            <span class="stat-value">[${outlier.bounds.lower}, ${outlier.bounds.upper}]</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    renderNormalityResults(normalityData) {
        let html = '<div class="normality-results">';
        
        Object.keys(normalityData).forEach(column => {
            const normality = normalityData[column];
            const statusClass = normality.isNormal ? 'normal' : 'not-normal';
            html += `
                <div class="normality-card ${statusClass}">
                    <h4>${column}</h4>
                    <div class="normality-stats">
                        <div class="normality-stat">
                            <span class="stat-label">Sample Size:</span>
                            <span class="stat-value">${normality.sampleSize}</span>
                        </div>
                        <div class="normality-stat">
                            <span class="stat-label">Skewness:</span>
                            <span class="stat-value">${normality.skewness}</span>
                        </div>
                        <div class="normality-stat">
                            <span class="stat-label">Kurtosis:</span>
                            <span class="stat-value">${normality.kurtosis}</span>
                        </div>
                        <div class="normality-stat">
                            <span class="stat-label">P-Value:</span>
                            <span class="stat-value">${normality.pValue}</span>
                        </div>
                        <div class="normality-stat">
                            <span class="stat-label">Status:</span>
                            <span class="stat-value ${statusClass}">${normality.interpretation}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    getCorrelationColorClass(intensity) {
        if (intensity >= 0.8) return 'strong-positive';
        if (intensity >= 0.6) return 'moderate-positive';
        if (intensity >= 0.4) return 'weak-positive';
        if (intensity >= 0.2) return 'very-weak';
        return 'no-correlation';
    }

    generateChart() {
        const chartType = document.getElementById('chartType').value;
        const columnSelect = document.getElementById('columnSelect');
        const yAxisSelect = document.getElementById('yAxisSelect');
        
        if (!columnSelect || !columnSelect.value) {
            this.showError('Please select columns for the chart.');
            return;
        }

        let xAxis, yAxis, columns;
        
        if (chartType === 'scatter') {
            if (!yAxisSelect || !yAxisSelect.value) {
                this.showError('Please select both X and Y axis columns for scatter plot.');
                return;
            }
            xAxis = columnSelect.value;
            yAxis = yAxisSelect.value;
            columns = [xAxis, yAxis];
        } else {
            if (columnSelect.multiple) {
                columns = Array.from(columnSelect.selectedOptions).map(option => option.value);
            } else {
                columns = [columnSelect.value];
            }
        }

        this.showLoading(true);
        
        setTimeout(() => {
            const chartData = this.generateMockChartData(chartType, columns, xAxis, yAxis);
            this.renderChart(chartData, this.getChartTitle(chartType, columns));
            this.showLoading(false);
            
            // Show add to report button
            const addToReportBtn = document.getElementById('addToReportBtn');
            if (addToReportBtn) {
                addToReportBtn.style.display = 'inline-block';
            }
        }, 1000);
    }

    generateMockChartData(chartType, columns, xAxis, yAxis) {
        if (chartType === 'scatter') {
            return {
                x: this.data.map(row => parseFloat(row[xAxis])).filter(val => !isNaN(val)),
                y: this.data.map(row => parseFloat(row[yAxis])).filter(val => !isNaN(val)),
                labels: this.data.map(row => row[xAxis] + ' vs ' + row[yAxis])
            };
        } else if (chartType === 'box') {
            const boxData = {};
            columns.forEach(col => {
                boxData[col] = this.data.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
            });
            return boxData;
        } else if (chartType === 'histogram') {
            return {
                values: this.data.map(row => parseFloat(row[columns[0]])).filter(val => !isNaN(val)),
                labels: columns[0]
            };
        } else if (chartType === 'bar') {
            const valueCounts = {};
            this.data.forEach(row => {
                const value = row[columns[0]];
                valueCounts[value] = (valueCounts[value] || 0) + 1;
            });
            return {
                categories: Object.keys(valueCounts),
                values: Object.values(valueCounts),
                labels: columns[0]
            };
        }
        
        return {};
    }

    getChartTitle(chartType, columns) {
        const titles = {
            'scatter': `${columns[0]} vs ${columns[1]}`,
            'box': `${columns.join(', ')} Distribution`,
            'histogram': `${columns[0]} Distribution`,
            'bar': `${columns[0]} Value Counts`
        };
        return titles[chartType] || 'Chart';
    }

    renderChart(chartData, title) {
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) {
            console.error('Chart container not found');
            return;
        }
        
        // Clear container and set proper dimensions
        chartContainer.innerHTML = '';
        chartContainer.style.cssText = `
            min-height: 600px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin: 20px 0;
        `;
        
        console.log('Rendering chart:', chartData, 'with title:', title);
        
        // Create chart visualization
        const chartDiv = document.createElement('div');
        chartDiv.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        `;
        
        // Chart title
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        titleElement.style.cssText = `
            margin-bottom: 20px;
            color: #1f2937;
            font-size: 1.5rem;
            font-weight: 600;
        `;
        chartDiv.appendChild(titleElement);
        
        // Chart visualization (simplified for demo)
        const chartVisual = document.createElement('div');
        chartVisual.style.cssText = `
            width: 80%;
            height: 400px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
            font-weight: 500;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        `;
        
        if (chartData.x && chartData.y) {
            // Scatter plot
            chartVisual.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">📊</div>
                    <div>Scatter Plot</div>
                    <div style="font-size: 0.9rem; margin-top: 10px; opacity: 0.9;">
                        ${chartData.x.length} data points
                    </div>
                </div>
            `;
        } else if (chartData.values) {
            // Histogram or Bar
            chartVisual.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">📈</div>
                    <div>${title.includes('Distribution') ? 'Histogram' : 'Bar Chart'}</div>
                    <div style="font-size: 0.9rem; margin-top: 10px; opacity: 0.9;">
                        ${chartData.values.length} data points
                    </div>
                </div>
            `;
        } else if (chartData.categories) {
            // Bar chart
            chartVisual.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">📊</div>
                    <div>Bar Chart</div>
                    <div style="font-size: 0.9rem; margin-top: 10px; opacity: 0.9;">
                        ${chartData.categories.length} categories
                    </div>
                </div>
            `;
        } else if (chartData[Object.keys(chartData)[0]]) {
            // Box plot
            chartVisual.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">📦</div>
                    <div>Box Plot</div>
                    <div style="font-size: 0.9rem; margin-top: 10px; opacity: 0.9;">
                        ${Object.keys(chartData).length} columns
                    </div>
                </div>
            `;
        }
        
        chartDiv.appendChild(chartVisual);
        chartContainer.appendChild(chartDiv);
        
        // Store chart data for report
        this.currentChart = { data: chartData, title: title, type: document.getElementById('chartType').value };
    }

    addChartToReport() {
        if (!this.currentChart) {
            this.showError('No chart generated. Please generate a chart first.');
            return;
        }

        this.report.charts.push({
            ...this.currentChart,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });

        this.showSuccess('Chart added to report successfully!');
        this.updateReportPreview();
    }

    addAnalysisToReport(results, analysisType) {
        if (analysisType === 'descriptive') {
            this.report.descriptiveStats = results;
        } else if (analysisType === 'correlation') {
            this.report.correlationAnalysis = results;
        } else if (analysisType === 'outliers') {
            this.report.outlierAnalysis = results;
        } else if (analysisType === 'normality') {
            this.report.normalityTests = results;
        }

        this.report.timestamp = new Date().toISOString();
        this.updateReportPreview();
    }

    updateReportPreview() {
        const reportPreview = document.getElementById('reportPreview');
        if (!reportPreview) return;

        let html = '<h3>Report Preview</h3>';
        
        if (this.report.descriptiveStats) {
            html += '<div class="report-section"><h4>Descriptive Statistics</h4><p>✓ Added</p></div>';
        }
        if (this.report.correlationAnalysis) {
            html += '<div class="report-section"><h4>Correlation Analysis</h4><p>✓ Added</p></div>';
        }
        if (this.report.outlierAnalysis) {
            html += '<div class="report-section"><h4>Outlier Detection</h4><p>✓ Added</p></div>';
        }
        if (this.report.normalityTests) {
            html += '<div class="report-section"><h4>Normality Tests</h4><p>✓ Added</p></div>';
        }
        
        html += `<div class="report-section"><h4>Charts</h4><p>${this.report.charts.length} chart(s) added</p></div>`;
        
        if (this.report.timestamp) {
            html += `<div class="report-section"><h4>Last Updated</h4><p>${new Date(this.report.timestamp).toLocaleString()}</p></div>`;
        }

        reportPreview.innerHTML = html;
    }

    previewReport() {
        if (!this.report.descriptiveStats && this.report.charts.length === 0) {
            this.showError('No content in report. Please add some analysis or charts first.');
            return;
        }

        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(this.generateReportHTML());
        reportWindow.document.close();
    }

    downloadReport() {
        if (!this.report.descriptiveStats && this.report.charts.length === 0) {
            this.showError('No content in report. Please add some analysis or charts first.');
            return;
        }

        const reportHTML = this.generateReportHTML();
        const blob = new Blob([reportHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eda-report.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateReportHTML() {
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>EDA Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .section { margin-bottom: 30px; }
                    .chart { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
                </style>
            </head>
            <body>
                <h1>Exploratory Data Analysis Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
        `;

        if (this.report.descriptiveStats) {
            html += '<div class="section"><h2>Descriptive Statistics</h2>';
            html += this.renderDescriptiveStats(this.report.descriptiveStats.data);
            html += '</div>';
        }

        if (this.report.correlationAnalysis) {
            html += '<div class="section"><h2>Correlation Analysis</h2>';
            html += this.renderCorrelationMatrix(this.report.correlationAnalysis.data);
            html += '</div>';
        }

        if (this.report.outlierAnalysis) {
            html += '<div class="section"><h2>Outlier Detection</h2>';
            html += this.renderOutlierResults(this.report.outlierAnalysis.data);
            html += '</div>';
        }

        if (this.report.normalityTests) {
            html += '<div class="section"><h2>Normality Tests</h2>';
            html += this.renderNormalityResults(this.report.normalityTests.data);
            html += '</div>';
        }

        if (this.report.charts.length > 0) {
            html += '<div class="section"><h2>Charts</h2>';
            this.report.charts.forEach(chart => {
                html += `<div class="chart"><h3>${chart.title}</h3><p>Type: ${chart.type}</p></div>`;
            });
            html += '</div>';
        }

        html += '</body></html>';
        return html;
    }

    clearSelections() {
        const columnSelect = document.getElementById('columnSelect');
        const yAxisSelect = document.getElementById('yAxisSelect');
        
        if (columnSelect) {
            columnSelect.value = '';
            columnSelect.multiple = false;
            columnSelect.size = 1;
        }
        
        if (yAxisSelect) {
            yAxisSelect.remove();
        }
        
        this.updateColumnSelectionUI();
        
        // Clear chart container
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = '';
        }
        
        // Hide add to report button
        const addToReportBtn = document.getElementById('addToReportBtn');
        if (addToReportBtn) {
            addToReportBtn.style.display = 'none';
        }
        
        this.showSuccess('Selections cleared successfully!');
    }

    showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideNotification(notification);
            });
        }
    }

    hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EDAExplorer();
});