import { PrintBar } from "@/components/print-bar";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { nomeArquivoPdf } from "@/lib/format";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Impressão: mostra o PDF gerado pelo app (o mesmo do botão "Gerar PDF") no
 * visualizador do navegador. Antes esta tela reimprimia a página HTML — o
 * layout do papel ficava por conta do navegador; agora o documento impresso
 * é exatamente o arquivo pronto.
 */
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

  const nomeArquivo = nomeArquivoPdf(report.pcdpNumero, report.nome);

  return (
    <div className="flex h-screen flex-col bg-paper-deep/60">
      <PrintBar id={numId} nomeArquivo={nomeArquivo} />
      <iframe
        src={`/api/reports/${numId}/pdf`}
        title={`Documento — ${nomeArquivo}`}
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
