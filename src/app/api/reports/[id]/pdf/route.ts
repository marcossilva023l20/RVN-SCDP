import { db } from "@/db";
import { bilhetes, reports } from "@/db/schema";
import { nomeArquivoPdf } from "@/lib/format";
import { gerarPdfRvn } from "@/lib/pdf-rvn";
import { reportToDraft } from "@/lib/types";
import { asc, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Brasão em data URI (lido uma vez por instância). */
let brasaoCache: string | null = null;
async function lerBrasao(): Promise<string> {
  if (brasaoCache !== null) return brasaoCache;
  try {
    const arquivo = path.join(
      process.cwd(),
      "public",
      "images",
      "brasao-republica.png",
    );
    const bytes = await readFile(arquivo);
    brasaoCache = `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    brasaoCache = "";
  }
  return brasaoCache;
}

/**
 * Mesmo PDF do botão "Gerar PDF", agora a partir do relatório SALVO —
 * é este arquivo que o botão "Imprimir" abre (o documento sai igual ao do
 * PDF, em A4, com texto vetorial).
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

  const draft = { ...reportToDraft({ ...report, bilhetes: rows }), id: numId };
  const pdf = await gerarPdfRvn(draft, await lerBrasao());
  const nome = nomeArquivoPdf(draft.pcdpNumero, draft.nome);
  const nomeAscii = nome.replace(/[^\x20-\x7E]/g, "-");
  const baixar = req.nextUrl.searchParams.get("download") === "1";

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename="${nomeAscii}"; filename*=UTF-8''${encodeURIComponent(nome)}`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "no-store",
    },
  });
}
