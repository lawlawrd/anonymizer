import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Serve built assets (React bundle, compiled CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Root page that will host the Anonymizer React app.
app.get('/', (_req, res) => {
  res.render('template', { title: 'Anonymizer' });
});

app.listen(PORT, () => {
  console.log(`Anonymizer server listening on http://localhost:${PORT}`);
});
