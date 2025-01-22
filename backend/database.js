const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Datenbank initialisieren
const db = new sqlite3.Database('./userDatabase.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

// Tabelle erstellen
function createTable() {
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        Is2FAEnabled BOOLEAN NOT NULL DEFAULT 0
    );`;
    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        }
    });
}

// Passwort hashen
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Prüfen, ob ein Username existiert
function doesUsernameExist(username, callback) {
    const query = `SELECT COUNT(*) AS count FROM Users WHERE username = ?`;
    db.get(query, [username], (err, row) => {
        if (err) {
            console.error('Error checking username:', err.message);
            return callback(false, err);
        }
        callback(row.count > 0);
    });
}

// Prüfen, ob eine E-Mail existiert
function doesEmailExist(email, callback) {
    const query = `SELECT COUNT(*) AS count FROM Users WHERE email = ?`;
    db.get(query, [email], (err, row) => {
        if (err) {
            console.error('Error checking email:', err.message);
            return callback(false, err);
        }
        callback(row.count > 0);
    });
}

// Benutzer hinzufügen
function addUser(username, password, email, is2FAEnabled, callback) {
    const insertSQL = `
        INSERT INTO Users (username, password, email, Is2FAEnabled)
        VALUES (?, ?, ?, ?)
    `;
    db.run(insertSQL, [username, password, email, is2FAEnabled], function(err) {
        if (err) {
            console.error('Error adding user:', err.message);
            return callback(err.message);
        }
        callback(null, `User added with ID: ${this.lastID}`);
    });
}

// Prüfen, ob ein Username ein bestimmtes Passwort hat
function doesPasswordMatch(username, password, callback) {
    const query = `SELECT COUNT(*) AS count FROM Users WHERE username = ? AND password = ?`;
    db.get(query, [username, password], (err, row) => {
        if (err) {
            console.error('Error checking password:', err.message);
            return callback(false, err);
        }
        callback(row.count > 0);
    });
}

// Datenbankverbindung schließen
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

module.exports = {
    createTable,
    hashPassword,
    doesUsernameExist,
    doesEmailExist,
    addUser,
    doesPasswordMatch,
}