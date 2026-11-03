import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dashboardRoutes from './routes/dashboard.js';
import clientRoutes from './routes/clients.js';
import employeeRoutes from './routes/employees.js';
import requestRoutes from './routes/requests.js';
import serviceRoutes from './routes/services.js';

const app = express();
const port = Number.parseInt(process.env.PORT ?? '4000', 10);
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/v1/health', (_req, res) => {
  res.json({ service: 'sdmon-api', status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/services', serviceRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`SDMON API listening on port ${port}`);
});
