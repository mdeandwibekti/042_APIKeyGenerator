const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2');
const cors = require("cors");
const adminRoutes = require('./routes/admin'); // Pastikan file ini ada

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin-api', adminRoutes);

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: 3308, // Sesuaikan dengan port MySQL Anda
    password: 'Deandwib12345*',
    database: 'apikeyyy'
});

db.connect(err => {
    if (err) console.error('Database Error:', err);
    else console.log('Connected to MySQL.');
});

// ===========================
// 1. API KEY MANAGER
// ===========================
app.post('/create', (req, res) => {
    const token = crypto.randomBytes(32).toString("base64url");
    const apiKey = `sk-co-vi-${token}_${Date.now()}`;
    const date = new Date();
    date.setDate(date.getDate() + 30);
    const outOfDate = date.toISOString().slice(0, 19).replace("T", " ");

    db.query("INSERT INTO api_key (KeyValue, out_of_date) VALUES (?, ?)", [apiKey, outOfDate], err => {
        if (err) return res.status(500).json({ error: "Gagal simpan API Key" });
        res.json({ apiKey });
    });
});

app.post('/check', (req, res) => {
    const { apiKey } = req.body;
    db.query("SELECT * FROM api_key WHERE KeyValue = ?", [apiKey], (err, results) => {
        if (results.length === 0) return res.json({ message: "API key tidak ditemukan" });
        const now = new Date();
        if (now > new Date(results[0].out_of_date)) return res.json({ message: "API key expired" });
        res.json({ message: "API key valid" });
    });
});

// ===========================
// 2. USER AUTH & REGISTRATION
// ===========================
//
//
// Route untuk Register User
app.post('/register/user', (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    const sql = "INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [first_name, last_name, email, password], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Gagal daftar user");
        }
        // Redirect ke halaman login yang baru saja di-rename
        res.redirect('/login-user.html?reg=success'); 
    });
});

app.post('/login/user', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM user WHERE email = ? AND password = ?";
    
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length > 0) {
            // Arahkan ke file fisik .html di folder public
            res.json({ success: true, redirect: "/dashboard-user.html" });
        } else {
            res.json({ success: false, message: "Email atau Password salah!" });
        }
    });
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});