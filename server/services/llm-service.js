const { OpenAI } = require("openai");

const openai = new OpenAI();

export class LLMService {
  constructor() {}

  async getResponse(prompt) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });
  }
}
