const express = require('express');
const path = require('path');
const cors = require('cors');

// Initialize express app
const app = express();

// CORS middleware
app.use(cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set static folder
app.use(express.static(path.join(__dirname, 'dist')));

// For any route, serve the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
    console.log(`Server URL: http://localhost:${PORT}`);
});

module.exports = app;