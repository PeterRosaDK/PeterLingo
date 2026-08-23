import { createRemoteJWKSet, jwtVerify } from 'jose';
import { parseAttempt } from '../../src/sync/attemptValidation';
import type { Attempt } from '../../src/learning/types';

interface Env {
  DB?: D1Database;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  ALLOWED_EMAIL?: string;
}

interface AttemptRow {
  payload: string;
}

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_ATTEMPTS = 50_000;
const MAX_ATTEMPT_BYTES = 65_536;
const INSERT_BATCH_SIZE = 100;

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function normalizedTeamDomain(value: string): string {
  return value.replace(/^https:\/\//, '').replace(/\/$/, '');
}

async function authorize(request: Request, env: Env): Promise<boolean> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const audience = env.ACCESS_AUD;
  const allowedEmail = env.ALLOWED_EMAIL?.trim().toLowerCase();
  if (!token || !teamDomain || !audience || !allowedEmail) return false;

  const domain = normalizedTeamDomain(teamDomain);
  try {
    const jwks = createRemoteJWKSet(new URL(`https://${domain}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://${domain}`,
      audience,
    });
    return typeof payload.email === 'string' && payload.email.toLowerCase() === allowedEmail;
  } catch {
    return false;
  }
}

function parseRequestBody(value: unknown): Attempt[] {
  if (
    !value ||
    typeof value !== 'object' ||
    !Array.isArray((value as { attempts?: unknown }).attempts)
  ) {
    throw new Error('Forespørgslen mangler attempts.');
  }
  const candidates = (value as { attempts: unknown[] }).attempts;
  if (candidates.length > MAX_ATTEMPTS) throw new Error('For mange forsøg i én synkronisering.');
  return candidates.map((candidate) => {
    const serialized = JSON.stringify(candidate);
    if (serialized.length > MAX_ATTEMPT_BYTES) throw new Error('Et forsøg er for stort.');
    return parseAttempt(candidate);
  });
}

async function insertAttempts(db: D1Database, attempts: Attempt[]): Promise<void> {
  for (let offset = 0; offset < attempts.length; offset += INSERT_BATCH_SIZE) {
    const statements = attempts.slice(offset, offset + INSERT_BATCH_SIZE).map((attempt) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO attempts (owner, id, attempted_at, payload)
           VALUES ('primary', ?1, ?2, ?3)`
        )
        .bind(attempt.id, attempt.attemptedAt, JSON.stringify(attempt))
    );
    if (statements.length > 0) await db.batch(statements);
  }
}

async function loadAttempts(db: D1Database): Promise<Attempt[]> {
  const result = await db
    .prepare(
      `SELECT payload FROM attempts
       WHERE owner = 'primary'
       ORDER BY attempted_at ASC, id ASC`
    )
    .all<AttemptRow>();
  return result.results.map((row) => parseAttempt(JSON.parse(row.payload)));
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.ALLOWED_EMAIL) {
    return json({ error: 'Cloudsynkronisering er ikke konfigureret.' }, 503);
  }
  if (!(await authorize(request, env))) return json({ error: 'Login kræves.' }, 401);

  const expectedOrigin = new URL(request.url).origin;
  if (
    request.headers.get('Origin') !== expectedOrigin ||
    request.headers.get('X-PeterLingo-Intent') !== 'sync-v1'
  ) {
    return json({ error: 'Forespørgslen blev afvist.' }, 403);
  }
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
    return json({ error: 'Content-Type skal være application/json.' }, 415);
  }

  const declaredLength = Number(request.headers.get('Content-Length') ?? '0');
  if (declaredLength > MAX_BODY_BYTES) return json({ error: 'Forespørgslen er for stor.' }, 413);

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return json({ error: 'Forespørgslen kunne ikke læses.' }, 400);
  }
  if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
    return json({ error: 'Forespørgslen er for stor.' }, 413);
  }

  let attempts: Attempt[];
  try {
    attempts = parseRequestBody(JSON.parse(bodyText));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Ugyldige data.' }, 400);
  }

  try {
    await insertAttempts(env.DB, attempts);
    return json({ attempts: await loadAttempts(env.DB), serverTime: new Date().toISOString() });
  } catch {
    return json({ error: 'Synkronisering kunne ikke gennemføres.' }, 500);
  }
};
