import { randomInt } from 'crypto';
import { OpenAI } from 'openai';

export async function chat(prompt: string): Promise<string> {
  // Initialize OpenAI client
  const openai = new OpenAI({
    baseURL: process.env.OPENAI_API_BASE_URL2,
    apiKey: process.env.OPENAI_API_KEY2,
    defaultHeaders: { "x-foo": "true" },
  });

  const messages: [any] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: prompt,
        },
      ]
    }
  ]

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_API_MODEL2 || 'gpt-4o-mini',
    seed: randomInt(1000000),
    messages: messages,
    max_tokens: 2048,
    temperature: 0.7,
  });
  // console.log('response:', response);

  const result = response.choices[0].message.content;
  if (!result) {
    throw new Error(`invalid response: ${response}`);
  }
  // console.log('result:', result);
  return result;
}