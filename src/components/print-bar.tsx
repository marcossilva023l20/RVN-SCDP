"use client";

import { ArrowLeft, Download, ExternalLink, Printer } from "lucide-react";
import Link from "next/link";

/**
 * Barra da tela de impressão. O documento exibido é o MESMO PDF do botão
 * "Gerar PDF" (A4, texto vetorial) — assim o que se imprime é exatamente o
 * documento pronto, sem depender do layout da página.
 */
export function PrintBar({
  id,
  nomeArquivo,
}: {
  id: number;
  nomeArquivo: string;
}) {
  const url = `/api/reports/${id}/pdf`;
  return (
    <div className="no-print border-b border-ink/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link
          href={`/relatorios/${id}`}
          className="flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao editor
        </Link>
        <p className="hidden flex-1 text-xs text-ink-soft lg:block">
          Documento pronto em <strong>A4</strong> — para imprimir, use o ícone
          de impressão do visualizador (ou abra em nova aba).
        </p>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={`${url}?download=1`}
            className="flex items-center gap-2 rounded-full border border-pine/30 bg-white px-4 py-2 text-sm font-semibold text-pine transition-colors hover:bg-pine/5"
          >
            <Download className="h-4 w-4" />
            Baixar PDF
          </a>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-pine/30 bg-white px-4 py-2 text-sm font-semibold text-pine transition-colors hover:bg-pine/5"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir em nova aba
          </a>
          <button
            type="button"
            onClick={() => window.open(url, "_blank", "noopener")}
            title={`Baixar/abrir ${nomeArquivo} para imprimir`}
            className="flex items-center gap-2 rounded-full bg-pine px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pine-deep active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
