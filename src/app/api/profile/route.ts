import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let [profile] = await db.select().from(profiles).limit(1);
  if (!profile) {
    [profile] = await db.insert(profiles).values({}).returning();
  }
  return Response.json(profile);
}

const CAMPOS = [
  "orgLinha1",
  "orgLinha2",
  "orgLinha3",
  "orgLinha4",
  "orgLinha5",
  "tipoBeneficiario",
  "nome",
  "om",
  "postoCargo",
  "cpf",
  "banco",
  "agencia",
  "conta",
  "email",
  "identidade",
] as const;

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const update: Record<string, string> = {};
  for (const key of CAMPOS) {
    if (typeof body[key] === "string") update[key] = body[key] as string;
  }

  let [profile] = await db.select().from(profiles).limit(1);
  if (!profile) {
    [profile] = await db.insert(profiles).values(update).returning();
  } else {
    [profile] = await db
      .update(profiles)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(profiles.id, profile.id))
      .returning();
  }
  return Response.json(profile);
}
