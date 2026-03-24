import { config } from "dotenv";

config();

const env = process.env;

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const ENV = {
  NODE_ENV: env.NODE_ENV || "development",
  PORT: toNumber(env.PORT, 3000),

  PGUSER: env.PGUSER || "",
  PG_PASSWORD: env.PG_PASSWORD || "",
  PG_HOST: env.PG_HOST || "localhost",
  PG_PORT: toNumber(env.PG_PORT, 5432),
  PG_DATABASE: env.PG_DATABASE || "",

  REDIS_HOST: env.REDIS_HOST || "localhost",
  REDIS_PORT: toNumber(env.REDIS_PORT, 6379),

  KAFKA_BROCKERS: env.KAFKA_BROCKERS || "localhost:9092",
  KAFKA_CLIENT_ID: env.KAFKA_CLIENT_ID || "eccommerce-service",
};