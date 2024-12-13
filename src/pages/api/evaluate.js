import { createRouter } from 'next-connect';
import multer from 'multer';
import { photo_evaluate } from '../../utils/llm_score';

// Configure multer to store files in memory
const upload = multer({
    storage: multer.memoryStorage(),
});

// Create a next-connect handler
const router = createRouter();

router.use(upload.single('image'));

router.post(async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image' });
        }

        const imageFile = req.file;

        if (imageFile.originalname === '') {
            return res.status(400).json({ error: 'No selected image file' });
        }

        // Save file to a temporary location
        const fs = require('fs').promises;
        const path = require('path');
        const tempFilePath = path.join('/tmp', imageFile.originalname);

        await fs.writeFile(tempFilePath, imageFile.buffer);

        // Call the evaluation function
        const response = await photo_evaluate({ image_path: tempFilePath });

        // Remove the temporary file
        await fs.unlink(tempFilePath);

        // Ensure we send a response
        return res.status(200).json({ result: response });
    } catch (error) {
        console.error('Error:', error);
        // Ensure we send an error response
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        // If somehow we get here without sending a response, send one
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Unknown error occurred' });
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