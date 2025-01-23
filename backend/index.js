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
} = require("./database.js");

const port = 5001;
const secretKey = "your-secret-key"; // Geheimer Schlüssel für JWT

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: path.join(__dirname, "../frontend") });
const handle = app.getRequestHandler();

// SSL-Optionen
const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

// Datenbank-Tabelle erstellen
createTable();

app.prepare().then(() => {
  const server = express();

  server.use(express.json());
  server.use("/public", express.static(path.join(__dirname, "frontend/public")));

  // JWT-Authentifizierungs-Middleware
  function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      jwt.verify(token, secretKey);
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  // Registrierung
  server.post("/api/register", async (req, res) => {
    const { email, password, username, is2FAEnabled } = req.body;

    if (!email || !password || !username || is2FAEnabled === undefined) {
        return res.status(400).json({ error: "Alle Felder müssen ausgefüllt werden." });
    }

    try {
        // Überprüfen, ob der Benutzername oder die E-Mail bereits existiert
        const usernameExists = await doesUsernameExist(username);
        const emailExists = await doesEmailExist(email);

        if (usernameExists) {
            return res.status(400).json({ error: "Benutzername existiert bereits." });
        }

        if (emailExists) {
            return res.status(400).json({ error: "E-Mail existiert bereits." });
        }

        // Passwort hashen
        const hashedPassword = hashPassword(password);

        // Benutzer zur Datenbank hinzufügen
        await addUser(username, hashedPassword, email, is2FAEnabled);

        return res.status(201).json({ message: "Benutzer erfolgreich registriert." });
    } catch (err) {
        console.error("Fehler bei der Registrierung:", err.message);
        return res.status(500).json({ error: "Interner Serverfehler." });
    }
});


  // Login
  server.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Benutzername und Passwort sind erforderlich." });
    }

    try {
      const hashedPassword = hashPassword(password);
      const storedPassword = await getPasswordHashFromDB(username);

      if (hashedPassword !== storedPassword) {
        return res.status(401).json({ error: "Ungültige Anmeldedaten." });
      }

      const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
      res.status(200).json({ token });
    } catch (err) {
      res.status(401).json({ error: "Ungültige Anmeldedaten." });
    }
  });

  server.get("/api/protected", authenticateToken, (req, res) => {
    res.status(200).json({ message: "This is a protected route. Access granted!" });
  });

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  https.createServer(options, server).listen(port, (err) => {
    if (err) throw err;
    console.log("> HTTPS Server running on https://localhost:" + port);
  });
});
