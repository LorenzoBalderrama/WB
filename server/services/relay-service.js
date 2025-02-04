/****************************************************
 MANAGE WEBSOCKET CONNECTIONS WITH TWILIO CONVERSATION RELAY
****************************************************/

const { LLMService } = require('./llm-service');
const { systemPrompt } = require('../bot/prompt-config');

class RelayService {
    constructor(ws) {
        this.ws = ws;
        this.llmService = new LLMService('gpt-4o');
        this.isInitialized = false;
        this.context = null;
        this.isProcessing = false;
        
        this.llmService.on('reply', (response, final) => {
            if (response && response.trim()) {
                console.log('Sending AI response:', response);
                const chunks = this.chunkResponse(response);
                
                chunks.forEach((chunk, index) => {
                    if (chunk.trim()) {  // Only send non-empty chunks
                        this.sendMessage({
                            type: 'text',
                            token: chunk,
                            last: index === chunks.length - 1
                        });
                    }
                });
            }
        });
    }

    chunkResponse(text, maxLength = 100) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const chunks = [];
        let currentChunk = '';

        sentences.forEach(sentence => {
            if (currentChunk.length + sentence.length > maxLength) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        });

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    handleMessage(data) {
        switch (data.type) {
            case 'setup':
                console.log('Conversation Relay Setup:', data);
                this.sessionId = data.sessionId;
                this.callSid = data.callSid;
                this.context = data.customParameters?.context ? 
                    JSON.parse(data.customParameters.context) : 
                    { systemPrompt };
                this.isInitialized = true;
                break;

            case 'prompt':
                if (data.voicePrompt && data.voicePrompt.trim()) {
                    console.log('Received voice prompt:', data.voicePrompt);
                    
                    if (this.isInitialized) {
                        this.handleUserInput(data.voicePrompt);
                    }
                }
                break;

            case 'interrupt':
                console.log('TTS interrupted:', data);
                // Only log interrupts, don't take any action
                break;

            case 'dtmf':
                console.log('Received DTMF:', data.digit);
                break;

            case 'error':
                console.error('Conversation Relay Error:', data);
                this.handleError(data);
                break;
        }
    }

    async handleUserInput(text) {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            console.log('Processing user input:', text);
            
            const response = await this.llmService.getResponse(text);
            if (!response) {
                this.sendFallbackResponse(text);
            }
        } catch (error) {
            console.error('Error processing user input:', error);
            this.sendMessage({
                type: 'text',
                token: "I apologize for the delay. Could you please repeat your question?",
                last: true
            });
        } finally {
            this.isProcessing = false;
        }
    }

    sendFallbackResponse(text = '') {
        const fallbackResponses = [
            "I understand you're asking about " + text + ". Could you provide more specific details about what you'd like to know?",
            "I'd be happy to help with your question about " + text + ". What particular aspects are you interested in?",
            "Let me assist you with " + text + ". Could you elaborate on your requirements?",
            "I can help you with that. What specific information about " + text + " would you like to know?"
        ];
        
        const response = text ? 
            fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)] :
            "I'm here to help with Twilio and Weights & Biases. What would you like to know?";

        this.sendMessage({
            type: 'text',
            token: response,
            last: true
        });
    }

    sendMessage(message) {
        if (this.ws.readyState === 1) {
            console.log('Sending message:', message);
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
        this.endSession('Session terminated');
    }
}

module.exports = { RelayService };