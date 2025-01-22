const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Datenbank initialisieren
const db = new sqlite3.Database('./userDatabase.db', (err) => {
    if (err) {
        return console.error('Error opening database:', err.message);
    }
    console.log('Connected to the SQLite database.');
});

// Tabelle erstellen
const createTable = `
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    Is2FAEnabled BOOLEAN NOT NULL DEFAULT 0
);
`;

db.run(createTable, (err) => {
    if (err) {
        return console.error('Error creating table:', err.message);
    }
    console.log('Users table created successfully.');
});

// Funktion, um ein Passwort mit SHA-256 zu hashen
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Funktion, um einen neuen Benutzer hinzuzufügen
function addUser(username, password, email, is2FAEnabled) {
    const hashedPassword = hashPassword(password);
    const insertUser = `INSERT INTO Users (username, password, email, Is2FAEnabled) VALUES (?, ?, ?, ?)`;
    db.run(insertUser, [username, hashedPassword, email, is2FAEnabled], function(err) {
        if (err) {
            return console.error('Error inserting user:', err.message);
        }
        console.log(`User added with ID: ${this.lastID}`);
    });
}

// Beispiel, wie man einen Benutzer hinzufügt
addUser('JohnDoe', 'securepassword123', 'johndoe@example.com', true);

// Datenbank schließen, wenn die Anwendung beendet wird
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
    });
    process.exit(0);
});
