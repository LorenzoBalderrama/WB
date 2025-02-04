require('dotenv').config();
const express = require('express');
const expressWs = require('express-ws');
const { LLMService } = require('./services/llm-service');
const { CallService } = require('./services/call-service');
const { RelayService } = require('./services/relay-service');
const { systemPrompt } = require('./bot/prompt-config');

// Initialize Express with WebSocket support
const { app } = expressWs(express());

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Environment variables
const {
  HOSTNAME = 'localhost',
  PORT = 3000,
  OPENAI_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  TO_PHONE_NUMBER
} = process.env;

// Validate required environment variables
if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  throw new Error('Missing Twilio credentials');
}

/****************************************************
 * Call Handling Routes
 ****************************************************/

app.post('/voice', async (req, res) => {
  console.log('Incoming call', req.body);
  const callService = new CallService(req.body.CallSid);
  const twiml = await callService.handleIncomingCall();
  res.type('text/xml').send(twiml);
});

// Endpoint to initiate outbound calls
app.post('/call', async (req, res) => {
  try {
    const { to = TO_PHONE_NUMBER, from = TWILIO_PHONE_NUMBER } = req.body;
    const callService = new CallService();
    callService.setPhoneNumbers(from, to);
    
    const result = await callService.makeCall();
    res.json(result);
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ error: error.message });
  }
});

// Call status webhook
app.post('/call-status', (req, res) => {
  const { CallSid, CallStatus } = req.body;
  console.log('Call status update:', { CallSid, CallStatus });
  res.sendStatus(200);
});

// TwiML for outbound calls
app.post('/call-handler', (req, res) => {
  const callService = new CallService(req.body.CallSid);
  const twiml = callService.generateConversationRelay();
  res.type('text/xml').send(twiml);
});

/****************************************************
 * WebSocket Handler
 ****************************************************/

app.ws('/relay', (ws, req) => {
  console.log('WebSocket connection established');
  
  // Initialize services
  const relayService = new RelayService(ws);
  
  // Handle incoming messages from ConversationRelay
  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('Received message:', data);
      
      // Use RelayService to handle the message
      await relayService.handleMessage(data);
      
    } catch (error) {
      console.error('Error processing message:', error);
      relayService.sendMessage({
        type: 'text',
        token: "I apologize, but I encountered an error. Could you please repeat that?",
        last: true
      });
    }
  });

  // Handle WebSocket closure
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    relayService.cleanup();
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    relayService.cleanup();
  });
});

/****************************************************
 * Health Check
 ****************************************************/

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    twilioConfigured: Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN),
    openaiConfigured: Boolean(OPENAI_API_KEY)
  });
});

/****************************************************
 * Server Initialization
 ****************************************************/

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook URL: https://${HOSTNAME}/voice`);
  console.log(`WebSocket URL: wss://${HOSTNAME}/relay`);
});

module.exports = app;