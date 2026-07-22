import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const router = Router();

const TMP_DIR = path.join(__dirname, '../../tmp/audio');
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Clean up old files every time
setInterval(() => {
  const files = fs.readdirSync(TMP_DIR);
  const now = Date.now();
  for (const file of files) {
    const fp = path.join(TMP_DIR, file);
    const stat = fs.statSync(fp);
    if (now - stat.mtimeMs > 3_600_000) {
      fs.unlinkSync(fp);
    }
  }
}, 600_000);

// GET /api/v1/tts/voices — list available voices
router.get('/voices', (_req: Request, res: Response) => {
  try {
    const output = execSync('say -v "?"', { encoding: 'utf8' });
    const lines = output.trim().split('\n').filter(Boolean);
    const voices = lines.map((line: string) => {
      const match = line.match(/^(\S+)\s+(\S+)/);
      return match ? { name: match[1], locale: match[2] } : null;
    }).filter(Boolean);
    res.json({ success: true, voices });
  } catch {
    console.warn('[TTS] Voice list fetch failed, returning empty');
    res.json({ success: false, voices: [] });
  }
});

// POST /api/v1/tts — generate audio from text
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, voice, language } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'text is required' });
    }

    const safeText = text.replace(/["'`]/g, '').slice(0, 2000);

    // Map Indian languages to female voices; fallback to Samantha (female US English)
    const voiceMap: Record<string, string> = {
      hi: 'Aditi', mr: 'Aditi', bn: 'Aditi', ta: 'Vani', te: 'Vani',
    };
    let voiceFlag = voiceMap[language] || voice || 'Samantha';

    // Check if voice exists; fallback to Samantha
    try {
      const availableVoices = execSync('say -v "?"', { encoding: 'utf8', timeout: 5000 });
      if (!availableVoices.includes(voiceFlag)) {
        voiceFlag = 'Samantha'; // Female English voice, always available
      }
    } catch {
      console.warn('[TTS] Voice lookup failed, falling back to Samantha');
      voiceFlag = 'Samantha';
    }

    const filename = `tts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.wav`;
    const outPath = path.join(TMP_DIR, filename);

    let cmd = `say -o "${outPath}"`;
    if (voiceFlag) cmd += ` -v "${voiceFlag}"`;
    cmd += ` "${safeText}"`;

    execSync(cmd, { timeout: 30000 });

    if (!fs.existsSync(outPath)) {
      return res.status(500).json({ success: false, error: 'TTS generation failed' });
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `attachment; filename="voice.wav"`);
    const stream = fs.createReadStream(outPath);
    stream.pipe(res);
    stream.on('end', () => {
      setTimeout(() => {
        try { fs.unlinkSync(outPath); } catch { /* temp file cleanup — non-critical */ }
      }, 5000);
    });
  } catch (err: any) {
    console.error('[TTS ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
