import 'dotenv/config';

function required(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  SESSION_SECRET: required('SESSION_SECRET'),
  X_CLIENT_ID: required('X_CLIENT_ID'),
  X_CLIENT_SECRET: required('X_CLIENT_SECRET'),
  X_CALLBACK_URL: required('X_CALLBACK_URL'),
  // OAuth 1.0a app credentials for media upload
  X_API_KEY: process.env.X_API_KEY,
  X_API_SECRET: process.env.X_API_SECRET,
  X_OAUTH1_CALLBACK_URL: process.env.X_OAUTH1_CALLBACK_URL,
  DATABASE_URL: required('DATABASE_URL'),
};
