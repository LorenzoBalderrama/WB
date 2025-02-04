/****************************************************
 MANAGE WEBSOCKET CONNECTIONS WITH TWILIO CONVERSATION RELAY
****************************************************/

const { LLMService } = require('./llm-service');

class RelayService {
    constructor(ws) {
        this.ws = ws;
        this.llmService = new LLMService();
        
        // Set up LLM response handler
        this.llmService.on('reply', (response, final) => {
            // Send text tokens to Twilio for TTS
            this.sendMessage({
                type: 'text',
                token: response,
                last: final
            });
        });
    }

    handleMessage(data) {
        switch (data.type) {
            case 'setup':
                console.log('Conversation Relay Setup:', data);
                // Store session info if needed
                this.sessionId = data.sessionId;
                this.callSid = data.callSid;
                break;

            case 'prompt':
                if (data.voicePrompt) {
                    console.log('Received voice prompt:', data.voicePrompt);
                    this.handleUserInput(data.voicePrompt);
                }
                break;

            case 'dtmf':
                console.log('Received DTMF:', data.digit);
                // Handle DTMF input if needed
                break;

            case 'interrupt':
                console.log('TTS interrupted:', data);
                // Handle interruption if needed
                break;

            case 'error':
                console.error('Conversation Relay Error:', data);
                break;
        }
    }

    async handleUserInput(text) {
        try {
            await this.llmService.getResponse(text);
        } catch (error) {
            console.error('Error processing user input:', error);
            // Send error response to caller
            this.sendMessage({
                type: 'text',
                token: "I apologize, but I'm having trouble processing your request. Could you please try again?",
                last: true
            });
        }
    }

    sendMessage(message) {
        if (this.ws.readyState === 1) { // Check if connection is open
            this.ws.send(JSON.stringify(message));
        }
    }

    endSession(reason = '') {
        this.sendMessage({
            type: 'end',
            handoffData: JSON.stringify({
                reasonCode: 'session-ended',
                reason: reason
            })
        });
    }

    cleanup() {
        this.llmService.removeAllListeners();
        // End the session before cleanup
        this.endSession('Session terminated');
    }
}

module.exports = { RelayService };