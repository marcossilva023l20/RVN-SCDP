"use client";

import { useEffect } from "react";

/** Área útil de uma folha A4 com as margens do modelo (1,6cm topo, 1,8cm pé). */
const ALTURA_UTIL_MM = 297 - 16 - 18; // 263mm
/** Alvo com 3mm de folga: o corte da folha nunca encosta no texto. */
const ALTURA_ALVO_MM = ALTURA_UTIL_MM - 3;
const PX_POR_MM = 96 / 25.4; // 1px CSS = 1/96in

/**
 * Mantém o relatório inteiro em UMA folha ao imprimir.
 *
 * O RVN é um formulário de uma página: se o texto cresce um pouco (uma linha
 * a mais na seção 9, por exemplo), sobrava uma faixa para a 2ª folha e a
 * assinatura ficava órfã. Aqui o documento é medido e, quando passa da altura
 * útil, recebe a redução mínima necessária — publicada na variável CSS
 * `--rvn-escala-impressao`, usada só no `@media print`.
 *
 * A redução é limitada a 20%: se o conteúdo for muito maior que uma folha,
 * é melhor imprimir em duas páginas (com a assinatura sempre junto do
 * local/data) do que devolver um documento ilegível.
 */
export function AjusteDeImpressao() {
  useEffect(() => {
    const ajustar = () => {
      const artigo = document
        .getElementById("rvn-paper")
        ?.querySelector("article");
      if (!artigo) return;

      // offsetHeight é o tamanho de LAYOUT (não muda com o zoom do preview)
      const alturaPx = artigo.offsetHeight;
      const utilPx = ALTURA_ALVO_MM * PX_POR_MM;
      const fator =
        alturaPx > utilPx + 1
          ? Math.max(0.8, utilPx / alturaPx)
          : 1;

      document.documentElement.style.setProperty(
        "--rvn-escala-impressao",
        fator === 1 ? "" : String(Number(fator.toFixed(4))),
      );
    };

    ajustar();

    const artigo = document
      .getElementById("rvn-paper")
      ?.querySelector("article");
    if (!artigo) {
      // o documento ainda pode aparecer depois (ex.: carregamento)
      const t = window.setTimeout(ajustar, 800);
      return () => window.clearTimeout(t);
    }

    const observador = new ResizeObserver(ajustar);
    observador.observe(artigo);
    window.addEventListener("resize", ajustar);
    return () => {
      observador.disconnect();
      window.removeEventListener("resize", ajustar);
      document.documentElement.style.removeProperty("--rvn-escala-impressao");
    };
  }, []);

  return null;
}
