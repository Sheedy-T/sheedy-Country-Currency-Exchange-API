const axios = require('axios');
require('dotenv').config();

const COUNTRIES_API_URL = process.env.COUNTRIES_API_URL;
const EXCHANGE_RATE_API_URL = process.env.EXCHANGE_RATE_API_URL;

class ExternalApiError extends Error {
    constructor(message, apiName) {
        super(message);
        this.name = 'ExternalApiError';
        this.apiName = apiName;
    }
}

/**
 * Fetches all country data.
 */
async function fetchCountryData() {
    try {
        const response = await axios.get(COUNTRIES_API_URL, { timeout: 10000 });
        return response.data;
    } catch (error) {
        throw new ExternalApiError(`Could not fetch data from restcountries.com`, 'restcountries.com');
    }
}

/**
 * Fetches exchange rates against USD.
 */
async function fetchExchangeRates() {
    try {
        const response = await axios.get(EXCHANGE_RATE_API_URL, { timeout: 10000 });
        // The API returns an object with a 'rates' key
        return response.data.rates;
    } catch (error) {
        throw new ExternalApiError(`Could not fetch data from open.er-api.com`, 'open.er-api.com');
    }
}

module.exports = {
    fetchCountryData,
    fetchExchangeRates,
    ExternalApiError
};