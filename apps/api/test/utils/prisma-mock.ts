/**
 * Mock Prisma in-memory pour les tests e2e/unit (lane QA-Security).
 *
 * Objectif : exécuter la VRAIE logique des services/guards NestJS sans base
 * Postgres, tout en gardant un comportement suffisamment proche du client
 * Prisma pour valider l'isolation multi-tenant.
 *
 * Delegates supportés par modèle : findUnique, findFirst, findMany, create,
 * createMany, update, updateMany, upsert, delete, deleteMany, count.
 * `where` : égalité plate + opérateurs simples (equal, in, not, AND/OR).
 * `include` / `select` sont ignorés (l'enregistrement complet est renvoyé),
 * ce qui suffit aux assertions de sécurité (jamais de fuite cross-compte).
 *
 * IMPORTANT sécurité : si un service oublie de filtrer par `accountId`, le mock
 * renverra quand même l'enregistrement d'un autre compte — c'est exactement
 * ce que les specs d'isolation cherchent à détecter (le test échoue = fuite).
 */

type Row = Record<string, any>;

const MODELS = [
  'user',
  'profile',
  'account',
  'membership',
  'invitation',
  'reliefMission',
  'service',
  'booking',
  'conversation',
  'message',
  'review',
  'notification',
  'invoice',
  'document',
] as const;

type ModelName = (typeof MODELS)[number];

function cuid(prefix = 'c'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function matchWhere(row: Row, where?: Row): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, cond]) => {
    if (key === 'AND') {
      return (cond as Row[]).every((c) => matchWhere(row, c));
    }
    if (key === 'OR') {
      return (cond as Row[]).some((c) => matchWhere(row, c));
    }
    if (key === 'NOT') {
      return !matchWhere(row, cond as Row);
    }
    const value = row[key];
    if (cond !== null && typeof cond === 'object') {
      if ('equals' in cond) return value === cond.equals;
      if ('not' in cond) return value !== cond.not;
      if ('in' in cond) return (cond.in as any[]).includes(value);
      if ('notIn' in cond) return !(cond.notIn as any[]).includes(value);
      if ('gt' in cond) return value > cond.gt;
      if ('gte' in cond) return value >= cond.gte;
      if ('lt' in cond) return value < cond.lt;
      if ('lte' in cond) return value <= cond.lte;
      if ('contains' in cond)
        return typeof value === 'string' && value.includes(cond.contains);
      return false;
    }
    return value === cond;
  });
}

function applyOrder(rows: Row[], orderBy?: Row | Row[]): Row[] {
  if (!orderBy) return rows;
  const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const clause of clauses) {
      const [field, dir] = Object.entries(clause)[0] as [string, 'asc' | 'desc'];
      if (a[field] === b[field]) continue;
      const cmp = a[field] > b[field] ? 1 : -1;
      return dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

function makeDelegate(store: Map<string, Row[]>, model: ModelName) {
  const rows = () => store.get(model)!;
  const now = () => new Date();

  const delegate = {
    findUnique: jest.fn(async ({ where }: any) =>
      rows().find((r) => matchWhere(r, where)) ?? null,
    ),
    findFirst: jest.fn(async ({ where, orderBy }: any = {}) =>
      applyOrder(rows().filter((r) => matchWhere(r, where)), orderBy)[0] ?? null,
    ),
    findMany: jest.fn(async ({ where, orderBy, take, skip }: any = {}) => {
      let result = rows().filter((r) => matchWhere(r, where));
      result = applyOrder(result, orderBy);
      if (skip) result = result.slice(skip);
      if (take) result = result.slice(0, take);
      return result;
    }),
    create: jest.fn(async ({ data }: any) => {
      const row: Row = {
        id: data.id ?? cuid(model.slice(0, 3)),
        createdAt: now(),
        updatedAt: now(),
        ...data,
      };
      rows().push(row);
      return row;
    }),
    createMany: jest.fn(async ({ data }: any) => {
      const list = Array.isArray(data) ? data : [data];
      for (const d of list) {
        rows().push({ id: d.id ?? cuid(model.slice(0, 3)), createdAt: now(), updatedAt: now(), ...d });
      }
      return { count: list.length };
    }),
    update: jest.fn(async ({ where, data }: any) => {
      const row = rows().find((r) => matchWhere(r, where));
      if (!row) {
        const err: any = new Error('Record to update not found.');
        err.code = 'P2025';
        throw err;
      }
      Object.assign(row, data, { updatedAt: now() });
      return row;
    }),
    updateMany: jest.fn(async ({ where, data }: any) => {
      const matched = rows().filter((r) => matchWhere(r, where));
      matched.forEach((r) => Object.assign(r, data, { updatedAt: now() }));
      return { count: matched.length };
    }),
    upsert: jest.fn(async ({ where, create, update }: any) => {
      const row = rows().find((r) => matchWhere(r, where));
      if (row) {
        Object.assign(row, update, { updatedAt: now() });
        return row;
      }
      const created: Row = { id: cuid(model.slice(0, 3)), createdAt: now(), updatedAt: now(), ...create };
      rows().push(created);
      return created;
    }),
    delete: jest.fn(async ({ where }: any) => {
      const idx = rows().findIndex((r) => matchWhere(r, where));
      if (idx === -1) {
        const err: any = new Error('Record to delete does not exist.');
        err.code = 'P2025';
        throw err;
      }
      return rows().splice(idx, 1)[0];
    }),
    deleteMany: jest.fn(async ({ where }: any = {}) => {
      const before = rows().length;
      const kept = rows().filter((r) => !matchWhere(r, where));
      store.set(model, kept);
      return { count: before - kept.length };
    }),
    count: jest.fn(async ({ where }: any = {}) =>
      rows().filter((r) => matchWhere(r, where)).length,
    ),
  };
  return delegate;
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;

export function createPrismaMock() {
  const store = new Map<string, Row[]>();
  MODELS.forEach((m) => store.set(m, []));

  const client: any = {
    $store: store,
    $connect: jest.fn(async () => undefined),
    $disconnect: jest.fn(async () => undefined),
    $transaction: jest.fn(async (arg: any) => {
      if (typeof arg === 'function') return arg(client);
      return Promise.all(arg);
    }),
    onModuleInit: jest.fn(async () => undefined),
    enableShutdownHooks: jest.fn(),
    /** Vide toutes les tables (à appeler en beforeEach). */
    $reset() {
      MODELS.forEach((m) => store.set(m, []));
    },
    /** Injecte des lignes brutes sans passer par create(). */
    $seed(model: ModelName, records: Row[]) {
      store.get(model)!.push(...records.map((r) => ({ createdAt: new Date(), updatedAt: new Date(), ...r })));
    },
  };

  MODELS.forEach((m) => {
    client[m] = makeDelegate(store, m);
  });

  return client as {
    [K in ModelName]: ReturnType<typeof makeDelegate>;
  } & {
    $store: Map<string, Row[]>;
    $reset(): void;
    $seed(model: ModelName, records: Row[]): void;
    $connect: jest.Mock;
    $disconnect: jest.Mock;
    $transaction: jest.Mock;
  };
}
