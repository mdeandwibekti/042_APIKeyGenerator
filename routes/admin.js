const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// DATABASE SEDERHANA (JSON FILE)
const dbPath = path.join(__dirname, "..", "database.json");

// Buat file database jika belum ada
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [], admins: [] }, null, 2));
}

function loadDB() {
    return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ===============================
// REGISTER ADMIN
// ===============================
router.post("/register-admin", (req, res) => {
    const { username, password } = req.body;

    const db = loadDB();

    // cek jika username sudah ada
    const existing = db.admins.find(a => a.username === username);
    if (existing) return res.json({ success: false, message: "Admin sudah ada!" });

    db.admins.push({ username, password });
    saveDB(db);

    res.json({ success: true, message: "Admin berhasil dibuat!" });
});

// ===============================
// LOGIN USER
// ===============================
router.post("/login-user", (req, res) => {
    const { username, password } = req.body;

    const db = loadDB();
    const user = db.users.find(u => u.username === username && u.password === password);

    if (!user) return res.status(401).json({ success: false, message: "Akun tidak ditemukan!" });

    res.json({
        success: true,
        message: "Login user berhasil!",
        redirect: "/dashboard-user"
    });
});

// ===============================
// LOGIN ADMIN
// ===============================
router.post("/login-admin", (req, res) => {
    const { username, password } = req.body;

    const db = loadDB();
    const admin = db.admins.find(a => a.username === username && a.password === password);

    if (!admin) return res.status(401).json({ success: false, message: "Admin tidak ditemukan!" });

    res.json({
        success: true,
        message: "Login admin berhasil!",
        redirect: "/dashboard-admin"
    });
});

app.get("/dashboard-admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard-admin.html"));
});

module.exports = router;
