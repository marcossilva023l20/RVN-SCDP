"use client";

import type { ReportDraft } from "@/lib/types";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * Botão "Gerar PDF": o rascunho atual (mesmo sem salvar) vai para
 * /api/pdf, que devolve o documento em PDF A4 de TEXTO VETORIAL — nada de
 * imagem: o texto pode ser selecionado e pesquisado, e a impressão sai nítida.
 */
export function BotaoGerarPdf({
  draft,
  nomeArquivo,
  className,
  rotulo = "Gerar PDF",
}: {
  draft: ReportDraft;
  nomeArquivo: string;
  className?: string;
  rotulo?: string;
}) {
  const [estado, setEstado] = useState<"parado" | "gerando" | "erro">("parado");

  const gerar = async () => {
    if (estado === "gerando") return;
    setEstado("gerando");
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (!blob.size) throw new Error("PDF vazio");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setEstado("parado");
    } catch (erro) {
      console.error("Falha ao gerar o PDF:", erro);
      setEstado("erro");
    }
  };

  return (
    <button
      type="button"
      onClick={gerar}
      disabled={estado === "gerando"}
      title={
        estado === "erro"
          ? "Não foi possível gerar o PDF — use “Imprimir / Salvar PDF” e escolha Salvar como PDF."
          : "Baixar o relatório em PDF (texto), em folha A4"
      }
      className={className}
    >
      {estado === "gerando" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {estado === "gerando"
        ? "Gerando PDF…"
        : estado === "erro"
          ? "Tentar de novo"
          : rotulo}
    </button>
  );
}
