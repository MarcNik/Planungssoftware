const express = require("express");
const next = require("next");
const path = require("path");
const https = require("https");
const fs = require("fs");
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

const port = 5001;

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: path.join(__dirname, "../frontend") });
const handle = app.getRequestHandler();

// SSL-Optionen (stelle sicher, dass key.pem und cert.pem vorhanden sind)
const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

let twoFACodes = {}; // Speichert 2FA-Codes mit Benutzernamen und Ablaufzeit

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

  function create2FACode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
      return res.status(200).json({ message: "User registered successfully" });
    } catch (err) {
      console.error("Fehler bei der Registrierung:", err.message);
      return res.status(500).json({ error: "Interner Serverfehler." });
    }
  });

  // Login
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
      const storedPasswordHash = await getPasswordHashFromDB(username);

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
        const code = create2FACode();
        twoFACodes[username] = {
            code: code,
            expires: Date.now() + 300000 // 5 Minuten Ablaufzeit
        };

        console.log(twoFACodes[username].code); // 2FA-Code in der Konsole ausgeben (ENTFERNEN NACH DEM TESTEN)

        send2FACode(getEmail(username), twoFACodes[username].code); // 2FA-Code per E-Mail senden

        return res.status(200).json({ is2FAEnabled: true, username });
      }
      return res.status(200).json({ message: "Login successful", username });
    } catch (err) {
      console.error('Fehler bei dem Login:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  });

  // 2FA-Verifizierung
  server.post("/api/verify-2fa", (req, res) => {
    const { username, twoFACode } = req.body;
    const storedCode = twoFACodes[username];

    if (!storedCode) {
        return res.status(400).json({ error: "2FA code not found." });
    }

    if (storedCode.expires < Date.now()) {
        delete twoFACodes[username];
        return res.status(400).json({ error: "2FA code expired." });
    }

    if (twoFACode !== storedCode.code) {
        return res.status(400).json({ error: "Invalid 2FA Code" });
    }

    delete twoFACodes[username]; // Code nach erfolgreicher Überprüfung löschen
    return res.status(200).json({ message: "2FA verification successful" });
  });

  // Termin hinzufügen
  server.post("/api/add-appointment", async (req, res) => {
    const { title, description, date, username } = req.body;

    if (!title || !description || !date || !username) {
      return res.status(400).json({ error: "Title, description, date, and username are required." });
    }

    try {
      await addAppointment(username, title, description, date);
      return res.status(201).json({ message: "Appointment added successfully." });
    } catch (err) {
      console.error("Error adding appointment:", err.message);
      return res.status(500).json({ error: "Internal Server Error." });
    }
  });


  // Benutzerdaten abrufen
  server.get("/api/user", async (req, res) => {
    const { username } = req.query;
    try {
      const email = await getEmail(username);
      res.status(200).json({ username, email });
    } catch (err) {
      console.error("Fehler beim Abrufen der Benutzerdaten:", err.message);
      res.status(500).json({ error: "Interner Serverfehler." });
    }
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
