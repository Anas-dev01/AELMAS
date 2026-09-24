const mysql = require('mysql2');

// Connection to XAMPP MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // XAMPP default
    password: '',      // XAMPP default (usually empty)
    database: 'aelmas_db' 
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Successfully connected to XAMPP MySQL Database');
});

module.exports = db;