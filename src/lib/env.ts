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
};
