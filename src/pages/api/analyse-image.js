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
    const response = await analyse_image({
      image_path: tempFilePath,
      lang: req.body.lang,
      prompt: req.body.prompt,
    });

    // Remove the temporary file
    await fs.promises.unlink(tempFilePath);

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
