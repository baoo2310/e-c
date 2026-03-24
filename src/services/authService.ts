import { pool } from '../config/db';
import bcrypt from 'bcrypt';
import { userData } from '../types/user';
import { ApiError } from '../utils/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import { publishEvent } from './kafkaService';
import { USER_EVENTS_TOPIC } from '../config/kafka';

type PostgresError = {
  code?: string;
  message?: string;
  detail?: string;
};

const mapDatabaseError = (error: unknown) => {
  const dbError = error as PostgresError;
  console.error('[DB ERROR]', {
    code: dbError.code,
    message: dbError.message,
    detail: dbError.detail,
  });

  if (dbError.code === '23505') {
    return new ApiError(StatusCodes.CONFLICT, 'Username or email is already registered');
  }

  return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Database error');
};

export const createUser = async (userData: userData) => {
  try {
    // 1. Hash the formatted password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // 2. Prepare the SQL query
    const query = `
    INSERT INTO users (username, email, password, first_name, last_name)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, username, email, first_name, last_name, created_at;
  `;
    const values = [
      userData.username,
      userData.email,
      hashedPassword,
      userData.first_name,
      userData.last_name
    ];

    // 3. Execute and return
    const result = await pool.query(query, values);
    const newUser = result.rows[0];

    await publishEvent(USER_EVENTS_TOPIC, 'USER-REGISTERED', {
      userId: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      timestamp: new Date().toISOString()
    });
    return newUser;
  } catch (error) {
    throw mapDatabaseError(error);
  }

};

export const findUserByEmail = async (email: string) => {
  try {
    const query = `
    SELECT id, username, email, password, first_name, last_name, created_at
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;

    const result = await pool.query(query, [email]);
    return result.rows[0];
  } catch (error) {
    throw mapDatabaseError(error);
  }

};
