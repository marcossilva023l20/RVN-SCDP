"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { gerarPdfA4 } from "@/lib/pdf";

/**
 * Botão "Gerar PDF": monta o arquivo A4 no próprio navegador e baixa.
 * Sem diálogo de impressão e sem depender do servidor.
 */
export function BotaoGerarPdf({
  obterAlvo,
  nomeArquivo,
  className,
  rotulo = "Gerar PDF",
}: {
  obterAlvo: () => HTMLElement | null;
  nomeArquivo: string;
  className?: string;
  rotulo?: string;
}) {
  const [estado, setEstado] = useState<"parado" | "gerando" | "erro">("parado");

  const gerar = async () => {
    const alvo = obterAlvo();
    if (!alvo || estado === "gerando") return;
    setEstado("gerando");
    try {
      await gerarPdfA4(alvo, nomeArquivo);
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
          ? "Não foi possível gerar o PDF — use “Imprimir / PDF” e escolha Salvar como PDF."
          : "Baixar o relatório em PDF, em folha A4"
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
