const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');

// Refresh Endpoints
router.post('/refresh', countryController.refreshCountries);
router.get('/image', countryController.getCountryImage);

// Status Endpoint
router.get('/status', countryController.getStatus);

// CRUD Endpoints
router.get('/', countryController.getAllCountries); // GET /countries?region=Africa&sort=gdp_desc
router.get('/:name', countryController.getCountry); // GET /countries/:name
router.delete('/:name', countryController.deleteCountry); // DELETE /countries/:name


module.exports = router;