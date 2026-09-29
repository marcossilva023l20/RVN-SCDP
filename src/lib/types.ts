import type { Bilhete, Profile, Report } from "@/db/schema";

export type { Bilhete, Profile, Report };

export interface ReportWithBilhetes extends Report {
  bilhetes: Bilhete[];
}

export const TIPOS_BENEFICIARIO = [
  { value: "militar", label: "Militar" },
  { value: "civil", label: "Servidor Civil" },
  { value: "colaborador", label: "Colaborador Eventual" },
] as const;

export const RETORNO_OPCOES = [
  { value: "prevista", label: "na data prevista." },
  {
    value: "restituicao",
    label: "em ___/___/______, havendo necessidade da restituição do valor recebido a mais.",
  },
  {
    value: "complementacao",
    label: "em ___/___/______, havendo necessidade de complementação das diárias.",
  },
  {
    value: "nao_ocorreu",
    label:
      "não ocorreu o afastamento da sede, havendo necessidade da restituição na integralidade das diárias.",
  },
] as const;

export const ACRESCIMO_OPCOES = [
  { value: "nao_utilizou", label: "não foi utilizado veículo oficial." },
  { value: "utilizou", label: "foi utilizado veículo oficial." },
  { value: "em_parte", label: "foi utilizado veículo oficial, em parte da viagem." },
  {
    value: "oficial_particular",
    label: "foi utilizado veículo oficial ou particular para afastar-se da sede.",
  },
] as const;

/** Campos editáveis de um relatório (usado no PATCH e no editor). */
export interface ReportDraft {
  titulo: string;
  status: string;
  orgLinha1: string;
  orgLinha2: string;
  orgLinha3: string;
  orgLinha4: string;
  orgLinha5: string;
  pcdpNumero: string;
  pcdpData: string;
  tipoBeneficiario: string;
  nome: string;
  om: string;
  postoCargo: string;
  cpf: string;
  banco: string;
  agencia: string;
  conta: string;
  email: string;
  identidade: string;
  idaDataHora: string;
  voltaDataHora: string;
  biAutorizacao: string;
  itinerario: string;
  eventoInicio: string;
  eventoTermino: string;
  eventoDescricao: string;
  retornoSituacao: string;
  retornoData: string;
  diariasBi: string;
  diariasDias: string;
  diariasValor: string;
  diariasExtenso: string;
  acrescimoSituacao: string;
  devolucaoJustificativa: string;
  localData: string;
  assinatura: string;
  bilhetes: Array<{
    id?: number;
    tipo: string;
    localizador: string;
    data: string;
    trecho: string;
    cia: string;
    voo: string;
    reserva: string;
    horario: string;
    ordem: number;
  }>;
}

export function reportToDraft(r: ReportWithBilhetes): ReportDraft {
  return {
    titulo: r.titulo,
    status: r.status,
    orgLinha1: r.orgLinha1,
    orgLinha2: r.orgLinha2,
    orgLinha3: r.orgLinha3,
    orgLinha4: r.orgLinha4,
    orgLinha5: r.orgLinha5,
    pcdpNumero: r.pcdpNumero,
    pcdpData: r.pcdpData,
    tipoBeneficiario: r.tipoBeneficiario,
    nome: r.nome,
    om: r.om,
    postoCargo: r.postoCargo,
    cpf: r.cpf,
    banco: r.banco,
    agencia: r.agencia,
    conta: r.conta,
    email: r.email,
    identidade: r.identidade,
    idaDataHora: r.idaDataHora,
    voltaDataHora: r.voltaDataHora,
    biAutorizacao: r.biAutorizacao,
    itinerario: r.itinerario,
    eventoInicio: r.eventoInicio,
    eventoTermino: r.eventoTermino,
    eventoDescricao: r.eventoDescricao,
    retornoSituacao: r.retornoSituacao,
    retornoData: r.retornoData,
    diariasBi: r.diariasBi,
    diariasDias: r.diariasDias,
    diariasValor: r.diariasValor,
    diariasExtenso: r.diariasExtenso,
    acrescimoSituacao: r.acrescimoSituacao,
    devolucaoJustificativa: r.devolucaoJustificativa,
    localData: r.localData,
    assinatura: r.assinatura,
    bilhetes: r.bilhetes.map((b) => ({
      id: b.id,
      tipo: b.tipo,
      localizador: b.localizador,
      data: b.data,
      trecho: b.trecho,
      cia: b.cia,
      voo: b.voo,
      reserva: b.reserva,
      horario: b.horario,
      ordem: b.ordem,
    })),
  };
}
