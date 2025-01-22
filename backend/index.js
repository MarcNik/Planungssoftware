const express = require('express');
const next = require('next');
const path = require('path');

const port = 5000;

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: path.join(__dirname, '../frontend') });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use('/public', express.static(path.join(__dirname, 'frontend/public')));

  server.post('/api/register', (req, res) => {
    const { email, password, username, is2FAEnable } = req.body;

    if (!email || !password || !username || is2FAEnable === undefined) {
      return res.status(400).json({ error: 'Alle Felder müssen ausgefüllt werden.' });
    }

    // Beispiel: Datenbankeintrag simulieren
    console.log('Neuer Benutzer registriert:', { email, username, is2FAEnable });

    // Antwort senden
    res.status(201).json({ message: 'Benutzer erfolgreich registriert.' });
  });

  server.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort sind erforderlich.' });
    }

    // Beispiel: Benutzerüberprüfung simulieren
    console.log('Benutzer eingeloggt:', { username });

    // Antwort senden
    res.status(200).json({ message: 'Login erfolgreich.' });
  });

  server.all('/', (req, res) => {
    return handle(req, res);
  });

  // Server starten
  server.listen(port, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:' + port);
  });
});
