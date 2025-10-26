const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Function to initialize the database (create table if not exists)
async function initializeDatabase() {
    console.log("Initializing database...");
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS countries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            capital VARCHAR(255) NULL,
            region VARCHAR(255) NULL,
            population BIGINT NOT NULL,
            currency_code VARCHAR(10) NULL,
            exchange_rate DECIMAL(10, 4) NULL,
            estimated_gdp DECIMAL(20, 4) NULL,
            flag_url VARCHAR(512) NULL,
            last_refreshed_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_region (region),
            INDEX idx_currency (currency_code),
            INDEX idx_gdp (estimated_gdp)
        )
    `;
    try {
        await pool.query(createTableQuery);
        console.log("Database table 'countries' initialized successfully.");
    } catch (error) {
        console.error("Error initializing database:", error);
        throw error;
    }
}

// Function to store/update the global last refresh timestamp (in a separate table or similar)
async function updateGlobalStatus(timestamp) {
    const query = `
        INSERT INTO status (key_name, value)
        VALUES ('last_refreshed_at', ?)
        ON DUPLICATE KEY UPDATE value = VALUES(value)
    `;
    // Note: You would need a 'status' table: CREATE TABLE status (key_name VARCHAR(50) PRIMARY KEY, value VARCHAR(255));
    // For simplicity, we'll assume a global variable or status table is managed.
    // For this example, we'll use a simpler approach for status in the controller.
}


module.exports = {
    pool,
    initializeDatabase,
    // updateGlobalStatus // Keeping it commented out for simplicity, status will be calculated
};