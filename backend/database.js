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
    const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            email TEXT NOT NULL,
            Is2FAEnabled BOOLEAN NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS Appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            date DATE,
            from_date TEXT,
            to_date TEXT,
            time TEXT,
            date_option TEXT,
            todo_items TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES Users(id) ON DELETE CASCADE
        );
    `;
    db.exec(createTablesSQL, (err) => {
        if (err) {
            console.error("Fehler beim Erstellen der Tabellen:", err);
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

async function get2FAStatus(username) {
    const query = `SELECT Is2FAEnabled FROM Users WHERE username = ?`;
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

        return row.Is2FAEnabled; 
    } catch (err) {
        console.error('Fehler beim Abrufen des 2FA-Status:', err.message);
        throw err;
    }
}

async function getEmail(username) {
    const query = `SELECT email FROM Users WHERE username = ?`;
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

        return row.email; 
    } catch (err) {
        console.error('Fehler beim Abrufen der E-Mail:', err.message);
        throw err;
    }
}

async function getUserIdByUsername(username) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT id FROM Users WHERE username = ?`,
            [username],
            (err, row) => {
                if (err) {
                    reject(err); // Fehler weitergeben
                } else if (row) {
                    resolve(row.id); // ID des Benutzers zurückgeben
                } else {
                    resolve(null); // Benutzer nicht gefunden, gibt null zurück
                }
            }
        );
    });
}

async function addAppointment(username, title, description, date, fromDate, toDate, time, dateOption, todoItems)
 {
    const accountId = await getUserIdByUsername(username);
    if (!accountId) {
        throw new Error('User not found');
    }
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO Appointments (account_id, title, description, date, from_date, to_date, time, date_option, todo_items)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [accountId, title, description, date, fromDate, toDate, time, dateOption, JSON.stringify(todoItems)],
            function (err) { 
                if (err) {
                    console.error('Error adding appointment:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
}

async function getAppointmentsByAccountId(username) {
    const accountId = await getUserIdByUsername(username);

    if (!accountId) {
        throw new Error('User not found');
    }

    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM Appointments WHERE account_id = ? ORDER BY date`,
            [accountId],
            (err, rows) => {
                if (err) {
                    console.error("Fehler beim SELECT:", err);
                    return reject(err);
                }

                try {
                    const parsed = rows.map(row => ({
                        ...row,
                        todo_items: (() => {
                            try {
                                return row.todo_items ? JSON.parse(row.todo_items) : null;
                            } catch (e) {
                                console.warn("Ungültiges JSON in todo_items:", row.todo_items);
                                return null;
                            }
                        })()
                    }));

                    resolve(parsed);
                } catch (parseErr) {
                    console.error("Fehler beim Parsen der Termine:", parseErr);
                    reject(parseErr);
                }
            }
        );
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
    getPasswordHashFromDB,
    get2FAStatus,
    getEmail,
    addAppointment,
    getAppointmentsByAccountId,
};
