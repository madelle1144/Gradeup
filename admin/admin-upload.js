document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const processBtn = document.getElementById('processBtn');
    const downloadTemplateBtn = document.getElementById('downloadTemplate');
    const previewArea = document.getElementById('previewArea');
    const tableBody = document.getElementById('tableBody');
    const saveDataBtn = document.getElementById('saveData');
    const uploadStats = document.getElementById('uploadStats');

    let currentFile = null;
    let studentData = [];

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Please upload a CSV file');
            return;
        }

        currentFile = file;
        fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        processBtn.disabled = false;
    }

    processBtn.addEventListener('click', function() {
        if (!currentFile) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const csvContent = e.target.result;
            parseCSVData(csvContent);
        };
        reader.readAsText(currentFile);
    });

    function parseCSVData(csvContent) {
        try {
            const lines = csvContent.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            
            // Validate headers
            const requiredHeaders = ['id', 'name', 'class', 'term1', 'term2', 'term3', 'promoted'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            
            if (missingHeaders.length > 0) {
                alert(`Missing required columns: ${missingHeaders.join(', ')}`);
                return;
            }

            studentData = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const student = {};
                
                headers.forEach((header, index) => {
                    student[header] = values[index] || '';
                });

                // Convert numeric fields
                student.term1 = parseInt(student.term1) || 0;
                student.term2 = parseInt(student.term2) || 0;
                student.term3 = parseInt(student.term3) || 0;
                student.promoted = student.promoted.toUpperCase() === 'YES';

                studentData.push(student);
            }

            displayPreview();
            updateStats();
            
        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Error parsing CSV file. Please check the format.');
        }
    }

    function displayPreview() {
        // Clear previous data
        tableBody.innerHTML = '';
        
        // Display first 10 rows for preview
        const previewData = studentData.slice(0, 10);
        
        previewData.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${student.term1}%</td>
                <td>${student.term2}%</td>
                <td>${student.term3}%</td>
                <td class="${student.promoted ? 'status-promoted' : 'status-not-promoted'}">
                    ${student.promoted ? 'YES' : 'NO'}
                </td>
            `;
            tableBody.appendChild(row);
        });

        previewArea.style.display = 'block';
    }

    function updateStats() {
        const totalStudents = studentData.length;
        const promotedCount = studentData.filter(s => s.promoted).length;
        const notPromotedCount = totalStudents - promotedCount;

        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('promotedCount').textContent = promotedCount;
        document.getElementById('notPromotedCount').textContent = notPromotedCount;

        uploadStats.style.display = 'block';
    }

    downloadTemplateBtn.addEventListener('click', function() {
        const template = `id,name,class,term1,term2,term3,promoted
001,John Doe,Form 1,75,82,90,YES
002,Jane Smith,Form 1,65,72,80,YES
003,Mike Johnson,Form 1,45,52,60,NO
004,Sarah Williams,Form 1,88,85,92,YES`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_data_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    });

    saveDataBtn.addEventListener('click', async function() {
        if (studentData.length === 0) return;

        try {
            const response = await fetch('/api/students/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    csvData: convertToCSV(studentData)
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(`Successfully uploaded ${result.count} students to the database!`);
                // Reset form
                resetUpload();
            } else {
                alert('Error saving data: ' + result.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error connecting to server. Please try again.');
        }
    });

    function convertToCSV(data) {
        const headers = ['id', 'name', 'class', 'term1', 'term2', 'term3', 'promoted'];
        const csvLines = [headers.join(',')];
        
        data.forEach(student => {
            const row = headers.map(header => {
                let value = student[header];
                if (header === 'promoted') {
                    value = value ? 'YES' : 'NO';
                }
                return value !== undefined ? value : '';
            });
            csvLines.push(row.join(','));
        });
        
        return csvLines.join('\n');
    }

    function resetUpload() {
        currentFile = null;
        studentData = [];
        fileInput.value = '';
        fileInfo.textContent = 'No file selected';
        processBtn.disabled = true;
        previewArea.style.display = 'none';
        uploadStats.style.display = 'none';
    }
});