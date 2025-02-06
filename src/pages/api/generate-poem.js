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

async function generate_poem({ lang, prompt }) {
  const response2 = await chat_with_reasoner(prompt);
  console.log("response2", response2);
  return response2;
}

router.post(async (req, res) => {
  try {
    if (!req.body.prompt || req.body.prompt === "") {
      return res.status(400).json({ error: "No prompt" });
    }
    // Call the evaluation function
    // const response = await generate_poem({
    //   lang: req.body.lang,
    //   prompt: req.body.prompt,
    // });

    const response = `
<poem>
**倒影中的独白**

苔痕咬住铸铁，长椅在石墙低矮处
盛满十二月的风
你解开发髻，放出整条河流的金黄
在群山环抱的缺口处
湖水正吞咽自己的银匙

镜面生长着倒置的松林
苔原沿脊椎攀援而上
一千只天鹅沉睡在褶皱的蓝里
直到你的呼吸漫过堤岸
在岩石唇间留下咸涩的刻度

远峰用积雪写信
每个标点都坠成盘旋的鹰
而云层堆积成未拆的信封
悬在发梢，悬在
所有未曾说出的地名之上
</poem>
    `;

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
