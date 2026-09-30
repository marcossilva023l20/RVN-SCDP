import { ORG_LINHAS_PADRAO } from "@/lib/org";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/*
 * Cabeçalho institucional: as 5 linhas seguem o padrão do 3º Batalhão de
 * Engenharia de Construção (em `@/lib/org`), editáveis por perfil/relatório
 * para o caso de outra OM.
 */
const cabecalho = {
  orgLinha1: text("org_linha1").notNull().default(ORG_LINHAS_PADRAO.orgLinha1),
  orgLinha2: text("org_linha2").notNull().default(ORG_LINHAS_PADRAO.orgLinha2),
  orgLinha3: text("org_linha3").notNull().default(ORG_LINHAS_PADRAO.orgLinha3),
  orgLinha4: text("org_linha4").notNull().default(ORG_LINHAS_PADRAO.orgLinha4),
  orgLinha5: text("org_linha5").notNull().default(ORG_LINHAS_PADRAO.orgLinha5),
};

/**
 * Perfil do beneficiário + cabeçalho da OM.
 * Guardado uma única vez e reutilizado em cada novo relatório.
 */
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  // Cabeçalho do documento (5 linhas, como no modelo oficial)
  ...cabecalho,
  // Beneficiário
  tipoBeneficiario: text("tipo_beneficiario").notNull().default("militar"), // militar | civil | colaborador
  nome: text("nome").notNull().default(""),
  om: text("om").notNull().default(""),
  postoCargo: text("posto_cargo").notNull().default(""),
  cpf: text("cpf").notNull().default(""),
  banco: text("banco").notNull().default(""),
  agencia: text("agencia").notNull().default(""),
  conta: text("conta").notNull().default(""),
  email: text("email").notNull().default(""),
  identidade: text("identidade").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Relatório de Viagem Nacional (RVN) — espelha o modelo oficial do SCDP.
 */
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull().default(""),
  status: text("status").notNull().default("rascunho"), // rascunho | finalizado

  // Cabeçalho (cópia do perfil no momento da criação, editável por relatório)
  ...cabecalho,

  // 1. PCDP
  pcdpNumero: text("pcdp_numero").notNull().default(""),
  pcdpData: text("pcdp_data").notNull().default(""),

  // 2. Beneficiário
  tipoBeneficiario: text("tipo_beneficiario").notNull().default("militar"),
  nome: text("nome").notNull().default(""),
  om: text("om").notNull().default(""),
  postoCargo: text("posto_cargo").notNull().default(""),
  cpf: text("cpf").notNull().default(""),
  banco: text("banco").notNull().default(""),
  agencia: text("agencia").notNull().default(""),
  conta: text("conta").notNull().default(""),
  email: text("email").notNull().default(""),
  identidade: text("identidade").notNull().default(""),

  // 3. Afastamento da sede
  idaDataHora: text("ida_data_hora").notNull().default(""),
  voltaDataHora: text("volta_data_hora").notNull().default(""),
  biAutorizacao: text("bi_autorizacao").notNull().default(""),
  itinerario: text("itinerario").notNull().default(""),

  // 4. Evento
  eventoInicio: text("evento_inicio").notNull().default(""),
  eventoTermino: text("evento_termino").notNull().default(""),
  eventoDescricao: text("evento_descricao").notNull().default(""),

  // 5. Retorno do afastamento da sede
  // prevista | restituicao | complementacao | nao_ocorreu
  retornoSituacao: text("retorno_situacao").notNull().default("prevista"),
  retornoData: text("retorno_data").notNull().default(""),

  // 6. Diárias
  diariasBi: text("diarias_bi").notNull().default(""),
  diariasDias: text("diarias_dias").notNull().default(""),
  diariasValor: text("diarias_valor").notNull().default(""),
  diariasExtenso: text("diarias_extenso").notNull().default(""),

  // 7. Acréscimo de embarque e desembarque
  // nao_utilizou | utilizou | em_parte | oficial_particular
  acrescimoSituacao: text("acrescimo_situacao").notNull().default("nao_utilizou"),

  // 8. Bilhetes não utilizados
  devolucaoJustificativa: text("devolucao_justificativa").notNull().default(""),

  // Assinatura
  localData: text("local_data").notNull().default(""), // "Quartel em Picos/PI, 25 de setembro de 2024."
  assinatura: text("assinatura").notNull().default(""), // "NOME – POSTO"

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Bilhetes (tabelas das seções 8 e 9).
 * tipo: "nao_utilizado" (seção 8) | "utilizado" (seção 9 — canhotos)
 */
export const bilhetes = pgTable("bilhetes", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // nao_utilizado | utilizado
  localizador: text("localizador").notNull().default(""), // s8
  data: text("data").notNull().default(""), // ambos
  trecho: text("trecho").notNull().default(""), // ambos
  cia: text("cia").notNull().default(""), // ambos
  voo: text("voo").notNull().default(""), // s8 (Nº voo)
  reserva: text("reserva").notNull().default(""), // s9 (Reserva)
  horario: text("horario").notNull().default(""), // ambos
  ordem: integer("ordem").notNull().default(0),
});

export type Profile = typeof profiles.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Bilhete = typeof bilhetes.$inferSelect;
