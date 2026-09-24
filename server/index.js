// 1. Load the tools we need
const express = require('express'); 
const mysql = require('mysql2');   
const cors = require('cors');       
const bcrypt = require('bcrypt'); 

const app = express(); 

// 2. Middleware
app.use(cors());          
app.use(express.json({ limit: '2mb' }));

// 3. Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '',      
    database: 'aelmas_db'
});

// 4. Connect to the Database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to AELMAS MySQL Database.');
    ensureApprovalLetterColumns();
});

// Adds the fields required for official letters without affecting existing data.
const ensureApprovalLetterColumns = () => {
    const migrations = [
        'ALTER TABLE users ADD COLUMN registrar_signature MEDIUMTEXT NULL',
        'ALTER TABLE leave_requests ADD COLUMN registrar_id INT NULL'
    ];
    migrations.forEach((sql) => {
        db.query(sql, (err) => {
            if (err && err.code !== 'ER_DUP_FIELDNAME') {
                console.error('Database migration warning:', err.message);
            }
        });
    });
};

// 5. Test Route
app.get('/', (req, res) => {
    res.send('AELMAS Backend is Running!');
});

// 6. REGISTRATION ROUTE
app.post('/api/register', async (req, res) => {
    const { staff_id, full_name, email, password, role, dept_id, signature_data } = req.body;
    const hasValidSignature = typeof signature_data === 'string' && /^data:image\/(png|jpeg);base64,/.test(signature_data);
    if (role === 'Registrar' && !hasValidSignature) {
        return res.status(400).json({ message: 'A PNG or JPEG Registrar signature is required.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (staff_id, full_name, email, password, role, dept_id, leave_balance, registrar_signature) VALUES (?, ?, ?, ?, ?, ?, 30, ?)";
        db.query(sql, [staff_id, full_name, email, hashedPassword, role, dept_id, hasValidSignature ? signature_data : null], (err, result) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });
            res.status(201).json({ message: "Staff Registered Successfully!" });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// 7. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, result) => {
        if (err) return res.status(500).json({ message: "Server error" });
        if (result.length > 0) {
            const user = result[0];
            const isMatch = await bcrypt.compare(password, user.password); 
            if (isMatch) {
                res.status(200).json({ 
                    message: "Login successful", 
                    user: { 
                        id: user.user_id, 
                        name: user.full_name, 
                        role: user.role,
                        leave_balance: user.leave_balance
                    } 
                });
            } else {
                res.status(401).json({ message: "Invalid email or password" });
            }
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    });
});

// 8. STAFF: SUBMIT LEAVE REQUEST
app.post('/api/leave-request', (req, res) => {
    const { user_id, leave_type, start_date, end_date, requested_days } = req.body;
    const query = `INSERT INTO leave_requests 
                   (user_id, leave_type, start_date, end_date, requested_days, status_stage) 
                   VALUES (?, ?, ?, ?, ?, 0)`;

    db.query(query, [user_id, leave_type, start_date, end_date, requested_days], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database Error" });
        }
        res.status(200).json({ message: "Application Submitted Successfully!" });
    });
});

// 9. STAFF: GET PERSONAL LEAVE HISTORY
app.get('/api/my-requests/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `SELECT lr.*, registrar.registrar_signature
                 FROM leave_requests lr
                 LEFT JOIN users registrar ON lr.registrar_id = registrar.user_id
                 WHERE lr.user_id = ? ORDER BY lr.created_at DESC`;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// 10. HOD: GET PENDING REQUESTS
app.get('/api/leave-requests/pending', (req, res) => {
    const sql = `
        SELECT lr.*, u.full_name 
        FROM leave_requests lr 
        JOIN users u ON lr.user_id = u.user_id 
        WHERE lr.status_stage = 0`; 
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// 11. HOD: RECOMMEND REQUEST
app.post('/api/leave-requests/approve-hod', (req, res) => {
    const { request_id, remarks } = req.body;
    const sql = "UPDATE leave_requests SET status_stage = 1, hod_remarks = ? WHERE request_id = ?";
    db.query(sql, [remarks, request_id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Request recommended to Registrar!" });
    });
});

// 11.5 HOD/REGISTRAR: REJECT REQUEST (Role-Specific Logic)
app.post('/api/leave-requests/reject', (req, res) => {
    const { request_id, remarks, role } = req.body; // 'role' identifies the sender [cite: 150]
    
    // Choose which column to update based on who is logged in [cite: 157, 160]
    let sql = "";
    if (role === 'Registrar') {
        // Registrar rejection updates registrar_remarks [cite: 130]
        sql = "UPDATE leave_requests SET status_stage = 3, registrar_remarks = ? WHERE request_id = ?";
    } else {
        // HOD rejection updates hod_remarks [cite: 40]
        sql = "UPDATE leave_requests SET status_stage = 3, hod_remarks = ? WHERE request_id = ?";
    }
    
    // status_stage 3 is the terminal "Rejected" state [cite: 23, 29]
    db.query(sql, [remarks, request_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error during rejection" });
        }
        res.json({ message: "Application Rejected Successfully." });
    });
});

// 12. REGISTRAR: GET RECOMMENDED REQUESTS
app.get('/api/leave-requests/recommended', (req, res) => {
    const sql = `
        SELECT lr.*, u.full_name, u.leave_balance 
        FROM leave_requests lr 
        JOIN users u ON lr.user_id = u.user_id 
        WHERE lr.status_stage = 1`; 
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// 12.5 MANAGEMENT: COMPLETE LEAVE REGISTER FOR DASHBOARD ANALYTICS AND REPORTS
app.get('/api/leave-requests/report', (req, res) => {
    const sql = `
        SELECT lr.*, u.full_name, u.staff_id
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.user_id
        ORDER BY lr.created_at DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// 13. REGISTRAR: FINAL APPROVAL & AUTO-DEDUCTION
app.post('/api/leave-requests/approve-final', (req, res) => {
    // We pull 'days_to_deduct' to match your RegistrarDashboard.jsx axios call
    const { request_id, user_id, registrar_id, days_to_deduct, remarks } = req.body;
    if (!registrar_id) return res.status(400).json({ message: 'Registrar identity is required.' });

    const updateRequestSql = "UPDATE leave_requests SET status_stage = 2, registrar_remarks = ?, registrar_id = ? WHERE request_id = ?";
    const updateBalanceSql = "UPDATE users SET leave_balance = leave_balance - ? WHERE user_id = ?";

    // Task 1: Update the request status
    db.query(updateRequestSql, [remarks, registrar_id, request_id], (err) => {
        if (err) return res.status(500).json({ error: err });

        // Task 2: Deduct from the user's statutory balance 
        db.query(updateBalanceSql, [days_to_deduct, user_id], (err) => {
            if (err) return res.status(500).json({ error: "Failed to deduct balance" });
            res.json({ message: "Leave Finally Approved and Days Deducted!" });
        });
    });
});

// 14. GET FRESH USER DATA (To sync balance after approval)
app.get('/api/user-data/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = "SELECT leave_balance FROM users WHERE user_id = ?";
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.length > 0) {
            res.json(result[0]); // Returns { leave_balance: 26 }
        } else {
            res.status(404).json({ message: "User not found" });
        }
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
