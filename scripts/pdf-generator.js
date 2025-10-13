// PDF Generation using jsPDF
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('download-btn');
    
    // Check if jsPDF is available
    function checkPDFLibrary() {
        if (typeof jspdf !== 'undefined' && jspdf.jsPDF) {
            console.log('✅ jsPDF loaded successfully');
            return true;
        }
        return false;
    }
    
    downloadBtn.addEventListener('click', function() {
        if (!checkPDFLibrary()) {
            alert('PDF library still loading... Please wait a moment and try again.');
            loadJSPDFLibrary();
            return;
        }
        
        generateCertificatePDF();
    });
    
    function generateCertificatePDF() {
        // Use the global jspdf object from CDN
        const { jsPDF } = window.jspdf;
        
        // Debug: Log all elements in the certificate area
        const certificateContainer = document.querySelector('.certificate, #certificate, .certificate-container');
        if (certificateContainer) {
            console.log('Certificate container found:', certificateContainer);
            console.log('Child elements:', certificateContainer.children);
        } else {
            console.warn('No certificate container found with common selectors.');
        }

        // Try multiple selectors for student name
        let studentNameElem = document.getElementById('certificate-name');
        if (!studentNameElem) {
            studentNameElem = document.querySelector('.certificate-name, #student-name, .student-name');
            if (studentNameElem) {
                console.log('Student name element found with alternative selector:', studentNameElem);
            }
        } else {
            console.log('Student name element found with id="certificate-name":', studentNameElem);
        }

        // If still not found, try searching by text content
        if (!studentNameElem) {
            const possibleNames = Array.from(document.querySelectorAll('span, div, h1, h2, h3')).filter(el =>
                el.textContent && el.textContent.toLowerCase().includes('student')
            );
            if (possibleNames.length > 0) {
                studentNameElem = possibleNames[0];
                console.log('Student name element found by text content:', studentNameElem);
            }
        }

        // If still not found, create the element
        if (!studentNameElem) {
            studentNameElem = document.createElement('span');
            studentNameElem.id = 'certificate-name';
            studentNameElem.textContent = 'Student Name';
            if (certificateContainer) {
                certificateContainer.appendChild(studentNameElem);
                console.log('Created new student name element and appended to certificate container:', studentNameElem);
            } else {
                document.body.appendChild(studentNameElem);
                console.log('Created new student name element and appended to body:', studentNameElem);
            }
        }

        const studentName = studentNameElem.textContent;
        const certificateDateElem = document.getElementById('certificate-date') ||
            document.querySelector('.certificate-date, #date, .date');
        const certificateDate = certificateDateElem ? certificateDateElem.textContent : 'Date Not Found';
        
        // Create new PDF document - Use PORTRAIT for better layout
        const doc = new jsPDF({
            orientation: 'portrait', // Changed to portrait
            unit: 'mm',
            format: 'a4'
        });
        
        // Set certificate dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        console.log('Page dimensions:', { pageWidth, pageHeight });
        
        // Add golden border
        doc.setDrawColor(212, 175, 55); // Gold color
        doc.setLineWidth(3);
        doc.rect(15, 15, pageWidth - 30, pageHeight - 30);
        
        // Add decorative corner elements
        addDecorativeElements(doc, pageWidth, pageHeight);
        
        // Add background watermark
        doc.setFontSize(60);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(240, 240, 240); // Very light gray
        doc.text('GRADE UP', pageWidth / 2, pageHeight / 2, { align: 'center' });
        
        // Reset text color for main content
        doc.setTextColor(0, 0, 0); // Black
        
        
        // Add title - CONGRATULATIONS
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(74, 107, 255); // Primary blue
        doc.text('CONGRATULATIONS', pageWidth / 2, 50, { align: 'center' });
        
        // Add subtitle
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('This certifies that', pageWidth / 2, 70, { align: 'center' });
        
        // Add student name - CENTER STAGE!
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 107, 74); // Secondary orange
        doc.text(studentName.toUpperCase(), pageWidth / 2, 100, { align: 'center' });
        
        // Add achievement text
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        
        const achievementText = [
            'has successfully completed the academic requirements',
            'and is hereby promoted to the next class.',
            'hardwork always pays Ace I respect your consistency',
            'We commend your hard work, dedication, and academic achievement.'
            
        ];
        
        achievementText.forEach((line, index) => {
            doc.text(line, pageWidth / 2, 130 + (index * 7), { align: 'center' });
        });
        
        // Add date
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(`Issued on: ${certificateDate}`, pageWidth / 2, 160, { align: 'center' });
        
        // Add school name (you can customize this)
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(74, 107, 255);
        doc.text('GradeUp', pageWidth / 2, 180, { align: 'center' });
        
        // Add signatures area - Moved higher to fit better
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Principal signature - LEFT
        doc.text('_________________________', pageWidth / 3, 200, { align: 'center' });
        doc.text('Principal', pageWidth / 3, 208, { align: 'center' });
        
        // Class teacher signature - RIGHT  
        doc.text('___________hey______________', (2 * pageWidth) / 3, 200, { align: 'center' });
        doc.text('Class Teacher', (2 * pageWidth) / 3, 208, { align: 'center' });
        
        // Add school seal/logo area - CENTER
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(1);
        doc.circle(pageWidth / 2, 190, 12);
        doc.setFontSize(6);
        doc.text('OFFICIAL SEAL', pageWidth / 2, 190, { align: 'center' });
        
        // Add decorative border at bottom
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(1);
        doc.line(30, pageHeight - 40, pageWidth - 30, pageHeight - 40);
        
        // Add website/contact at bottom
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('www.Claires Organisation Kenya.ac.ke • info@gradeup.co.ke • +254 714781259', pageWidth / 2, pageHeight - 30, { align: 'center' });
        
        // Save the PDF
        const fileName = `Promotion_Certificate_${studentName.replace(/\s+/g, '_')}.pdf`;
        doc.save(fileName);
        
        // Show success message
        showDownloadSuccess();
        
        console.log('✅ PDF generated successfully:', fileName);
    }
    
    function addDecorativeElements(doc, pageWidth, pageHeight) {
        // Add corner decorations
        const cornerSize = 15;
        const corners = [
            [20, 20], // top-left
            [pageWidth - 20, 20], // top-right
            [20, pageHeight - 20], // bottom-left
            [pageWidth - 20, pageHeight - 20] // bottom-right
        ];
        
        corners.forEach(([x, y]) => {
            doc.setDrawColor(212, 175, 55);
            doc.setLineWidth(1);
            // Draw cross pattern at corners
            doc.line(x - cornerSize, y, x + cornerSize, y);
            doc.line(x, y - cornerSize, x, y + cornerSize);
        });
        
        // Add side decorations
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.5);
        for (let i = 0; i < pageWidth; i += 10) {
            if (i % 20 === 0) {
                doc.line(i, 25, i + 5, 25);
                doc.line(i, pageHeight - 25, i + 5, pageHeight - 25);
            }
        }
    }
    
    function loadJSPDFLibrary() {
        if (typeof jspdf === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = function() {
                console.log('✅ jsPDF loaded successfully');
                alert('PDF library loaded! Click Download again.');
            };
            script.onerror = function() {
                alert('Failed to load PDF library. Please check your internet connection.');
            };
            document.head.appendChild(script);
        }
    }
    
    function showDownloadSuccess() {
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = '✓ Downloaded!';
        downloadBtn.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
            downloadBtn.textContent = originalText;
            downloadBtn.style.backgroundColor = '';
        }, 2000);
    }
    
    // Initialize - Check if library is loaded
    setTimeout(() => {
        if (checkPDFLibrary()) {
            console.log('✅ PDF system ready');
        } else {
            console.log('⚠️ PDF library not loaded yet');
        }
    }, 1000);
});