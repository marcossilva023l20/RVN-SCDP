import { db } from "@/db";
import { bilhetes, profiles, reports } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(reports).orderBy(desc(reports.updatedAt));
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const fromId = body.fromId ? Number(body.fromId) : null;

  // Base: perfil salvo (dados do beneficiário + cabeçalho)
  const [profile] = await db.select().from(profiles).limit(1);

  let base: Record<string, unknown> = {
    titulo: "Relatório sem título",
    orgLinha1: profile?.orgLinha1 ?? "MINISTÉRIO DA DEFESA",
    orgLinha2: profile?.orgLinha2 ?? "EXÉRCITO BRASILEIRO",
    orgLinha3: profile?.orgLinha3 ?? "",
    orgLinha4: profile?.orgLinha4 ?? "",
    orgLinha5: profile?.orgLinha5 ?? "",
    tipoBeneficiario: profile?.tipoBeneficiario ?? "militar",
    nome: profile?.nome ?? "",
    om: profile?.om ?? "",
    postoCargo: profile?.postoCargo ?? "",
    cpf: profile?.cpf ?? "",
    banco: profile?.banco ?? "",
    agencia: profile?.agencia ?? "",
    conta: profile?.conta ?? "",
    email: profile?.email ?? "",
    identidade: profile?.identidade ?? "",
  };

  let bilhetesCopia: (typeof bilhetes.$inferSelect)[] = [];

  // Duplicar um relatório existente
  if (fromId) {
    const [orig] = await db.select().from(reports).where(eq(reports.id, fromId));
    if (orig) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = orig;
      base = { ...rest, titulo: `${orig.titulo} (cópia)`, status: "rascunho" };
      bilhetesCopia = await db
        .select()
        .from(bilhetes)
        .where(eq(bilhetes.reportId, fromId))
        .orderBy(asc(bilhetes.ordem));
    }
  }

  // Overrides vindos do cliente (ex.: pré-preenchimento do bookmarklet)
  const permitidos = [
    "titulo",
    "pcdpNumero",
    "pcdpData",
    "itinerario",
    "idaDataHora",
    "voltaDataHora",
    "eventoDescricao",
  ] as const;
  for (const key of permitidos) {
    if (typeof body[key] === "string" && body[key]) base[key] = body[key];
  }

  const [created] = await db.insert(reports).values(base).returning();

  if (bilhetesCopia.length > 0) {
    await db.insert(bilhetes).values(
      bilhetesCopia.map((b) => ({
        reportId: created.id,
        tipo: b.tipo,
        localizador: b.localizador,
        data: b.data,
        trecho: b.trecho,
        cia: b.cia,
        voo: b.voo,
        reserva: b.reserva,
        horario: b.horario,
        ordem: b.ordem,
      })),
    );
  }

  return Response.json({ id: created.id });
}
