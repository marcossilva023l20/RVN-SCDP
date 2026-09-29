import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "";

// Bancos locais (sandbox/docker) não usam SSL; bancos hospedados
// (Neon, Supabase, Railway, Render) exigem SSL.
const isLocal = /localhost|127\.0\.0\.1/.test(url);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url,
    ssl: isLocal ? undefined : "require",
  },
});
