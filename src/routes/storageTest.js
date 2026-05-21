import { Router } from 'express';
import supabase from '../services/supabaseClient.js';
import fs from 'fs';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const fileBuffer = fs.readFileSync('sample.txt'); // create a small test file
    const { data, error } = await supabase.storage
      .from('documents')
      .upload('sample.txt', fileBuffer, {
        contentType: 'text/plain',
        upsert: true,
      });

    res.json({ data, error });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;