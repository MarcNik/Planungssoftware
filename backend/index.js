const express = require('express');
const app = express();
const port = 5000;

// Middleware
app.use(express.json());

// Beispielroute
app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

// Server starten
app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});
