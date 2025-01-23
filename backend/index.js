const express = require("express");
const next = require("next");
const path = require("path");
const https = require("https");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const {
  createTable,
  hashPassword,
  doesUsernameExist,
  doesEmailExist,
  addUser,
  getPasswordHashFromDB,
} = require("./database.js");

const port = 5001;
const secretKey = "your-secret-key"; // Geheimer Schlüssel für JWT

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: path.join(__dirname, "../frontend") });
const handle = app.getRequestHandler();

// SSL-Optionen (stelle sicher, dass key.pem und cert.pem vorhanden sind)
const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

// Datenbank-Tabelle erstellen
createTable();

app.prepare().then(() => {
  const server = express();

  // Middleware hinzufügen
  server.use(express.json());
  server.use("/public", express.static(path.join(__dirname, "frontend/public")));

  // JWT-Authentifizierungs-Middleware
  function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1]; // Token aus dem Header
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      jwt.verify(token, secretKey); // Überprüfung des Tokens
      next(); // Wenn das Token gültig ist, fahre fort
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  // Registrierung (Token wird hier nicht benötigt)
  server.post("/api/register", async (req, res) => {
    createTable();

    const { email, password, username, is2FAEnabled } = req.body;

    if (!email || !password || !username || is2FAEnabled === undefined) {
      return res.status(400).json({ error: "Alle Felder müssen ausgefüllt werden." });
    }

    console.log("Neuer Benutzer registriert:", { email, username, is2FAEnabled, password });

    try {
      res.status(201).json({ message: "Benutzer erfolgreich registriert." });
    } catch (err) {
      console.error("Fehler bei der Registrierung:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Login und Token-Generierung
  server.post("/api/login", async (req, res) => {
    createTable();

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Benutzername und Passwort sind erforderlich." });
    }

    // Dummy-Logik für Benutzerüberprüfung (ersetze dies mit echter Datenbanklogik)
    if (username === "admin" && password === "password123") {
      const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" }); // Token generieren
      return res.status(200).json({ token });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  });

  // Geschützte Route (Token wird benötigt)
  server.get("/api/protected", authenticateToken, (req, res) => {
    res.status(200).json({ message: "This is a protected route. Access granted!" });
  });

  // Alle anderen Routen an Next.js übergeben
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  // HTTPS-Server starten
  https.createServer(options, server).listen(port, (err) => {
    if (err) throw err;
    console.log("> HTTPS Server running on https://localhost:" + port);
  });
});
