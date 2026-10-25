import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "codeloom";

if (!uri) throw new Error("MONGODB_URI is required. Add it to your environment before starting CodeLoom.");

declare global {
  // eslint-disable-next-line no-var
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

const clientPromise = global.mongoClientPromise ?? new MongoClient(uri).connect();
if (process.env.NODE_ENV !== "production") global.mongoClientPromise = clientPromise;

export async function db(): Promise<Db> {
  return (await clientPromise).db(databaseName);
}

export async function ensureIndexes() {
  const database = await db();
  await Promise.all([
    database.collection("users").createIndex({ email: 1 }, { unique: true }),
    database.collection("rooms").createIndex({ joinCode: 1 }, { unique: true }),
    database.collection("roomMembers").createIndex({ roomId: 1, userId: 1 }, { unique: true }),
    database.collection("roomEvents").createIndex({ roomId: 1, version: 1 }, { unique: true }),
    database.collection("rateLimits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}
