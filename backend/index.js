const express = require("express");
const next = require("next");
const path = require("path");
const https = require("https");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const {
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
} = require("./database.js");

const {
  create2FACode,
} = require("./2FA.js");

const { compare } = require("bcrypt");
const { get } = require("http");

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

let twoFACodes = {}; // Speichert temporäre 2FA-Codes

// Datenbank-Tabelle erstellen
createTable();

app.prepare().then(() => {
  const server = express();

  const transporter = nodemailer.createTransport({
    service: 'abc', // E-Mail-Provider
    auth: {
      user: 'abc', // E-Mail-Adresse
      pass: 'abc', // App-Passwort bei 2FA
    },
  });

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

  function send2FACode(email, code) {
    const mailOptions = {
        from: 'abc', // E-Mail-Adresse des Absenders
        to: email, // Empfänger
        subject: 'Dein 2FA-Code', // Betreff der E-Mail
        text: `Hallo,\n\nDein 2FA-Code lautet: ${code}\n\nDieser Code ist für deine Sicherheit, bitte teile ihn niemandem mit.` // Nachricht
    };

    // Versenden der E-Mail
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Fehler beim Senden der E-Mail:', error);
        } else {
            console.log('E-Mail gesendet:', info.response);
        }
    });
  }

  // Registrierung (Token wird hier nicht benötigt)
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

        const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" }); // Token generieren
        return res.status(200).json({ token });
    } catch (err) {
        console.error("Fehler bei der Registrierung:", err.message);
        return res.status(500).json({ error: "Interner Serverfehler." });
    }
  });

  // Login und Token-Generierung
  server.post("/api/login", async (req, res) => {
    createTable();

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Benutzername und Passwort sind erforderlich." });
    }

    try {
      // Prüft, ob der Benutzername schon vergeben ist
      const isUsernameTaken = await doesUsernameExist(username);
      if (!isUsernameTaken) {
          console.log("Benutzername existiert nicht");
          return res.status(400).json({ error: 'Username or Password is wrong' });
      } else {
          console.log("Nutzername gefunden");
      }

      // Ruft den gespeicherten Passwort-Hash des Benutzers aus der Datenbank ab
      const storedPasswordHash = await getPasswordHashFromDB(username); // Beispiel, anpassen je nach DB

      const hashedPassword = hashPassword(password);

      // Überprüft, ob das eingegebene Passwort mit dem gespeicherten Passwort-Hash übereinstimmt
      const isPasswordCorrect = storedPasswordHash === hashedPassword;

      if (!isPasswordCorrect) {
        console.log("Passwort ist nicht korrekt");
        return res.status(400).json({ error: 'Username or Password is wrong' });
      } else {
        console.log("Passwort ist korrekt");
      }

      const is2FAEnabled = await get2FAStatus(username);
      if (is2FAEnabled === 1) {
        const tempToken = jwt.sign({ username }, secretKey, { expiresIn: "5m" });
        twoFACodes[tempToken] = create2FACode(); // 2FA-Code generieren und temporär speichern

        console.log(twoFACodes[tempToken]); // 2FA-Code in der Konsole ausgeben (ENTFERNEN NACH DEM TESTEN)

        //send2FACode(getEmail(username), twoFACodes[tempToken]); // 2FA-Code per E-Mail senden

        return res.status(200).json({ is2FAEnabled: true, tempToken });
      }

      // Benutzer erfolgreich eingeloggt
      const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" }); // Token generieren
      return res.status(200).json({ token });
    } catch (err) {
        console.error('Fehler bei dem Login:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  });

  // 2FA-Verifizierung
  server.post("/api/verify-2fa", (req, res) => {
    const { tempToken, twoFACode } = req.body;
    if (twoFACode !== twoFACodes[tempToken]) {  // Platzhalter "123" für den echten 2FA-Code
        return res.status(400).json({ error: "Invalid 2FA Code" });
    }

    try {
        const decoded = jwt.verify(tempToken, secretKey);
        const token = jwt.sign({ username: decoded.username }, secretKey, { expiresIn: "1h" });
        return res.status(200).json({ token });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
  });

  // Termin hinzufügen (Token wird benötigt)
  server.post("/api/add-appointment", authenticateToken, async (req, res) => {
    const { title, date, token } = req.body;

    if (!title || !date || !token) {
      return res.status(400).json({ error: "Title, date, and account ID are required." });
    }

    const decoded = jwt.verify(token, secretKey);
    const username = decoded.username;

    try {
      await addAppointment(username, title, "Test", date);
      return res.status(201).json({ message: "Appointment added successfully." });
    } catch (err) {
      console.error("Error adding appointment:", err.message);
      return res.status(500).json({ error: "Internal Server Error." });
    }
  });

  server.post("/api/get-appointment", authenticateToken, async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Account ID is required." });
    }

    const decoded = jwt.verify(token, secretKey);
    const username = decoded.username;

    try {
      const appointments = await getAppointmentsByAccountId(username);
      return res.status(200).json({ appointments });
    } catch (err) {
      console.error("Error getting appointments:", err.message);
      return res.status(500).json({ error: "Internal Server Error." });
    }
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
