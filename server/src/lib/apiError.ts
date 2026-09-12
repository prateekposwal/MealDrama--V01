/**
 * APIError — leaf module (no imports) so route modules can throw it WITHOUT
 * pulling the whole express app (server/src/index) into vitest, where the
 * CJS `require('./routes/...')` calls cannot resolve. index.ts re-exports it
 * so every existing `import { APIError } from '../index'` keeps working.
 */
export class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}
