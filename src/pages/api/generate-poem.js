import fs from "fs";
import path from "path";
import { createRouter } from "next-connect";
import multer from "multer";
import { chat as chat_with_img } from "@/utils/openai";
import { chat as chat_with_reasoner } from "@/utils/deepseek";

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
});

// Create a next-connect handler
const router = createRouter();

router.use(upload.single("image"));

async function generate_poem({ lang, prompt, imageDesc }) {
  const prompt2 = `  
\`\`\`txt
${imageDesc}
\`\`\`
请基于图片的描述，创作一首古诗词。
1. 请先进行深度思考。深度思考的内容放在<div class="think">标签中。
2. 根据深度思考的内容，创作一首古诗词。古诗词的内容放在<div class="poem">标签中。
3. 最终的结果生成一个 svg，放在<svg>标签中。使用宋体字体，字号 24，行间距 1.5 倍行高。风格古意盎然。请针对诗词的长度进行调整，使得诗词的长度适中。
`;
  console.log("prompt2", prompt2);
  const response2 = await chat_with_reasoner(prompt2);
  console.log("response2", response2);

  return response2;
}

router.post(async (req, res) => {
  try {
    if (!req.body.image_desc || req.body.image_desc === "") {
      return res.status(400).json({ error: "No image description" });
    }
    // Call the evaluation function
    const response = await generate_poem({
      lang: req.body.lang,
      prompt: req.body.prompt,
      imageDesc: req.body.image_desc,
    });

    // Ensure we send a response
    return res.status(200).json({ result: response });
  } catch (error) {
    console.error("Error:", error);
    // Ensure we send an error response
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // If somehow we get here without sending a response, send one
    if (!res.headersSent) {
      return res.status(500).json({ error: "Unknown error occurred" });
    }
  }
});

// Disable body parsing, since we're using multer
export const config = {
  api: {
    bodyParser: false,
  },
};

export default router.handler();

export const maxDuration = 60;
