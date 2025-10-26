const CountryModel = require('../models/Country');
const { fetchCountryData, fetchExchangeRates, ExternalApiError } = require('../services/externalApiService');
const { generateSummaryImage, imageExists, IMAGE_PATH } = require('../services/imageService');
const path = require('path');

// --- Helper for GDP Calculation ---
/**
 * Generates a random multiplier between 1000 and 2000.
 */
const getRandomMultiplier = () => {
    return Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;
};

// --- Refresh Endpoint Logic ---
async function refreshCountries(req, res) {
    let countriesData, exchangeRates;

    try {
        // 1. Fetch External Data (Atomic Failure)
        [countriesData, exchangeRates] = await Promise.all([
            fetchCountryData(),
            fetchExchangeRates()
        ]);
    } catch (error) {
        if (error instanceof ExternalApiError) {
            return res.status(503).json({
                error: "External data source unavailable",
                details: error.message
            });
        }
        console.error("Unknown error during fetch:", error);
        return res.status(500).json({ error: "Internal server error" });
    }

    try {
        const upsertPromises = countriesData.map(country => {
            const { name, capital, region, population, currencies, flag: flag_url } = country;

            // 2. Currency Handling
            const currency_code = (currencies && currencies.length > 0) ? currencies[0].code : null;
            let exchange_rate = null;
            let estimated_gdp = 0; // Default for null currency/rate

            // Check if currency code exists and is in the fetched rates
            if (currency_code) {
                if (exchangeRates[currency_code]) {
                    exchange_rate = exchangeRates[currency_code];

                    // 3. GDP Calculation
                    const multiplier = getRandomMultiplier();
                    // estimated_gdp = population × random(1000–2000) ÷ exchange_rate
                    estimated_gdp = (population * multiplier) / exchange_rate;
                } else {
                    // Currency code not found in exchange rates API
                    exchange_rate = null;
                    estimated_gdp = null; // Set to null as per requirement
                }
            }

            // 4. Validation (though external API data should be mostly clean, population is required)
            if (!name || population === undefined) {
                // Skip invalid records, but log it or handle it based on strictness
                return null;
            }

            return CountryModel.upsertCountry({
                name,
                capital,
                region,
                population,
                currency_code,
                exchange_rate: exchange_rate !== null ? parseFloat(exchange_rate) : null,
                estimated_gdp: estimated_gdp !== null ? parseFloat(estimated_gdp) : null,
                flag_url,
            });
        }).filter(p => p !== null); // Filter out skipped invalid records

        // Execute all database upserts
        await Promise.all(upsertPromises);

        // 5. Image Generation
        const status = await CountryModel.getStatus();
        const top5 = await CountryModel.getTopGdpCountries();
        await generateSummaryImage(status.total_countries, status.last_refreshed_at, top5);

        // 6. Response
        return res.status(200).json({ message: "Countries and exchange rates refreshed successfully." });

    } catch (error) {
        console.error("Database or Image Generation Error:", error);
        // Do not modify existing database records if refresh fails (handled by catching error before commit if using transactions, but here, we just fail and rely on the next successful run)
        return res.status(500).json({ error: "Internal server error" });
    }
}

// --- CRUD & Status Endpoint Logic ---

async function getAllCountries(req, res) {
    try {
        const { region, currency, sort } = req.query;
        const countries = await CountryModel.getCountries({ region, currency }, sort);
        return res.status(200).json(countries);
    } catch (error) {
        console.error("Error getting countries:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function getCountry(req, res) {
    try {
        const country = await CountryModel.getCountryByName(req.params.name);
        if (!country) {
            return res.status(404).json({ error: "Country not found" });
        }
        return res.status(200).json(country);
    } catch (error) {
        console.error("Error getting country by name:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function deleteCountry(req, res) {
    try {
        const affectedRows = await CountryModel.deleteCountryByName(req.params.name);
        if (affectedRows === 0) {
            return res.status(404).json({ error: "Country not found" });
        }
        return res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
        console.error("Error deleting country:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function getStatus(req, res) {
    try {
        const status = await CountryModel.getStatus();
        return res.status(200).json(status);
    } catch (error) {
        console.error("Error getting status:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function getCountryImage(req, res) {
    try {
        if (!await imageExists()) {
            return res.status(404).json({ error: "Summary image not found" });
        }
        // Serve the image file
        res.sendFile(IMAGE_PATH, (err) => {
            if (err) {
                console.error("Error serving image:", err);
                // If there's an error serving the file (e.g., deleted), treat as 404/500
                res.status(404).json({ error: "Summary image not found" });
            }
        });
    } catch (error) {
        console.error("Error serving image:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


module.exports = {
    refreshCountries,
    getAllCountries,
    getCountry,
    deleteCountry,
    getStatus,
    getCountryImage
};