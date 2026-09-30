import { montaLocalData } from "@/lib/format";
import type { ReportDraft } from "@/lib/types";

/**
 * Valores que já vêm preenchidos no relatório.
 *
 * São os dados que quase sempre são os mesmos no 3º BEC — assim o relatório
 * nasce pronto e só precisam ser trocados quando houver mudança (basta editar
 * o campo normalmente; nada aqui sobrescreve o que a pessoa digitou).
 */
export const PADROES = {
  /** OM do beneficiário (seção 2) */
  om: "3º BEC",
  /** 6. Diárias — BI que publicou a concessão */
  diariasBi: "Não é o caso",
  /** 8. Bilhetes devolvidos — justificativa */
  devolucaoJustificativa: "Não houve",
  /** Cidade/UF usada no gerador de "Local e data" */
  cidadeUf: "Picos/PI",
} as const;

const vazio = (v: string | undefined) => !v?.trim();

/**
 * Data de hoje (AAAA-MM-DD) no fuso de Brasília.
 *
 * O fuso fixo faz o servidor (que roda em UTC) e o navegador chegarem à mesma
 * data — sem isso, à noite o documento sairia com o dia seguinte.
 */
export function hojeIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Frase de "Local e data" montada com a Cidade/UF padrão e a data informada
 * (hoje, quando não informada): "Quartel em Picos/PI, 30 de setembro de 2026."
 */
export function localDataPadrao(iso: string = hojeIso()): string {
  return montaLocalData(PADROES.cidadeUf, iso);
}

/**
 * Completa com os valores padrão apenas os campos que estão em branco.
 * Qualquer valor já existente (digitado, importado do SCDP ou vindo do
 * perfil) é preservado.
 */
export function comPadroes(draft: ReportDraft): ReportDraft {
  return {
    ...draft,
    om: vazio(draft.om) ? PADROES.om : draft.om,
    diariasBi: vazio(draft.diariasBi) ? PADROES.diariasBi : draft.diariasBi,
    devolucaoJustificativa: vazio(draft.devolucaoJustificativa)
      ? PADROES.devolucaoJustificativa
      : draft.devolucaoJustificativa,
  };
}

/**
 * "Local e data" para documentos que não passaram pelo editor (ex.: um
 * relatório antigo aberto direto na impressão): monta a frase quando o campo
 * está em branco. No editor quem monta é o próprio navegador, para usar a data
 * de quem está preenchendo.
 */
export function comLocalData(draft: ReportDraft, iso?: string): ReportDraft {
  return vazio(draft.localData)
    ? { ...draft, localData: localDataPadrao(iso) }
    : draft;
}
