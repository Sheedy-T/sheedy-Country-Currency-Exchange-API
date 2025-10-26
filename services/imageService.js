const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises'); // Use fs.promises for async file operations

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const IMAGE_PATH = path.join(CACHE_DIR, 'summary.png');

/**
 * Formats a number for display (e.g., 1234567890 -> 1.23B)
 * @param {number} num
 */
function formatNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toFixed(2);
}

/**
 * Generates the summary image and saves it to cache/summary.png.
 * @param {number} totalCountries
 * @param {string} lastRefreshedAt
 * @param {Array<object>} top5Gdp
 */
async function generateSummaryImage(totalCountries, lastRefreshedAt, top5Gdp) {
    // Ensure cache directory exists
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (e) {
        console.error("Error creating cache directory:", e);
        return;
    }

    const width = 600;
    const height = 400;
    const padding = 20;

    // Convert data to SVG text (sharp requires a format it can render, SVG is easiest for text)
    let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    svgContent += `<rect width="100%" height="100%" fill="#2c3e50"/>`; // Dark blue background
    svgContent += `<style>
        .title { fill: #ecf0f1; font-size: 28px; font-weight: bold; }
        .stat { fill: #95a5a6; font-size: 18px; }
        .gdp-title { fill: #f1c40f; font-size: 20px; font-weight: bold; }
        .gdp-item { fill: #ecf0f1; font-size: 16px; }
    </style>`;

    let y = padding + 30;

    // Title
    svgContent += `<text x="${padding}" y="${y}" class="title">Country API Summary</text>`;
    y += 50;

    // Total Countries
    svgContent += `<text x="${padding}" y="${y}" class="stat">Total Countries: ${totalCountries}</text>`;
    y += 30;

    // Last Refresh Time
    svgContent += `<text x="${padding}" y="${y}" class="stat">Last Refreshed At: ${lastRefreshedAt ? new Date(lastRefreshedAt).toUTCString() : 'N/A'}</text>`;
    y += 50;

    // Top 5 GDP Title
    svgContent += `<text x="${padding}" y="${y}" class="gdp-title">Top 5 Estimated GDP:</text>`;
    y += 30;

    // Top 5 GDP List
    top5Gdp.forEach((country, index) => {
        const gdpText = `${index + 1}. ${country.name}: $${formatNumber(country.estimated_gdp)}`;
        svgContent += `<text x="${padding * 2}" y="${y}" class="gdp-item">${gdpText}</text>`;
        y += 25;
    });

    svgContent += `</svg>`;

    // Render the SVG to a PNG file using sharp
    await sharp(Buffer.from(svgContent))
        .png()
        .toFile(IMAGE_PATH);

    console.log(`Summary image generated at ${IMAGE_PATH}`);
}

/**
 * Checks if the image file exists.
 */
async function imageExists() {
    try {
        await fs.access(IMAGE_PATH);
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    generateSummaryImage,
    IMAGE_PATH,
    imageExists
};