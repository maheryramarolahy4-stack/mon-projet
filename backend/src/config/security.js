import { randomBytes } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const configuredSecret = process.env.JWT_SECRET;
const validConfiguredSecret = configuredSecret && configuredSecret.length >= 32 && !configuredSecret.startsWith('replace_this');

if (process.env.NODE_ENV === 'production' && !validConfiguredSecret) {
  throw new Error('En production, configurez JWT_SECRET avec au moins 32 caractères aléatoires.');
}

// Local development works without a committed secret. This temporary key changes on restart.
export const jwtSecret = validConfiguredSecret ? configuredSecret : randomBytes(48).toString('hex');
