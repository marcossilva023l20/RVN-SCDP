/**
 * Geração do PDF em A4 direto no navegador (sem diálogo de impressão).
 *
 * O documento é capturado como está na tela — inclusive a sangria da tabela
 * do modelo oficial (a grade de 15 colunas passa 0,591cm para fora da área
 * útil de cada lado). Por isso a captura é feita sobre uma "folha" de 21cm
 * com o conteúdo de 19cm centralizado: a imagem sai exatamente do tamanho de
 * uma folha A4 (210x297mm), com as mesmas margens do @page da impressão
 * (1,6cm no topo, 1cm nas laterais, 1,8cm no pé).
 */

const A4 = {
  larguraMm: 210,
  alturaMm: 297,
  margemTopoMm: 16,
  margemLadosMm: 10,
  margemBaseMm: 18,
  /** largura da área útil do documento (21cm - 1cm de cada lado) */
  conteudoMm: 190,
} as const;

const alturaPaginaMm = A4.alturaMm - A4.margemTopoMm - A4.margemBaseMm; // 263mm

/**
 * Divide a altura total em páginas, cortando sempre na borda de um bloco
 * (fim de linha da tabela, fim de parágrafo…) — nunca no meio de uma linha.
 */
export function calcularFatias(
  cortes: number[],
  alturaTotal: number,
  alturaPagina: number,
): Array<{ inicio: number; fim: number }> {
  const ordenados = [...new Set(cortes)]
    .filter((c) => c > 0 && c < alturaTotal)
    .sort((a, b) => a - b);
  const fatias: Array<{ inicio: number; fim: number }> = [];
  /** distância mínima do topo da página para aceitar um corte (~6mm) */
  const minUtil = 24;
  let inicio = 0;
  let guarda = 0;
  while (inicio < alturaTotal - 1 && guarda < 200) {
    guarda++;
    const limite = inicio + alturaPagina;
    let fim: number;
    if (limite >= alturaTotal) {
      // O que sobrou cabe nesta página: leva até o fim do documento.
      fim = alturaTotal;
    } else {
      const dentro = ordenados.filter((c) => c > inicio + minUtil && c <= limite);
      fim = dentro.length ? dentro[dentro.length - 1] : limite;
    }
    fatias.push({ inicio, fim });
    inicio = fim;
  }
  return fatias;
}

/** "RVN — PCDP 038577-26.pdf" (sem acentos/caracteres proibidos em arquivo). */
export function nomeArquivoPdf(pcdpNumero?: string, nome?: string): string {
  const partes = ["RVN"];
  if (pcdpNumero?.trim()) partes.push(`PCDP ${pcdpNumero.trim()}`);
  else if (nome?.trim()) partes.push(nome.trim());
  else partes.push("Relatorio de Viagem");
  return `${partes.join(" — ").replace(/[/\\:*?"<>|]/g, "-").replace(/\s+/g, " ")}.pdf`;
}

/** "baixar" salva o arquivo; "imprimir" abre o MESMO PDF pronto para impressão. */
export type ModoPdf = "baixar" | "imprimir";

/** "Declaracao de Extravio — PCDP 038577-26.pdf" (nome seguro para arquivo). */
export function nomeArquivoDeclaracao(
  pcdpNumero?: string,
  nome?: string,
): string {
  const partes = ["Declaracao de Extravio"];
  if (pcdpNumero?.trim()) partes.push(`PCDP ${pcdpNumero.trim()}`);
  else if (nome?.trim()) partes.push(nome.trim());
  return `${partes.join(" — ").replace(/[/\\:*?"<>|]/g, "-").replace(/\s+/g, " ")}.pdf`;
}

/**
 * Renderiza `alvo` e monta o PDF A4 com o documento paginado.
 *
 * O documento é sempre o mesmo: em "baixar" o arquivo é salvo; em "imprimir"
 * ele abre no visualizador do navegador já com a ordem de impressão — ou
 * seja, o papel sai idêntico ao arquivo do botão "Gerar PDF".
 *
 * @param alvo elemento do documento (normalmente o `.rvn-paper`)
 * @param nomeArquivo nome do arquivo (com .pdf)
 * @param modo baixar (padrão) ou imprimir
 */
export async function gerarPdfA4(
  alvo: HTMLElement,
  nomeArquivo: string,
  modo: ModoPdf = "baixar",
): Promise<void> {
  // Na impressão a aba é aberta AQUI, ainda dentro do clique: os navegadores
  // só deixam abrir janelas durante a ação do usuário, e a montagem do PDF
  // leva alguns instantes. A aba mostra um aviso enquanto isso.
  const janela = modo === "imprimir" ? window.open("", "_blank") : null;
  if (janela) {
    janela.document.title = "Preparando o documento…";
    janela.document.body.style.cssText =
      "margin:0;height:100vh;display:flex;align-items:center;justify-content:center;" +
      "background:#0d150f;color:#edf2ee;font:15px system-ui,-apple-system,sans-serif";
    janela.document.body.textContent = "Montando o documento para impressão…";
  }

  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);

  // 1) Cópia fora da tela, sem escala/tela de preview: quem dá o tamanho da
  //    folha é o PDF (21cm), não o elemento da interface.
  const folha = document.createElement("div");
  folha.setAttribute("aria-hidden", "true");
  Object.assign(folha.style, {
    position: "fixed",
    top: "0",
    left: "-10000px",
    zIndex: "-1",
    width: `${A4.larguraMm}mm`,
    background: "#ffffff",
  });

  const copia = alvo.cloneNode(true) as HTMLElement;
  copia.classList.remove("rvn-paper", "origin-top-left");
  Object.assign(copia.style, {
    width: `${A4.conteudoMm}mm`,
    minHeight: "0",
    margin: "0 auto",
    padding: "0",
    transform: "none",
    boxShadow: "none",
    background: "#ffffff",
  });
  copia.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    img.loading = "eager";
    img.decoding = "sync";
  });
  folha.appendChild(copia);
  document.body.appendChild(folha);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all(
      [...copia.querySelectorAll<HTMLImageElement>("img")].map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((r) => {
              img.onload = () => r();
              img.onerror = () => r();
            }),
      ),
    );

    // 2) Uma folha só: o RVN é um formulário de uma página. Se o texto passou
    //    um pouco da altura útil (ex.: uma linha a mais na seção 9), o
    //    documento é reduzido o mínimo necessário em vez de jogar a assinatura
    //    para a página seguinte. Limite de 20% de redução: em casos extremos,
    //    duas páginas (com o local/data + assinatura sempre juntos) é melhor
    //    do que um documento ilegível.
    const pxPorMmCss = 96 / 25.4;
    const alturaConteudoCss = copia.getBoundingClientRect().height;
    const alturaConteudoMm = alturaConteudoCss / pxPorMmCss;
    const larguraConteudoMm = A4.larguraMm;
    // Fator para o documento inteiro caber em uma folha (nunca menos que 80%,
    // para não devolver um documento ilegível em casos extremos).
    const alturaAlvoMm = alturaPaginaMm - 3; // 3mm de folga até o corte
    const fatorUmaFolha =
      alturaConteudoMm > alturaAlvoMm + 0.5
        ? Math.max(0.8, alturaAlvoMm / alturaConteudoMm)
        : 1;

    const escala = Math.min(
      3,
      Math.max(2, (window.devicePixelRatio || 1) * 1.5),
    );
    const canvas = await html2canvas(folha, {
      scale: escala,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });

    // 3) Paginação: corta nas bordas dos blocos (nunca no meio de uma linha).
    const larguraCss = folha.getBoundingClientRect().width || 1;
    const escalaCss = canvas.width / larguraCss;
    const pxPorMm = canvas.width / A4.larguraMm;
    const alturaPaginaPx = Math.round(alturaPaginaMm * pxPorMm);

    const topo = folha.getBoundingClientRect().top;

    /** Está dentro de um bloco que não pode ser dividido (ex.: a linha da
     *  assinatura)? Então o corte da página não pode passar por aqui — a
     *  quebra fica antes do bloco inteiro, nunca no meio dele. */
    const dentroDeBlocoInquebravel = (el: HTMLElement) => {
      let pai = el.parentElement;
      while (pai && pai !== copia) {
        const estilo = getComputedStyle(pai);
        if (estilo.breakInside === "avoid" || estilo.pageBreakInside === "avoid")
          return true;
        pai = pai.parentElement;
      }
      return false;
    };

    const cortes: number[] = [canvas.height];
    copia.querySelectorAll<HTMLElement>("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      const fim = Math.round((r.bottom - topo) * escalaCss);
      // Blocos inquebráveis (assinatura + local/data): só se corta na borda
      // de fora do bloco, jamais entre as linhas de dentro dele.
      if (!dentroDeBlocoInquebravel(el)) cortes.push(fim);
    });

    const fatias = calcularFatias(cortes, canvas.height, alturaPaginaPx);
    if (!fatias.length) throw new Error("Documento vazio");

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });
    pdf.setProperties({
      title: nomeArquivo.replace(/\.pdf$/i, ""),
      creator: "RVN Fácil",
    });


    if (fatorUmaFolha < 1) {
      // Documento um pouco maior que a folha: sai reduzido, centralizado e
      // inteiro em uma página — a assinatura nunca cai sozinha na seguinte.
      const larguraMm = larguraConteudoMm * fatorUmaFolha;
      const alturaMm = alturaConteudoMm * fatorUmaFolha;
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.92),
        "JPEG",
        (A4.larguraMm - larguraMm) / 2,
        A4.margemTopoMm,
        larguraMm,
        alturaMm,
        undefined,
        "FAST",
      );
    } else {
      fatias.forEach(({ inicio, fim }, i) => {
        const altura = fim - inicio;
        const recorte = document.createElement("canvas");
        recorte.width = canvas.width;
        recorte.height = altura;
        const ctx = recorte.getContext("2d");
        if (!ctx) throw new Error("Canvas indisponível neste navegador");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, recorte.width, recorte.height);
        ctx.drawImage(
          canvas,
          0,
          inicio,
          canvas.width,
          altura,
          0,
          0,
          canvas.width,
          altura,
        );
        if (i > 0) pdf.addPage();
        pdf.addImage(
          recorte.toDataURL("image/jpeg", 0.92),
          "JPEG",
          0,
          A4.margemTopoMm,
          A4.larguraMm,
          altura / pxPorMm,
          undefined,
          "FAST",
        );
      });
    }

    if (modo === "imprimir") {
      // `autoPrint` embute no PDF a ordem de imprimir: o navegador carrega o
      // documento (o mesmo do "Gerar PDF") já mostrando o diálogo de impressão.
      pdf.autoPrint();
      const endereco = String(pdf.output("bloburl"));
      if (janela) janela.location.replace(endereco);
      // Pop-up bloqueado: entrega o arquivo para não perder o documento.
      else pdf.save(nomeArquivo);
    } else {
      pdf.save(nomeArquivo);
    }
  } catch (erro) {
    janela?.close();
    throw erro;
  } finally {
    folha.remove();
  }
}
