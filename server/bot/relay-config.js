const env = require("dotenv");

env.config();

export const relayConfig = {
    sttProvider: STT_PROVIDER ?? "deepgram",
    ttsProvider: TTS_PROVIDER ?? "google",
    ttsVoice: TTS_VOICE ?? "en-US-Journey-D",
}