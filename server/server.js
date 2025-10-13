const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const MpesaIntegration = require('./mpesa-integration');
const mpesa = new MpesaIntegration();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Student data storage
const STUDENT_DATA_FILE = path.join(__dirname, 'student-data.json');

// Initialize student data file if it doesn't exist
if (!fs.existsSync(STUDENT_DATA_FILE)) {
    const defaultData = {
        students: [
            {
                id: "F1-001",
                name: "John Maina",
                class: "Form 1",
                term1: 65,
                term2: 72,
                term3: 78,
                promoted: true
            },
            {
                id: "F1-002",
                name: "Mary Wanjiku",
                class: "Form 1",
                term1: 82,
                term2: 85,
                term3: 89,
                promoted: true
            },
            {
                id: "F1-003",
                name: "James Otieno",
                class: "Form 1",
                term1: 45,
                term2: 52,
                term3: 58,
                promoted: false
            }
        ]
    };
    fs.writeFileSync(STUDENT_DATA_FILE, JSON.stringify(defaultData, null, 2));
}

// Helper functions
function readStudentData() {
    try {
        const data = fs.readFileSync(STUDENT_DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading student data:', error);
        return { students: [] };
    }
}

function writeStudentData(data) {
    try {
        fs.writeFileSync(STUDENT_DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing student data:', error);
        return false;
    }
}

// ========================================
// STUDENT ROUTES
// ========================================

// Student verification (before payment)
app.post('/api/students/verify', (req, res) => {
    const { name, studentId } = req.body;
    
    console.log('🔍 Verifying student:', { name, studentId });
    
    try {
        const data = readStudentData();
        
        // Find student by ID and name (case-insensitive)
        const student = data.students.find(s => 
            s.id.toLowerCase() === studentId.toLowerCase() && 
            s.name.toLowerCase().includes(name.toLowerCase())
        );
        
        if (student) {
            console.log('✅ Student verified:', student.name);
            res.json({
                success: true,
                student: {
                    id: student.id,
                    name: student.name,
                    class: student.class,
                    promoted: student.promoted,
                    performance: {
                        term1: student.term1,
                        term2: student.term2,
                        term3: student.term3
                    }
                }
            });
        } else {
            console.log('❌ Student not found');
            res.status(404).json({
                success: false,
                error: 'Student not found. Please check your name and student ID.'
            });
        }
    } catch (error) {
        console.error('❌ Verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during verification'
        });
    }
});

// Get student by ID (after payment)
app.get('/api/students/:id', (req, res) => {
    const studentId = req.params.id;
    const data = readStudentData();
    const student = data.students.find(s => s.id === studentId);
    
    if (student) {
        res.json({ success: true, student });
    } else {
        res.status(404).json({ success: false, error: 'Student not found' });
    }
});

// Get all students
app.get('/api/students', (req, res) => {
    const data = readStudentData();
    res.json({ success: true, students: data.students });
});

// Upload CSV data
app.post('/api/students/upload', (req, res) => {
    const { csvData } = req.body;
    
    try {
        // Parse CSV data
        const lines = csvData.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
        
        const headers = lines[0].split(',').map(h => h.trim());
        const students = [];
        
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
            
            students.push(student);
        }
        
        // Save to database
        const data = { students: students };
        
        if (writeStudentData(data)) {
            console.log(`✅ Uploaded ${students.length} students`);
            res.json({ 
                success: true, 
                message: `Successfully uploaded ${students.length} students`,
                count: students.length
            });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save data' });
        }
        
    } catch (error) {
        console.error('CSV upload error:', error);
        res.status(400).json({ success: false, error: 'Invalid CSV format' });
    }
});

// ========================================
// M-PESA ROUTES
// ========================================

// Initiate M-Pesa payment
app.post('/api/mpesa/payment', async (req, res) => {
    console.log('💰 M-Pesa Payment Request:', req.body);
    
    try {
        const { phone, amount, name, studentId, accountReference } = req.body;
        
        const formattedPhone = mpesa.formatPhoneNumber(phone);
        const transactionDesc = `GradeUp: ${name}`;

        console.log('🔄 Initiating M-Pesa STK Push:', {
            phone: formattedPhone,
            amount,
            studentId
        });

        const result = await mpesa.initiateSTKPush(
            formattedPhone, 
            amount, 
            accountReference, 
            transactionDesc
        );

        console.log('📊 M-Pesa Response:', result);

        if (result.success) {
            res.json({
                success: true,
                checkoutRequestID: result.checkoutRequestID,
                responseDescription: result.responseDescription,
                customerMessage: result.customerMessage
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('❌ M-Pesa payment error:', error);
        res.status(500).json({
            success: false,
            error: 'Payment processing failed'
        });
    }
});

// Check M-Pesa payment status
app.get('/api/mpesa/confirm/:checkoutRequestID', async (req, res) => {
    const { checkoutRequestID } = req.params;
    
    console.log('🔄 Checking M-Pesa status:', checkoutRequestID);
    
    try {
        const result = await mpesa.checkPaymentStatus(checkoutRequestID);
        
        console.log('📊 Status Result:', result);
        
        if (result.success && result.confirmed) {
            res.json({
                confirmed: true,
                transaction: {
                    id: result.transactionID,
                    amount: result.amount,
                    phone: result.phone
                }
            });
        } else if (result.success && !result.confirmed) {
            res.json({
                confirmed: false,
                failed: true,
                error: result.error
            });
        } else {
            res.json({
                confirmed: false
            });
        }
        
    } catch (error) {
        console.error('❌ Status check error:', error);
        res.json({
            confirmed: false,
            error: 'Status check failed'
        });
    }
});

// M-Pesa callback endpoint
app.post('/api/mpesa/callback', (req, res) => {
    console.log('📞 M-Pesa Callback:', JSON.stringify(req.body, null, 2));
    
    const result = mpesa.handleCallback(req.body);
    
    if (result.success) {
        res.json({ ResultCode: 0, ResultDesc: "Success" });
    } else {
        res.json({ ResultCode: 1, ResultDesc: "Failed" });
    }
});

// ========================================
// PAGE ROUTES
// ========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, '../results.html'));
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
    console.log(`🚀 GradeUp Portal Server running on port ${PORT}`);
    console.log(`📱 Main site: http://localhost:${PORT}`);
    console.log(`🎓 Results: http://localhost:${PORT}/results`);
    console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin/data-upload.html`);
    console.log(`💾 Student database: ${STUDENT_DATA_FILE}`);
});

module.exports = app;