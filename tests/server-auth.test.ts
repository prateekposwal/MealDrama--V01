import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { makeApp, listen } from './server-test-utils';

const SECRET = 'test-device-secret-123456';
const HASH = bcrypt.hashSync(SECRET, 10);

// Hoisted before the router import (the router pulls `../lib/prisma`).
vi.mock('../server/src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userProfile: { create: vi.fn() },
  },
  connectWithRetry: vi.fn(),
}));

// eslint-disable-next-line import/first
import authRouter from '../server/src/routes/auth';
// eslint-disable-next-line import/first
import { prisma } from '../server/src/lib/prisma';

interface MockUserModel {
  findUnique: Mock;
  findFirst: Mock;
  create: Mock;
  update: Mock;
}
interface MockProfileModel { create: Mock; }

const mUser = prisma.user as unknown as MockUserModel;
const mProfile = prisma.userProfile as unknown as MockProfileModel;

const existingUser = (id: string) => ({
  id,
  name: 'Kamala',
  email: null,
  phone: null,
  deviceSecret: HASH,
});

let server: ReturnType<express.Express['listen']>;
let base: string;

beforeAll(async () => {
  const run = await listen(makeApp([['/api/v1/auth', authRouter]]));
  server = run.server;
  base = run.base + '/api/v1/auth';
});

afterAll(() => new Promise<void>(r => server.close(() => r())));

beforeEach(() => {
  vi.clearAllMocks();
  mUser.findUnique.mockResolvedValue(null);
  mUser.findFirst.mockResolvedValue(null);
  mUser.update.mockResolvedValue({});
  mUser.create.mockImplementation(u => Promise.resolve({
    id: String(u?.data?.id ?? 'user-1'),
    name: u?.data?.name ?? null,
    email: u?.data?.email ?? null,
    phone: u?.data?.phone ?? null,
  }));
  mProfile.create.mockResolvedValue({ id: 'profile-1', userId: 'user-1' });
});

async function api(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; json: any }> {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

describe('POST /register', () => {
  it('creates a new device-bound guest account (201, token, no email credential)', async () => {
    mUser.findUnique.mockResolvedValue(null);
    mUser.findFirst.mockResolvedValue(null);
    mUser.create.mockResolvedValue({ id: 'user-1', name: 'Kamala', email: null, phone: null });

    const { status, json } = await api('/register', { id: 'user-1', name: 'Kamala', deviceSecret: SECRET });

    expect(status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.user.id).toBe('user-1');
    expect(typeof json.data.token).toBe('string');
    expect(json.data.user.email).toBeNull();
    expect(mProfile.create).toHaveBeenCalledWith({ data: { userId: 'user-1' } });
  });

  it('rejects a missing id (400 VALIDATION_ERROR)', async () => {
    const { status, json } = await api('/register', { id: '', deviceSecret: SECRET });
    expect(status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a short deviceSecret (400 VALIDATION_ERROR)', async () => {
    const { status, json } = await api('/register', { id: 'user-9', deviceSecret: 'short' });
    expect(status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('self-heals an existing account when the device secret matches (200)', async () => {
    const user = existingUser('user-2');
    mUser.findUnique.mockResolvedValue(user);
    mUser.update.mockResolvedValue(user);

    const { status, json } = await api('/register', { id: 'user-2', name: 'Kamala', deviceSecret: SECRET });

    expect(status).toBe(200);
    expect(json.success).toBe(true);
    expect(typeof json.data.token).toBe('string');
    expect(mUser.update).not.toHaveBeenCalled(); // name unchanged
  });

  it('never issues a token to an account whose secret is wrong (401 DEVICE_NOT_VERIFIED)', async () => {
    mUser.findUnique.mockResolvedValue(existingUser('user-3'));

    const { status, json } = await api('/register', { id: 'user-3', deviceSecret: 'wrong-secret-not-16c' });
    expect(status).toBe(401);
    expect(json.error.code).toBe('DEVICE_NOT_VERIFIED');
  });

  it('rejects claiming an identity linked to another account (409 IDENTITY_CONFLICT)', async () => {
    mUser.findUnique.mockResolvedValue(null);
    mUser.findFirst.mockResolvedValue({ id: 'other-user', email: 'kamala@x.dev' });

    const { status, json } = await api('/register', { id: 'user-4', email: 'kamala@x.dev', deviceSecret: SECRET });
    expect(status).toBe(409);
    expect(json.error.code).toBe('IDENTITY_CONFLICT');
  });
});

describe('POST /login', () => {
  it('requires an identity field (400)', async () => {
    const { status, json } = await api('/login', { deviceSecret: SECRET });
    expect(status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('issues a token only after secret verification (200)', async () => {
    mUser.findFirst.mockResolvedValue({ ...existingUser('user-5'), profile: null });

    const { status, json } = await api('/login', { email: 'kamala@x.dev', phone: null, deviceSecret: SECRET });
    expect(status).toBe(200);
    expect(json.data.user.id).toBe('user-5');
    expect(typeof json.data.token).toBe('string');
  });

  it('keeps unknown and unverified accounts under the same 401 envelope (no user enumeration)', async () => {
    mUser.findFirst.mockResolvedValue(null);
    const unknown = await api('/login', { email: 'ghost@x.dev', deviceSecret: SECRET });
    mUser.findFirst.mockResolvedValue(existingUser('user-6'));
    const wrong = await api('/login', { email: 'kamala@x.dev', deviceSecret: 'wrong-secret-not-16c' });

    expect(unknown.status).toBe(401);
    expect(unknown.json.error.code).toBe('DEVICE_NOT_VERIFIED');
    expect(wrong.status).toBe(401);
    expect(wrong.json.error.code).toBe('DEVICE_NOT_VERIFIED');
  });
});

describe('POST /refresh', () => {
  it('rotates a valid token', async () => {
    const issued = await api('/register', { id: 'user-7', deviceSecret: SECRET });
    const first = issued.json.data.token;

    const { status, json } = await api('/refresh', { token: first });
    expect(status).toBe(200);
    // The rotated token must keep the subject and carry a FRESH valid expiry.
    // (The pre-fix route threw by re-signing the decoded payload with exp.)
    const payload = JSON.parse(Buffer.from(json.data.token.split('.')[1], 'base64url').toString('utf8'));
    expect(payload.userId).toBe('user-7');
    expect(payload.exp - payload.iat).toBe(7 * 24 * 60 * 60);
  });

  it('rejects a missing or bogus token', async () => {
    const missing = await api('/refresh', {});
    expect(missing.status).toBe(400);
    expect(missing.json.error.code).toBe('VALIDATION_ERROR');

    const bogus = await api('/refresh', { token: 'not-a-token' });
    expect(bogus.status).toBe(401);
    expect(bogus.json.error.code).toBe('INVALID_TOKEN');
  });
});

describe('GET /me + POST /logout (authMiddleware)', () => {
  async function getMe(token?: string) {
    const res = await fetch(base + '/me', {
      method: 'GET',
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    return { status: res.status, json: await res.json() };
  }

  it('blocks unauthenticated requests (401)', async () => {
    const { status } = await getMe();
    expect(status).toBe(401);

    const { status: bad } = await getMe('garbage-token');
    expect(bad).toBe(401);
  });

  it('returns the user for a valid token', async () => {
    const issued = await api('/register', { id: 'user-8', deviceSecret: SECRET });
    mUser.findUnique.mockResolvedValue({ id: 'user-8', name: 'Kamala', email: null, phone: null, profile: null });

    const { status, json } = await getMe(issued.json.data.token);
    expect(status).toBe(200);
    expect(json.data.user.id).toBe('user-8');
  });

  it('revokes the token on logout', async () => {
    const issued = await api('/register', { id: 'user-9', deviceSecret: SECRET });
    const token = issued.json.data.token;

    const out = await fetch(base + '/logout', { method: 'POST', headers: { authorization: `Bearer ${token}` } });
    expect(out.status).toBe(200);

    const { status } = await getMe(token);
    expect(status).toBe(401);
  });
});



