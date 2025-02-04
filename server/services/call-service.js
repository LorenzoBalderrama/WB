const twilio = require("twilio");
const { VoiceResponse } = require('twilio').twiml;
const env = require("dotenv");

env.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export class CallService {
    constructor() {
      this.to = process.env.TO_PHONE_NUMBER || "";
      this.from = process.env.FROM_PHONE_NUMBER || "";
      this.url = process.env.NGROK_URL || "";
      this.method = "POST";
      this.statusCallback = process.env.STATUS_CALLBACK || "";
  
      if (!this.to || !this.from) {
        throw new Error("Phone numbers must be defined in environment variables.");
      }
    }
  
    async makeCall() {
      console.log(`Calling from ${this.from} to ${this.to}`);
      
      try {
        const call = await client.calls.create({
          to: this.to,
          from: this.from,
          url: `${this.url}/incoming`,
          method: this.method,
          statusCallback: this.statusCallback,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
          statusCallbackMethod: 'POST'
        });
        
        console.log(`Call initiated with SID: ${call.sid}`);
        return call;
      } catch (error) {
        console.error('Error making call:', error);
        throw error;
      }
    }
}