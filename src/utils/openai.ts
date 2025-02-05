import { randomInt } from 'crypto';
import { OpenAI } from 'openai';

export async function chat(prompt: string, base64Image: string = ''): Promise<string> {
  // Initialize OpenAI client
  const openai = new OpenAI({
    baseURL: process.env.OPENAI_API_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
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

  if (base64Image) {
    messages[0].content.push(
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`
        }
      })
  }

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_API_MODEL || 'gpt-4o-mini',
    seed: randomInt(1000000),
    messages: messages,
    max_tokens: 2048,
    temperature: 0.1,
  });
  // console.log('response:', response);

  const result = response.choices[0].message.content;
  if (!result) {
    throw new Error(`invalid response: ${response}`);
  }
  // console.log('result:', result);
  return result;
}