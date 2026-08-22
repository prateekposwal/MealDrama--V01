import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();
const AI_BRIDGE_URL = process.env.AI_BRIDGE_URL || 'http://localhost:5002';

// Proxy all /api/v1/ai/* requests to Python bridge
router.use(async (req: Request, res: Response) => {
  try {
    // req.originalUrl includes the mounted prefix, e.g. /api/v1/ai/suggestions
    const url = `${AI_BRIDGE_URL}${req.originalUrl}`;

    if (req.method === 'GET') {
      const response = await axios.get(url, { params: req.query });
      return res.json(response.data);
    }

    const response = await axios.post(url, req.body, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json(response.data);
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'AI service unavailable',
        message: 'The Python AI bridge is not running. Start it with: cd ~/Desktop/Vrooom-computation && PYTHONPATH=. python3 telos/server_bridge.py',
      });
    }
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: 'AI proxy error', message: error.message });
  }
});

export default router;
