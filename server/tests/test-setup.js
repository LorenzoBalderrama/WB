require('dotenv').config();
const { LLMService } = require('../services/llm-service');
const { CallService } = require('../services/call-service');

async function testLLMService() {
    console.log('Testing LLM Service...');
    const llm = new LLMService();
    
    // Test LLM response
    try {
        llm.on('reply', (response, isLast, count) => {
            console.log('\nLLM Response:', response);
            console.log('Is Last:', isLast);
            console.log('Count:', count);
        });

        const response = await llm.getResponse("What can you tell me about Twilio's Voice API?", 1);
        console.log('\nDirect Response:', response);
    } catch (error) {
        console.error('LLM Test Error:', error);
    }
}

async function testCallService() {
    console.log('\nTesting Call Service...');
    try {
        const callService = new CallService();
        // Test making an outbound call
        const result = await callService.makeCall();
        console.log('Call Result:', result);
    } catch (error) {
        console.error('Call Service Test Error:', error);
    }
}

async function runTests() {
    // First test LLM
    await testLLMService();
    
    // Then test call service if LLM works
    console.log('\nWould you like to test making a call? (y/n)');
    process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase();
        if (answer === 'y') {
            await testCallService();
        }
        process.exit();
    });
}

// Run the tests
console.log('Starting tests...');
runTests();