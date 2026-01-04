const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2');
const cors = require("cors");
const adminRoutes = require('./routes/admin');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin-api', adminRoutes);

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: 3308, 
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
// 2. USER AUTH & REGISTRATION (UPDATED)
// ===========================

// Route untuk Register User (index.js)
app.post('/register/user', (req, res) => {
    const { first_name, last_name, email, password, role } = req.body; // Ambil role dari body
    
    // Query harus menyertakan kolom role
    const sql = "INSERT INTO user (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [first_name, last_name, email, password, role || 'user'], (err) => {
        if (err) {
            console.error("Database Error:", err); // Lihat detail error di terminal
            return res.status(500).send("Gagal daftar user"); // Ini pesan yang muncul di gambar Anda
        }
        res.redirect('/login-user.html?reg=success');
    });
});

app.post('/login/user', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM user WHERE email = ? AND password = ?";
    
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        
        if (results.length > 0) {
            const user = results[0];
            // Logika pengalihan berdasarkan role di database
            let redirectPath = "/dashboard-user.html";
            if (user.role === 'admin') {
                redirectPath = "/dashboard-admin.html";
            }
            
            res.json({ success: true, redirect: redirectPath });
        } else {
            res.json({ success: false, message: "Email atau Password salah!" });
        }
    });
});

// ===========================
// ENDPOINT UNTUK DASHBOARD ADMIN
// ===========================

// 1. Ambil List User dari Database
app.get('/get/users', (req, res) => {
    const sql = "SELECT id, first_name, last_name, email, created_at FROM user";
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal mengambil data user" });
        }
        res.json(results);
    });
});

// 2. Ambil List API Keys dari Database
app.get('/get/apikeys', (req, res) => {
    // Sesuaikan KeyValue dan out_of_date dengan nama kolom di MySQL Anda
    const sql = "SELECT id, KeyValue, out_of_date FROM api_key";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching API keys:", err);
            return res.status(500).json({ error: "Gagal mengambil data" });
        }
        res.json(results);
    });
});
// 3. Endpoint Hapus User (Tambahan agar tombol hapus berfungsi)
app.delete('/user/delete/:id', (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM user WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Gagal menghapus user" });
        res.json({ message: "User berhasil dihapus" });
    });
});

// 4. Endpoint Update User (Tambahan agar tombol edit berfungsi)
app.put('/user/update/:id', (req, res) => {
    const id = req.params.id;
    const { first_name, last_name, email } = req.body;
    db.query(
        "UPDATE user SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
        [first_name, last_name, email, id],
        (err) => {
            if (err) return res.status(500).json({ message: "Gagal update user" });
            res.json({ message: "Data user berhasil diperbarui" });
        }
    );
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});