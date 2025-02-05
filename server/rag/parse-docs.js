const axios = require('axios');
const cheerio = require('cheerio');
const { documentation } = require('./documentation');

// Function to fetch and parse HTML content
async function fetchAndParse(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract main content - adjust selectors based on the website's structure
        const content = $('article, main').text();

        // Clean and split content into chunks
        const chunks = splitIntoChunks(content);

        return chunks;
    } catch (error) {
        console.error(`Error fetching URL ${url}:`, error);
        return [];
    }
}

// Function to split text into chunks
function splitIntoChunks(text, chunkSize = 500) {
    const words = text.split(' ');
    const chunks = [];
    let currentChunk = [];

    words.forEach(word => {
        if ((currentChunk.join(' ').length + word.length + 1) <= chunkSize) {
            currentChunk.push(word);
        } else {
            chunks.push(currentChunk.join(' '));
            currentChunk = [word];
        }
    });

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }

    return chunks;
}

// Main function to process all URLs
async function processDocumentation() {
    const allChunks = [];

    for (const url of documentation) {
        const chunks = await fetchAndParse(url);
        allChunks.push(...chunks);
    }

    // Here you can store the chunks in a database or return them
    console.log(allChunks);
    return allChunks;
}

// Execute the main function
processDocumentation().catch(console.error);

