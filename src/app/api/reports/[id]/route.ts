import { db } from "@/db";
import { bilhetes, reports } from "@/db/schema";
import { tituloAutomatico, tituloPadrao } from "@/lib/format";
import { asc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }
  const [report] = await db.select().from(reports).where(eq(reports.id, numId));
  if (!report) {
    return Response.json({ error: "Não encontrado" }, { status: 404 });
  }
  const rows = await db
    .select()
    .from(bilhetes)
    .where(eq(bilhetes.reportId, numId))
    .orderBy(asc(bilhetes.ordem), asc(bilhetes.id));
  return Response.json({ ...report, bilhetes: rows });
}

const CAMPOS_PERMITIDOS = [
  "titulo",
  "status",
  "orgLinha1",
  "orgLinha2",
  "orgLinha3",
  "orgLinha4",
  "orgLinha5",
  "pcdpNumero",
  "pcdpData",
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
  "idaDataHora",
  "voltaDataHora",
  "biAutorizacao",
  "itinerario",
  "eventoInicio",
  "eventoTermino",
  "eventoDescricao",
  "retornoSituacao",
  "retornoData",
  "diariasBi",
  "diariasDias",
  "diariasValor",
  "diariasExtenso",
  "acrescimoSituacao",
  "devolucaoJustificativa",
  "localData",
  "assinatura",
] as const;

interface BilhetePayload {
  tipo: string;
  localizador?: string;
  data?: string;
  trecho?: string;
  cia?: string;
  voo?: string;
  reserva?: string;
  horario?: string;
  ordem?: number;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const update: Record<string, string> = {};
  for (const key of CAMPOS_PERMITIDOS) {
    if (typeof body[key] === "string") update[key] = body[key] as string;
  }

  // Título automático no momento de salvar: "PCDP 013912/26 — NOME DO
  // PROPOSTO" — vale para o padrão antigo ("RVN — PCDP …") e para quando a
  // PCDP/nome chegam depois do relatório já criado.
  const [atual] = await db.select().from(reports).where(eq(reports.id, numId));
  if (atual) {
    const titulo = update.titulo ?? atual.titulo;
    if (tituloAutomatico(titulo)) {
      update.titulo = tituloPadrao(
        update.pcdpNumero ?? atual.pcdpNumero,
        update.nome ?? atual.nome,
      );
    }
  }

  await db
    .update(reports)
    .set({ ...update, updatedAt: new Date() })
    .where(eq(reports.id, numId));

  // Substituição completa das linhas de bilhetes (estratégia simples e consistente)
  if (Array.isArray(body.bilhetes)) {
    await db.delete(bilhetes).where(eq(bilhetes.reportId, numId));
    const rows = (body.bilhetes as BilhetePayload[])
      .filter((b) => typeof b?.tipo === "string")
      .map((b, i) => ({
        reportId: numId,
        tipo: b.tipo,
        localizador: b.localizador ?? "",
        data: b.data ?? "",
        trecho: b.trecho ?? "",
        cia: b.cia ?? "",
        voo: b.voo ?? "",
        reserva: b.reserva ?? "",
        horario: b.horario ?? "",
        ordem: b.ordem ?? i,
      }));
    if (rows.length > 0) await db.insert(bilhetes).values(rows);
  }

  const [report] = await db.select().from(reports).where(eq(reports.id, numId));
  const ticketRows = await db
    .select()
    .from(bilhetes)
    .where(eq(bilhetes.reportId, numId))
    .orderBy(asc(bilhetes.ordem), asc(bilhetes.id));
  return Response.json({ ...report, bilhetes: ticketRows });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }
  await db.delete(reports).where(eq(reports.id, numId));
  return Response.json({ ok: true });
}
