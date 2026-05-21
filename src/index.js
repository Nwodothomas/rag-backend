import express from 'express';
import supabaseTestRoute from './routes/supabaseTest.js';
import storageTestRoute from './routes/storageTest.js';   // <-- add this line

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Supabase test route
app.use('/test-supabase', supabaseTestRoute);

// Storage test route
app.use('/test-storage', storageTestRoute);   // <-- register here

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});