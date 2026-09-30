"use client";

import { gerarPdfA4, type ModoPdf } from "@/lib/pdf";
import { FileDown, Loader2, Printer } from "lucide-react";
import { useState, type ComponentType } from "react";

/**
 * Botão que monta o documento A4 no próprio navegador (sem depender do
 * servidor) em dois modos:
 *
 * - "baixar" (padrão): gera e baixa o PDF — botão "Gerar PDF";
 * - "imprimir": gera o MESMO PDF e o abre já com o diálogo de impressão —
 *   o papel sai idêntico ao arquivo baixado.
 */
export function BotaoGerarPdf({
  obterAlvo,
  nomeArquivo,
  className,
  rotulo,
  modo = "baixar",
  antes,
  icone: IconePersonalizado,
  dica,
}: {
  obterAlvo: () => HTMLElement | null;
  nomeArquivo: string;
  className?: string;
  rotulo?: string;
  modo?: ModoPdf;
  /** chamado antes de gerar (ex.: salvar o relatório) */
  antes?: () => void | Promise<void>;
  /** ícone próprio (padrão: arquivo para baixar, impressora ao imprimir) */
  icone?: ComponentType<{ className?: string }>;
  /** texto do balão de ajuda */
  dica?: string;
}) {
  const [estado, setEstado] = useState<"parado" | "gerando" | "erro">("parado");
  const imprimir = modo === "imprimir";
  const Icone = IconePersonalizado ?? (imprimir ? Printer : FileDown);

  const gerar = async () => {
    const alvo = obterAlvo();
    if (!alvo || estado === "gerando") return;
    setEstado("gerando");
    try {
      await antes?.();
      await gerarPdfA4(alvo, nomeArquivo, modo);
      setEstado("parado");
    } catch (erro) {
      console.error("Falha ao gerar o PDF:", erro);
      setEstado("erro");
    }
  };

  const titulo =
    estado === "erro"
      ? "Não foi possível gerar o PDF — use Ctrl+P e escolha Salvar como PDF."
      : (dica ??
        (imprimir
          ? "Abre o MESMO documento do “Gerar PDF”, pronto para imprimir"
          : "Baixar o relatório em PDF, em folha A4"));

  return (
    <button
      type="button"
      onClick={gerar}
      disabled={estado === "gerando"}
      title={titulo}
      className={className}
    >
      {estado === "gerando" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icone className="h-4 w-4" />
      )}
      {estado === "gerando"
        ? imprimir
          ? "Preparando impressão…"
          : "Gerando PDF…"
        : estado === "erro"
          ? "Tentar de novo"
          : (rotulo ?? (imprimir ? "Imprimir" : "Gerar PDF"))}
    </button>
  );
}
