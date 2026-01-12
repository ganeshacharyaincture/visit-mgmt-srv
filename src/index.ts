import express from 'express';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

// Sample Route
app.routes("/", routes)

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Centralized error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});