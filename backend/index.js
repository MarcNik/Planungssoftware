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

const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

let twoFACodes = {};

createTable();

app.prepare().then(() => {
  const server = express();

  const transporter = nodemailer.createTransport({
    service: 'abc',
    auth: {
      user: 'abc',
      pass: 'abc',
    },
  });

  server.use(express.json());
  server.use("/public", express.static(path.join(__dirname, "frontend/public")));

  function create2FACode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function send2FACode(email, code) {
    const mailOptions = {
      from: 'abc',
      to: email,
      subject: 'Dein 2FA-Code',
      text: `Hallo,\n\nDein 2FA-Code lautet: ${code}\n\nDieser Code ist für deine Sicherheit, bitte teile ihn niemandem mit.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log('Fehler beim Senden der E-Mail:', error);
      else console.log('E-Mail gesendet:', info.response);
    });
  }

  server.post("/api/register", async (req, res) => {
    const { email, password, username, is2FAEnabled } = req.body;
    if (!email || !password || !username || is2FAEnabled === undefined) {
      return res.status(400).json({ error: "Alle Felder müssen ausgefüllt werden." });
    }

    try {
      const usernameExists = await doesUsernameExist(username);
      const emailExists = await doesEmailExist(email);
      if (usernameExists) return res.status(400).json({ error: "Benutzername existiert bereits." });
      if (emailExists) return res.status(400).json({ error: "E-Mail existiert bereits." });

      const hashedPassword = hashPassword(password);
      await addUser(username, hashedPassword, email, is2FAEnabled);
      return res.status(200).json({ message: "User registered successfully" });
    } catch (err) {
      console.error("Fehler bei der Registrierung:", err.message);
      return res.status(500).json({ error: "Interner Serverfehler." });
    }
  });

  server.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Benutzername und Passwort sind erforderlich." });

    try {
      const isUsernameTaken = await doesUsernameExist(username);
      if (!isUsernameTaken) return res.status(400).json({ error: 'Username or Password is wrong' });

      const storedPasswordHash = await getPasswordHashFromDB(username);
      const hashedPassword = hashPassword(password);
      if (storedPasswordHash !== hashedPassword) return res.status(400).json({ error: 'Username or Password is wrong' });

      const is2FAEnabled = await get2FAStatus(username);
      if (is2FAEnabled === 1) {
        const code = create2FACode();
        twoFACodes[username] = { code, expires: Date.now() + 300000 };
        send2FACode(await getEmail(username), code);
        return res.status(200).json({ is2FAEnabled: true, username });
      }

      return res.status(200).json({ message: "Login successful", username });
    } catch (err) {
      console.error('Fehler bei dem Login:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  server.post("/api/verify-2fa", (req, res) => {
    const { username, twoFACode } = req.body;
    const storedCode = twoFACodes[username];
    if (!storedCode) return res.status(400).json({ error: "2FA code not found." });
    if (storedCode.expires < Date.now()) {
      delete twoFACodes[username];
      return res.status(400).json({ error: "2FA code expired." });
    }
    if (twoFACode !== storedCode.code) return res.status(400).json({ error: "Invalid 2FA Code" });

    delete twoFACodes[username];
    return res.status(200).json({ message: "2FA verification successful" });
  });

  server.post("/api/add-appointment", async (req, res) => {
    const { title, description, date, fromDate, toDate, time, dateOption, todoItems, username } = req.body;
    if (!username || !title || (!date && (!fromDate || !toDate))) {
      return res.status(400).json({ error: "Required fields missing: username, title, date or fromDate" });
    }


    try {
      await addAppointment(username, title, description, date, fromDate, toDate, time, dateOption, todoItems);
      return res.status(201).json({ message: "Appointment added successfully." });
    } catch (err) {
      console.error("Fehler beim Hinzufügen des Termins:", err.message);
      return res.status(500).json({ error: "Internal Server Error." });
    }
  });

  server.post("/api/get-appointment", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required." });

    try {
      const appointments = await getAppointmentsByAccountId(username);
      return res.status(200).json({ appointments });
    } catch (err) {
      console.error("Fehler beim Abrufen der Termine:", err.message);
      return res.status(500).json({ error: "Internal Server Error." });
    }
  });

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

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  https.createServer(options, server).listen(port, (err) => {
    if (err) throw err;
    console.log("> HTTPS Server running on https://localhost:" + port);
  });
});