"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

export function PrintBar({ id }: { id: number }) {
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
        <p className="hidden text-xs text-ink-soft sm:block">
          Configure a impressora como <strong>A4</strong> · margens padrão · e
          escolha <strong>“Salvar como PDF”</strong> para anexar ao SCDP.
        </p>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pine-deep hover:shadow-md active:scale-[0.98]"
        >
          <Printer className="h-4 w-4" />
          Imprimir / Salvar PDF
        </button>
      </div>
    </div>
  );
}
