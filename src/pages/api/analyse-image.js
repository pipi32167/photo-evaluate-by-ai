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

async function analyse_image({
  image_path,
  lang,
  prompt = "详细描述这张图片，并思考其可用于作诗的意象。",
}) {
  const base64Image = await fs.promises.readFile(image_path, {
    encoding: "base64",
  });

  const response = await chat_with_img(prompt, base64Image);

  return response;
}

router.post(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image" });
    }

    const imageFile = req.file;

    if (imageFile.originalname === "") {
      return res.status(400).json({ error: "No selected image file" });
    }

    // Save file to a temporary location
    const tempFilePath = path.join("/tmp", imageFile.originalname);

    await fs.promises.writeFile(tempFilePath, imageFile.buffer);

    // Call the evaluation function
    // const response = await analyse_image({
    //   image_path: tempFilePath,
    //   lang: req.body.lang,
    //   prompt: req.body.prompt,
    // });

    const response =
      "这张图片描绘了一个宁静的湖边场景，一个女人坐在木制长椅上，背对镜头，凝视着壮丽的山景和湖泊。\n\n**细节描述：**\n\n* **前景：**一个简单的木制长椅，涂有绿色的金属装饰，坐落在一个低矮的石墙上。一个年轻女子穿着浅色长裤和一件头巾坐在长椅上。她的头发是金色的，披散在肩上。\n* **中景：**一个平静的湖泊占据了图片的很大一部分，其深蓝色的水反射着周围山脉的倒影。湖面平静如镜，几乎没有波纹。\n* **背景：**高耸的山脉，其轮廓清晰可见，覆盖着茂密的绿色植被。山峰高耸入云，呈现出灰色的岩石和深绿色的树木的混合。天空布满了蓬松的白云，与山脉的雄伟形成对比。\n\n**诗歌意象：**\n\n这张图片提供了丰富的意象，可以用于创作各种风格的诗歌：\n\n* **宁静与孤独：**女人的孤独身影，平静的湖面，以及周围的寂静山脉，都象征着宁静和孤独。这可以用来表达对内省、沉思或与世隔绝的渴望。\n* **自然之美：**山脉、湖泊、云彩的壮丽景色，可以用来赞美大自然的美丽和力量。这可以是一首自然风景诗，或者一首关于人与自然和谐共处的诗。\n* **等待与期盼：**女人背对镜头，凝视着远方，暗示着等待或期盼。这可以用来表达对未来的憧憬，对爱情的渴望，或者对某种目标的追求。\n* **对比与和谐：**人造的长椅与自然景观的对比，以及女人与周围环境的和谐，可以用来探讨人与自然的关系，以及人类在自然中的位置。\n* **色彩与光线：**图片中柔和的色彩和光线，可以用来营造一种宁静祥和的氛围。这可以用来表达一种平静的心情，或者对美好事物的向往。\n\n总而言之，这张图片提供了丰富的意象，可以激发诗人的灵感，创作出各种主题和风格的诗歌。  诗歌可以侧重于自然景观的描写，也可以侧重于人物内心的情感，或者两者兼而有之。\n";

    // Ensure we send a response
    return res.status(200).json({ result: response });
  } catch (error) {
    console.error("Error:", error);
    // Ensure we send an error response
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Remove the temporary file
    await fs.promises.unlink(tempFilePath);
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
