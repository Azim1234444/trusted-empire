import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleVisitor } from '../lib/visitors.ts';

const origin = 'https://example.test';

function setup() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../drizzle/0002_flowery_nitro.sql', import.meta.url), 'utf8'));
  const DB = {
    prepare(query) {
      return {
        bind(...values) {
          const statement = sql.prepare(query);
          return {
            async run() { return statement.run(...values); },
            async first() { return statement.get(...values) ?? null; },
          };
        },
        async first() { return sql.prepare(query).get() ?? null; },
      };
    },
  };
  return { sql, env: { DB, SITE_ORIGIN: origin, STOREFRONT_ORIGIN: 'https://shop.test' } };
}

function request(id, source = origin) {
  return new Request(`${origin}/api/visitors`, {
    method: 'POST',
    headers: { Origin: source, 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId: id }),
  });
}

test('counts each browser ID once and returns the shared total', async () => {
  const { sql, env } = setup();
  try {
    const first = crypto.randomUUID();
    const second = crypto.randomUUID();
    assert.deepEqual(await (await handleVisitor(request(first), env)).json(), { total: 1 });
    assert.deepEqual(await (await handleVisitor(request(first, 'https://shop.test'), env)).json(), { total: 1 });
    assert.deepEqual(await (await handleVisitor(request(second), env)).json(), { total: 2 });
  } finally { sql.close(); }
});

test('rejects unknown origins and malformed IDs', async () => {
  const { sql, env } = setup();
  try {
    assert.equal((await handleVisitor(request(crypto.randomUUID(), 'https://other.test'), env)).status, 403);
    assert.equal((await handleVisitor(request('not-an-id'), env)).status, 400);
    assert.equal(sql.prepare('SELECT COUNT(*) AS total FROM visitors').get().total, 0);
  } finally { sql.close(); }
});
