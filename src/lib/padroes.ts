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
