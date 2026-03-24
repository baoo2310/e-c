import { Pool } from "pg";
import { ENV } from "./env.js";

export const pool = new Pool({
    user: ENV.PGUSER,
    host: ENV.PG_HOST,
    database: ENV.PG_DATABASE,
    password: ENV.PG_PASSWORD,
    port: ENV.PG_PORT,
});