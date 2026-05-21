import { Router } from 'express';
import supabase from '../services/supabaseClient.js';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('documents').select('*').limit(1);
  res.json({ data, error });
});

export default router;
