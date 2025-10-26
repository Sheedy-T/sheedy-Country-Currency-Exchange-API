const { pool } = require('../utils/db');

// Helper to sanitize data for insertion/update
const sanitizeData = (data) => {
    return {
        name: data.name || null,
        capital: data.capital || null,
        region: data.region || null,
        population: data.population || 0,
        currency_code: data.currency_code || null,
        exchange_rate: data.exchange_rate || null,
        estimated_gdp: data.estimated_gdp || 0,
        flag_url: data.flag_url || null,
    };
};

/**
 * Inserts or Updates a country record based on name.
 * @param {object} countryData
 */
async function upsertCountry(countryData) {
    const data = sanitizeData(countryData);
    const query = `
        INSERT INTO countries (
            name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            capital = VALUES(capital),
            region = VALUES(region),
            population = VALUES(population),
            currency_code = VALUES(currency_code),
            exchange_rate = VALUES(exchange_rate),
            estimated_gdp = VALUES(estimated_gdp),
            flag_url = VALUES(flag_url);
    `;
    const values = [
        data.name, data.capital, data.region, data.population, data.currency_code,
        data.exchange_rate, data.estimated_gdp, data.flag_url
    ];
    await pool.query(query, values);
}

/**
 * Retrieves countries with optional filtering and sorting.
 * @param {object} filters { region, currency }
 * @param {string} sort 'gdp_desc', 'name_asc', etc.
 */
async function getCountries({ region, currency }, sort) {
    let query = 'SELECT * FROM countries WHERE 1=1';
    const params = [];

    // Filters
    if (region) {
        query += ' AND region = ?';
        params.push(region);
    }
    if (currency) {
        query += ' AND currency_code = ?';
        params.push(currency.toUpperCase());
    }

    // Sorting
    let orderBy = '';
    switch (sort) {
        case 'gdp_desc':
            orderBy = 'estimated_gdp DESC';
            break;
        case 'gdp_asc':
            orderBy = 'estimated_gdp ASC';
            break;
        case 'population_desc':
            orderBy = 'population DESC';
            break;
        case 'name_asc':
        default: // Default sort or for name_asc
            orderBy = 'name ASC';
            break;
    }
    query += ` ORDER BY ${orderBy}`;

    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Retrieves a single country by name.
 * @param {string} name
 */
async function getCountryByName(name) {
    const [rows] = await pool.query('SELECT * FROM countries WHERE name = ?', [name]);
    return rows[0];
}

/**
 * Deletes a country by name.
 * @param {string} name
 */
async function deleteCountryByName(name) {
    const [result] = await pool.query('DELETE FROM countries WHERE name = ?', [name]);
    return result.affectedRows;
}

/**
 * Gets the total count and the timestamp of the latest refreshed country.
 */
async function getStatus() {
    const [countRows] = await pool.query('SELECT COUNT(*) AS total_countries FROM countries');
    // Get the latest refresh time from the most recently updated record
    const [timeRows] = await pool.query('SELECT last_refreshed_at FROM countries ORDER BY last_refreshed_at DESC LIMIT 1');

    return {
        total_countries: countRows[0].total_countries,
        last_refreshed_at: timeRows[0] ? timeRows[0].last_refreshed_at.toISOString() : null,
    };
}

/**
 * Gets the top 5 countries by GDP.
 */
async function getTopGdpCountries() {
    const [rows] = await pool.query('SELECT name, estimated_gdp FROM countries ORDER BY estimated_gdp DESC LIMIT 5');
    return rows;
}

module.exports = {
    upsertCountry,
    getCountries,
    getCountryByName,
    deleteCountryByName,
    getStatus,
    getTopGdpCountries,
};