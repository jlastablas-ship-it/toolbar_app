import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Add CORS headers for development/safety
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Endpoint to generate toolbar items using Gemini
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Server GEMINI_API_KEY is not defined.');
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const model = 'gemini-3.5-flash';
    const responseSchema = {
      type: 'OBJECT',
      properties: {
        items: {
          type: 'ARRAY',
          description: 'A list of toolbar items.',
          items: {
            type: 'OBJECT',
            properties: {
              iconCode: {
                type: 'STRING',
                description: "The Font Awesome 5 class name, starting with 'fas fa-'. For example, 'fas fa-save'."
              },
              tooltip: {
                type: 'STRING',
                description: 'A short, user-friendly tooltip for the button.'
              },
              action: {
                type: 'STRING',
                description: 'A suggested function name in camelCase, e.g., "saveDocument".'
              }
            },
            required: ['iconCode', 'tooltip', 'action']
          }
        }
      },
      required: ['items']
    };

    const result = await ai.models.generateContent({
      model: model,
      contents: `Create a toolbar for: ${prompt}`,
      config: {
        systemInstruction: "You are an expert UI/UX designer. Your task is to generate a list of items for a web application toolbar based on a user's description. You must suggest appropriate Font Awesome 5 'fas' icons and concise tooltips for each item. The action should be a descriptive camelCase string.",
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const jsonString = result.text.trim();
    res.json(JSON.parse(jsonString));
  } catch (error) {
    console.error('Error generating toolbar:', error);
    res.status(500).json({ error: error.message || 'An error occurred during generation.' });
  }
});

// Serve static files in production
const isProd = process.env.NODE_ENV === 'production';
const port = isProd ? 3000 : 3001;

if (isProd) {
  const distPath = join(__dirname, 'dist');
  app.use(express.static(distPath));
  
  // Catch-all route to serve index.html for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  // Simple check-alive route in dev
  app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', mode: 'development' });
  });
}

app.listen(port, () => {
  console.log(`Server running in ${isProd ? 'production' : 'development'} mode on port ${port}`);
});
