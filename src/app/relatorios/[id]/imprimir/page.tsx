import { DeclaracaoExtravio, localDeclaracao, temDeclaracao } from "@/components/declaracao";
import { RvnDocument } from "@/components/document";
import { PrintBar } from "@/components/print-bar";
import { db } from "@/db";
import { bilhetes, reports } from "@/db/schema";
import { comLocalData, comPadroes } from "@/lib/padroes";
import { nomeArquivoDeclaracao, nomeArquivoPdf } from "@/lib/pdf";
import { reportToDraft } from "@/lib/types";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ImprimirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();

  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, numId));
  if (!report) notFound();

  const rows = await db
    .select()
    .from(bilhetes)
    .where(eq(bilhetes.reportId, numId))
    .orderBy(asc(bilhetes.ordem), asc(bilhetes.id));

  // O documento impresso mostra os mesmos valores padrão do editor, para o
  // papel e o PDF saírem iguais ao que está na tela.
  const draft = comLocalData(comPadroes(reportToDraft({ ...report, bilhetes: rows })));

  // Declaração de Extravio: disponível quando a seção 9 está preenchida.
  const comDeclaracao = temDeclaracao(draft);

  return (
    <div className="rvn-print-reset min-h-screen bg-paper-deep/60 py-24">
      <PrintBar
        id={numId}
        nomeArquivo={nomeArquivoPdf(draft.pcdpNumero, draft.nome)}
        temDeclaracaoRelatorio={comDeclaracao}
        nomeArquivoDeclaracao={nomeArquivoDeclaracao(
          draft.pcdpNumero,
          draft.nome,
        )}
      />
      <main className="rvn-print-reset px-4">
        <div id="rvn-paper" className="rvn-paper mx-auto">
          <RvnDocument draft={draft} />
        </div>
      </main>
      {/* Documento da Declaração, fora da tela (o botão gera o PDF dele e ele
          não entra na impressão desta página). */}
      {comDeclaracao && (
        <div
          aria-hidden
          className="rvn-hide-print"
          style={{
            position: "fixed",
            top: 0,
            left: "-10000px",
            zIndex: -1,
            width: "21cm",
            background: "#ffffff",
          }}
        >
          <div
            id="rvn-declaracao"
            style={{ width: "19cm", margin: "0 auto", background: "#ffffff" }}
          >
            <DeclaracaoExtravio
              draft={draft}
              local={localDeclaracao(draft.localData)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
