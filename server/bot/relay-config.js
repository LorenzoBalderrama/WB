/****************************************************
Configure Relay Service
****************************************************/


const env = require("dotenv");

env.config();

const relayConfig = {
    sttProvider: process.env.STT_PROVIDER || "deepgram",
    ttsProvider: process.env.TTS_PROVIDER || "google",
    ttsVoice: process.env.TTS_VOICE || "en-US-Journey-D",
};

module.exports = { relayConfig };