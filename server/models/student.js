const fs = require('fs');
const path = require('path');

const STUDENT_DATA_FILE = path.join(__dirname, '../student-data.json');

class Student {
    static getAll() {
        try {
            if (fs.existsSync(STUDENT_DATA_FILE)) {
                const data = fs.readFileSync(STUDENT_DATA_FILE, 'utf8');
                try {
                    const parsed = JSON.parse(data);
                    return Array.isArray(parsed.students) ? parsed.students : [];
                } catch (err) {
                    console.error('Invalid JSON in student data file:', err);
                    return [];
                }
            }
            return [];
        } catch (error) {
            console.error('Error reading student data:', error);
            return [];
        }
    }

    static saveAll(students) {
        try {
            const data = { students };
            fs.writeFileSync(STUDENT_DATA_FILE, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving student data:', error);
            return false;
        }
    }

    static findById(studentId) {
        const students = this.getAll();
        console.log('Finding student by ID:', studentId);
        const foundStudent = students.find(student => student.id === studentId);
        if (!foundStudent) {
            console.warn(`Student with ID ${studentId} not found.`);
        } else {
            console.log('Found student:', foundStudent);
            if (!foundStudent.name) {
                console.warn('Student name property is missing or empty:', foundStudent);
            } else {
                console.log('Student name found:', foundStudent.name);
            }
        }
        return foundStudent;
    }

    static findByDetails(name, studentId) {
        const students = this.getAll();
        console.log('Finding student by details:', { name, studentId });
        const foundStudent = students.find(student => 
            student.id === studentId && 
            student.name && student.name.toLowerCase().includes(name.toLowerCase())
        );
        if (!foundStudent) {
            console.warn(`Student with ID ${studentId} and name including "${name}" not found.`);
        } else {
            console.log('Found student:', foundStudent);
            if (!foundStudent.name) {
                console.warn('Student name property is missing or empty:', foundStudent);
            }
        }
        return foundStudent;
    }

    static importFromCSV(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            console.error('CSV data does not contain enough lines.');
            return [];
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Required columns
        const requiredHeaders = ['id', 'name', 'term1', 'term2', 'term3', 'promoted'];
        requiredHeaders.forEach(header => {
            if (!headers.includes(header)) {
                console.warn(`Missing required column "${header}" in CSV headers.`);
            }
        });

        const students = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length < headers.length) {
                console.warn(`Line ${i + 1} has fewer columns than headers. Filling missing values with empty string.`);
                while (values.length < headers.length) {
                    values.push('');
                }
            }
            const student = {};

            headers.forEach((header, index) => {
                student[header] = values[index] || '';
            });

            // Log the student name for debugging
            if (!student.name || student.name.trim() === '') {
                console.warn(`Student at line ${i + 1} has missing or empty name:`, student);
            } else {
                console.log(`Student at line ${i + 1} name:`, student.name);
            }

            // Convert data types
            student.term1 = Number.isFinite(parseInt(student.term1)) ? parseInt(student.term1) : 0;
            student.term2 = Number.isFinite(parseInt(student.term2)) ? parseInt(student.term2) : 0;
            student.term3 = Number.isFinite(parseInt(student.term3)) ? parseInt(student.term3) : 0;
            student.promoted = (student.promoted && typeof student.promoted === 'string') ? student.promoted.toUpperCase() === 'YES' : false;

            students.push(student);
        }

        // Merge with existing students (update if exists, add if new)
        const existingStudents = this.getAll();
        const updatedStudents = [...existingStudents];

        students.forEach(newStudent => {
            const existingIndex = updatedStudents.findIndex(s => s.id === newStudent.id);
            if (existingIndex >= 0) {
                updatedStudents[existingIndex] = newStudent; // Update existing
            } else {
                updatedStudents.push(newStudent); // Add new
            }
        });

        this.saveAll(updatedStudents);
        return updatedStudents;
    }
}

module.exports = Student;