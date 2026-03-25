import { config } from "dotenv";
import { toNumber } from "../utils/formatter";

config();

const env = process.env;


export const ENV = {
  NODE_ENV: env.NODE_ENV || "development",
  PORT: toNumber(env.PORT, 3000),

  PGUSER: env.PGUSER || "",
  PG_PASSWORD: env.PG_PASSWORD || "",
  PG_HOST: env.PG_HOST || "localhost",
  PG_PORT: toNumber(env.PG_PORT, 5432),
  PG_DATABASE: env.PG_DATABASE || "",

  JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: env.JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: env.JWT_REFRESH_EXPIRES_IN,

  REDIS_HOST: env.REDIS_HOST || "localhost",
  REDIS_PORT: toNumber(env.REDIS_PORT, 6379),

  KAFKA_BROCKERS: env.KAFKA_BROCKERS || "localhost:9092",
  KAFKA_CLIENT_ID: env.KAFKA_CLIENT_ID || "eccommerce-service",
};