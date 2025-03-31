import { CookieOptions } from 'express';

export const DRIZZLE_SYMBOL = Symbol('Drizzle');
export const JWT_SYMBOL = Symbol('JWT');

// Response status
export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
}

// Logging service paths
export enum LoggerPaths {
  UTIL = 'logs/util.log',
  APP = 'logs/app.log',
  DATABASE = 'logs/database.log',
  CLIENT = 'logs/client.log',
}

// Cookie options
let cookie_duration = 7; // days
export const globalCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'none',
  secure: true,
  maxAge: 60 * 60 * 24 * cookie_duration,
};

// Blackbase buckets
export enum B2_BUCKETS {
  media = 'uninav-media',
  docs = 'uninav-docs',
}
