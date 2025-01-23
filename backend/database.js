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
async function doesUsernameExist(username) {
    const query = `SELECT COUNT(*) AS count FROM Users WHERE username = ?`;

    try {
        const row = await new Promise((resolve, reject) => {
            db.get(query, [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        return row.count > 0;
    } catch (err) {
        return false;
    }
}

// Prüfen, ob eine E-Mail existiert
async function doesEmailExist(email) {
    const query = `SELECT COUNT(*) AS count FROM Users WHERE email = ?`;
    
    try {
        const row = await new Promise((resolve, reject) => {
            db.get(query, [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        return row.count > 0;
    } catch (err) {
        return false;
    }
}

// Benutzer hinzufügen
async function addUser(username, password, email, is2FAEnabled) {
    const insertSQL = `
        INSERT INTO Users (username, password, email, Is2FAEnabled)
        VALUES (?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        db.run(insertSQL, [username, password, email, is2FAEnabled], function (err) {
            if (err) {
                console.error("Fehler beim Hinzufügen des Benutzers:", err.message);
                return reject(err);
            }
            console.log("Benutzer hinzugefügt mit ID:", this.lastID);
            resolve(this.lastID);
        });
    });
}

// Passwort zurückgeben
async function getPasswordHashFromDB(username) {
    const query = `SELECT password FROM Users WHERE username = ?`;
    try {
        const row = await new Promise((resolve, reject) => {
            db.get(query, [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!row) {
            throw new Error('User not found');
        }

        return row.password; 
    } catch (err) {
        console.error('Fehler beim Abrufen des Passwort-Hashes:', err.message);
        throw err;
    }
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
    getPasswordHashFromDB,
};
