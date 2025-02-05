const { GoogleGenerativeAI } = require("@google/generative-ai");

export async function chat(prompt: string, base64Image: string = '', temperature: number = 0.1): Promise<string> {

    const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);

    const model = genAI.getGenerativeModel({ model: `models/${process.env.OPENAI_API_MODEL}` });

    const messages = [];
    if (base64Image) {
        messages.push({
            inlineData: {
                data: base64Image,
                mimeType: "image/jpeg",
            },
        });
    }
    messages.push(prompt);
    let result = await model.generateContent(messages, {
        temperature: temperature,
        seed: Math.floor(Math.random() * 1000000),
    });
    result = result.response.text()
    console.log(result);
    return result as string
}