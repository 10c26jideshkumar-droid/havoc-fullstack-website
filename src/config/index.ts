import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/havoc_db',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-havoc-jwt-token-key-change-in-production-2025',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};
