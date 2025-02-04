const EventEmitter = require('events');
const { OpenAI } = require("openai");
const { systemPrompt } = require('../bot/prompt-config');

class LLMService extends EventEmitter {
  constructor(model = 'gpt-4o') {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.userContext = [{
      role: 'system',
      content: systemPrompt
    }];
    
    this.model = model;
    this.maxContextLength = 10;
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

      if (this.userContext.length > this.maxContextLength) {
        this.userContext = [
          this.userContext[0],
          ...this.userContext.slice(-4)
        ];
      }

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: this.userContext,
        temperature: 0.7,
        max_tokens: 150,
        presence_penalty: 0.6,
        frequency_penalty: 0.6,
      });

      const responseText = completion.choices[0].message.content;
      
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

  clearContext() {
    this.userContext = [{
      role: 'system',
      content: systemPrompt
    }];
  }
}

module.exports = { LLMService };
