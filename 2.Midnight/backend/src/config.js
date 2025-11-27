import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  port: process.env.PORT || 5000,
  
  jwt: {
    secret: process.env.JWT_SECRET || 'midnight-diner-secret-key-change-in-production',
    expiresIn: '7d'
  },
  
  database: {
    path: join(__dirname, '..', 'database.db')
  },
  
  uploads: {
    path: join(__dirname, '..', 'uploads'),
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};
