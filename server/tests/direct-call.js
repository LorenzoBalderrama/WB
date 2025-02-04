const { CallService } = require('../services/call-service');
require('dotenv').config();

async function testDirectCall() {
    try {
        console.log('Initiating test call...');
        console.log(`From: ${process.env.TWILIO_PHONE_NUMBER}`);
        console.log(`To: ${process.env.TO_PHONE_NUMBER}`);

        // Create new instance with null callSid since this is a new call
        const callService = new CallService(null);
        
        // Set phone numbers from environment variables
        callService.setPhoneNumbers(
            process.env.TWILIO_PHONE_NUMBER,
            process.env.TO_PHONE_NUMBER
        );
        
        // Initiate the call
        const result = await callService.makeCall();
        
        console.log('Call initiated successfully:', result);
        
        // Wait for 30 seconds to allow for call setup
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        return result;
        
    } catch (error) {
        console.error('Error in test call:', error);
        throw error;
    }
}

// Run the test
testDirectCall()
    .then(result => {
        console.log('Test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });

module.exports = { testDirectCall };