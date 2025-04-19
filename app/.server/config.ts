const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const config = {
  baseUrl: getEnv("BASE_URL"),
  nodeEnv: process.env.NODE_ENV || "development",
  secret: getEnv("SECRET"),
  uploads: {
    dir: getEnv("UPLOADS_DIR"),
  },
  auth: {
    clientId: getEnv("GOOGLE_CLIENT_ID"),
    clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
  },
};

export type Config = typeof config;
