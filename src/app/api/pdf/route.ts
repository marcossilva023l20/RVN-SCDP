import type { ReportDraft } from "@/lib/types";
import { gerarPdfRvn } from "@/lib/pdf-rvn";
import { nomeArquivoPdf } from "@/lib/format";
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
    const arquivo = path.join(process.cwd(), "public", "images", "brasao-republica.png");
    const bytes = await readFile(arquivo);
    brasaoCache = `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    brasaoCache = ""; // sem o brasão o documento ainda é gerado
  }
  return brasaoCache;
}

/**
 * PDF do relatório em texto vetorial (A4). Recebe o rascunho atual do editor
 * — inclusive alterações ainda não salvas — e devolve o arquivo pronto.
 */
export async function POST(req: NextRequest) {
  const corpo = (await req.json().catch(() => ({}))) as {
    draft?: ReportDraft;
  };
  const draft = corpo.draft;
  if (!draft || typeof draft !== "object") {
    return Response.json({ error: "Rascunho ausente" }, { status: 400 });
  }

  try {
    const pdf = await gerarPdfRvn(draft, await lerBrasao());
    const nome = nomeArquivoPdf(draft.pcdpNumero, draft.nome);
    // Cabeçalho HTTP só aceita ASCII: nome sem acentos + nome real (RFC 5987)
    const nomeAscii = nome.replace(/[^\x20-\x7E]/g, "-");
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nomeAscii}"; filename*=UTF-8''${encodeURIComponent(nome)}`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (erro) {
    console.error("Falha ao gerar o PDF:", erro);
    return Response.json({ error: "Não foi possível gerar o PDF" }, { status: 500 });
  }
}
