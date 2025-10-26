const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { initializeDatabase } = require('./utils/db');
const countryRoutes = require('./routes/countryRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.json());

// Routes
app.use('/countries', countryRoutes);

// Basic Home Route
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to the Country Currency & Exchange API",
        endpoints: {
            refresh: 'POST /countries/refresh',
            list: 'GET /countries?region=Africa&sort=gdp_desc',
            status: 'GET /countries/status',
            image: 'GET /countries/image'
        }
    });
});

// Start Server and Initialize DB
async function startServer() {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();