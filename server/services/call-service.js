/****************************************************
Handle Twilio Calls
****************************************************/

const twilio = require("twilio");
const { VoiceResponse } = require('twilio').twiml;
const env = require("dotenv");
const { relayConfig } = require('../bot/relay-config');
const { systemPrompt } = require('../bot/prompt-config');

env.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

class CallService {
    constructor(callSid = null) {
        this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        this.callSid = callSid;
        // Default to environment variables but allow override
        this.to = process.env.TO_PHONE_NUMBER || "";
        this.from = process.env.TWILIO_PHONE_NUMBER || "";
        this.url = process.env.NGROK_URL || "";
        this.method = "POST";
        this.statusCallback = `${process.env.NGROK_URL}/call-status`;
        this.applicationSid = process.env.TWIML_APP_SID;
    }

    validatePhoneNumber(number) {
        // Basic E.164 format validation
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(number)) {
            throw new Error(`Invalid phone number format: ${number}. Must be in E.164 format (e.g., +1234567890)`);
        }
        return true;
    }

    setPhoneNumbers(from, to) {
        if (from) {
            this.validatePhoneNumber(from);
            this.from = from;
        }
        if (to) {
            this.validatePhoneNumber(to);
            this.to = to;
        }
    }

    generateConversationRelay() {
        const twiml = new VoiceResponse();
        const connect = twiml.connect();
        
        connect.conversationRelay({
            // Base Configuration
            url: process.env.WEBSOCKET_URL || `wss://${process.env.HOSTNAME}/relay`,
            
            // Speech-to-Text Configuration
            sttProvider: 'deepgram',
            interim: true,                // Enable faster processing
            dualChannel: true,            // Better audio quality
            enhancedModel: false,         // Faster processing
            
            // Text-to-Speech Configuration
            ttsProvider: 'google',
            ttsVoice: 'en-US-Standard-B', // Standard voice for lower latency
            
            // Voice Activity Detection
            vadMode: 'aggressive',        // Faster speech detection
            vadLevel: 3,                  // Higher sensitivity
            
            // Timing and Response Settings
            endSilenceTimeoutMs: 500,     // Reduced silence timeout
            speechEndThresholdMs: 300,    // Faster speech end detection
            postSpeechTimerMs: 500,       // Control post-speech silence
            
            // Interaction Settings
            interruptible: "true",
            bargeinEnabled: true,
            
            // Context
            context: JSON.stringify({
                systemPrompt: systemPrompt,
                role: "assistant"
            }),

            // Multi-language Configuration
            languages: ["en-US", "es-MX"],
            sttLanguages: ["en", "es"],     
            ttsVoices: {                   
                "en-US": "en-US-Standard-B",
                "es-MX": "es-MX-Standard-A"
            },
        });

        return twiml.toString();
    }

    async startRecording() {
        try {
            const recording = await client.calls(this.callSid)
                .recordings.create({
                    recordingChannels: 'dual'
                });
            
            console.log(`Recording started for call ${this.callSid}`);
            return {
                status: 'success',
                mediaUrl: `https://api.twilio.com${recording.uri.replace(".json", "")}`
            };
        } catch (error) {
            console.error('Recording error:', error);
            return { status: 'error', error };
        }
    }

    async endCall() {
        try {
            await client.calls(this.callSid)
                .update({ status: 'completed' });
            console.log(`Call ${this.callSid} ended`);
            return { status: 'success' };
        } catch (error) {
            console.error('End call error:', error);
            return { status: 'error', error };
        }
    }

    // Method to handle incoming calls
    async handleIncomingCall() {
        try {
            return this.generateConversationRelay();
        } catch (error) {
            console.error('Error handling incoming call:', error);
            const twiml = new VoiceResponse();
            twiml.say('An error occurred. Please try again later.');
            return twiml.toString();
        }
    }

    // Method to make outbound calls with ConversationRelay
    async makeCall() {
        console.log('Initiating call:');
        const baseUrl = process.env.NGROK_URL || 'https://imp-tolerant-stag.ngrok-free.app';
        
        try {
            const call = await this.client.calls.create({
                from: this.from || process.env.TWILIO_PHONE_NUMBER,
                to: this.to || process.env.TO_PHONE_NUMBER,
                url: `${baseUrl}/call-handler`,
                statusCallback: `${baseUrl}/call-status`,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                statusCallbackMethod: 'POST'
            });

            return {
                status: 'success',
                callSid: call.sid,
                from: this.from || process.env.TWILIO_PHONE_NUMBER,
                to: this.to || process.env.TO_PHONE_NUMBER
            };
        } catch (error) {
            console.error('Error making call:', error);
            throw error;
        }
    }
}

module.exports = { CallService };