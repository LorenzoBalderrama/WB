const EventEmitter = require('events');
const { OpenAI } = require("openai");
const { systemPrompt } = require('../bot/prompt-config');

class LLMService extends EventEmitter {
  constructor(model = 'gpt-4') {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.userContext = [{
      role: 'system',
      content: systemPrompt
    }];
    
    this.model = model;
    this.callInfo = {};
    this.abortController = null;
  }

  async getResponse(prompt, icount) {
    try {
      this.abortController = new AbortController();
      
      this.userContext.push({
        role: 'user',
        content: prompt
      });

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: this.userContext,
        temperature: 0.7,
      });

      const response = completion.choices[0].message;
      const responseText = response.content;
      
      this.userContext.push({
        role: 'assistant',
        content: responseText,
      });
      
      this.emit('reply', responseText, true, icount);
      return responseText;

    } catch (error) {
      console.error('Error in LLM completion:', error);
      const errorMessage = "I apologize, but I'm having trouble processing your request. Could you please try again?";
      this.emit('reply', errorMessage, true, icount);
      return errorMessage;
    }
  }

  interrupt() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  setCallInfo(key, value) {
    this.callInfo[key] = value;
  }
}

module.exports = { LLMService };
