import { RvnDocument } from "@/components/document";
import { PrintBar } from "@/components/print-bar";
import { db } from "@/db";
import { bilhetes, reports } from "@/db/schema";
import { nomeArquivoPdf } from "@/lib/pdf";
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

  const draft = reportToDraft({ ...report, bilhetes: rows });

  return (
    <div className="rvn-print-reset min-h-screen bg-paper-deep/60 py-24">
      <PrintBar
        id={numId}
        nomeArquivo={nomeArquivoPdf(draft.pcdpNumero, draft.nome)}
      />
      <main className="rvn-print-reset px-4">
        <div id="rvn-paper" className="rvn-paper mx-auto">
          <RvnDocument draft={draft} />
        </div>
      </main>
    </div>
  );
}
