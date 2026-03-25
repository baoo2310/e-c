import { REGEX } from './regex.js';

export const formatters = {
  formatEmail: (email: string): string => {
    const trimmed = email.trim().toLowerCase();
    // Double-check format before returning (Safety first)
    return REGEX.EMAIL.test(trimmed) ? trimmed : email;
  },
  
  formatPassword: (password: string): string => {
    return password.trim();
  }
};

export const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};