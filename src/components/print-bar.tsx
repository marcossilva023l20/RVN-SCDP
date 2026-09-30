"use client";

import { BotaoGerarPdf } from "@/components/botao-pdf";
import type { ReportDraft } from "@/lib/types";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

export function PrintBar({
  id,
  draft,
  nomeArquivo,
}: {
  id: number;
  draft: ReportDraft;
  nomeArquivo: string;
}) {
  return (
    <div className="no-print fixed inset-x-0 top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href={`/relatorios/${id}`}
          className="flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao editor
        </Link>
        <p className="hidden text-xs text-ink-soft lg:block">
          O PDF sai em folha <strong>A4</strong>, com as margens do modelo.
        </p>
        <div className="flex items-center gap-2">
          <BotaoGerarPdf
            draft={draft}
            nomeArquivo={nomeArquivo}
            rotulo="Gerar PDF"
            className="flex items-center gap-2 rounded-full border border-pine/30 bg-white px-4 py-2.5 text-sm font-semibold text-pine transition-colors hover:bg-pine/5 disabled:opacity-60"
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pine-deep hover:shadow-md active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
