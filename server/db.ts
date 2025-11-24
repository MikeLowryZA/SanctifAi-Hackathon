import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { createLyricsCacheTable } from "./lyrics/index";

// Lazy database connection - returns null if DATABASE_URL not set
export function getDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
}

// Export a singleton instance for convenience
let _db: ReturnType<typeof getDb> | null = null;
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(target, prop) {
    if (!_db) {
      _db = getDb();
    }
    if (!_db) {
      throw new Error("DATABASE_URL not configured - database operations unavailable");
    }
    return (_db as any)[prop];
  }
});

// Initialize lyrics cache table on startup (only if DATABASE_URL is set)
export async function initializeLyricsCache() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set – skipping lyrics cache initialization");
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await createLyricsCacheTable(sql);
  } catch (error) {
    console.error("Failed to initialize lyrics cache:", error);
  }
}

