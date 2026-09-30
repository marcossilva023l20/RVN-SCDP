/**
 * Geração do PDF do RVN em TEXTO VETORIAL (nada de imagem).
 *
 * Mesmo conteúdo do documento da tela (`@/components/document`), montado com
 * as primitivas do @react-pdf/renderer: folha A4 exata (595,28 × 841,89 pt),
 * margens do modelo (1,6cm topo · 1cm laterais · 1,8cm pé) e Times New Roman
 * (fonte padrão do PDF, métrica idêntica), com acentuação correta.
 *
 * A grade de 15 colunas do modelo é distribuída na largura útil de 19cm,
 * como na impressão. As bordas são desenhadas uma única vez por linha da
 * grade (topo + esquerda; a última célula fecha a direita e a última linha
 * fecha a base), evitando a linha dupla entre células vizinhas.
 */
import { cabecalhoEmLinhas, semAspasExternas } from "@/lib/org";
import type { ReportDraft } from "@/lib/types";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
  type DocumentProps,
} from "@react-pdf/renderer";
import { createElement, type ReactNode } from "react";

/* ---------- medidas (pontos; 1cm = 28,3465pt) ---------- */

const A4 = { largura: 595.28, altura: 841.89 };
const MARGEM = { topo: 45.35, lados: 28.35, pe: 51.02 }; // 1,6cm · 1cm · 1,8cm
const CONTEUDO = A4.largura - MARGEM.lados * 2; // 538,58pt (19cm)
const BORDA = 1.05; // espessura do modelo oficial

/** Larguras da grade original do modelo (cm) — total 19,512cm */
const COLS_CM = [
  2.129, 0.993, 1.136, 0.621, 2.646, 1.074, 0.206, 0.889, 0.64, 2.688, 0.268,
  1.221, 1.115, 0.642, 3.244,
];
const TOTAL_CM = COLS_CM.reduce((a, b) => a + b, 0);

/** Largura (em %) de um bloco de `span` colunas a partir da posição `inicio`. */
function largura(inicio: number, span: number): string {
  const cm = COLS_CM.slice(inicio, inicio + span).reduce((a, b) => a + b, 0);
  return `${((cm / TOTAL_CM) * 100).toFixed(4)}%`;
}

const est = StyleSheet.create({
  pagina: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    lineHeight: 1.35,
    color: "#000000",
    paddingTop: MARGEM.topo,
    paddingHorizontal: MARGEM.lados,
    paddingBottom: MARGEM.pe,
  },
  cabecalho: { textAlign: "center", lineHeight: 1.2 },
  brasao: { width: 42.52, height: 42.52, marginHorizontal: "auto", marginBottom: 2.8 },
  linhaCabecalho: { fontWeight: "bold" },
  espacador: { fontSize: 8 },
  titulo: { fontWeight: "bold", fontSize: 11 },
  linha: { flexDirection: "row", flexWrap: "nowrap" },
  linhaComQuebra: { flexDirection: "row", flexWrap: "wrap" },
  celula: {
    borderTopWidth: BORDA,
    borderLeftWidth: BORDA,
    borderColor: "#000000",
    paddingHorizontal: 3.49, // 0,123cm
    justifyContent: "center",
  },
  celulaFim: { borderRightWidth: BORDA },
  celulaBase: { borderBottomWidth: BORDA },
  texto: { margin: 0 },
  negrito: { fontWeight: "bold" },
  justificado: { textAlign: "justify" },
  centralizado: { textAlign: "center" },
  italico: { fontStyle: "italic" },
});

/* ---------- primitivas ---------- */

/** Checkbox literal do modelo: "( X )" quando marcado, "(   )" quando não. */
function cb(checked: boolean, texto: string): string {
  return `(\u00A0${checked ? "X" : "\u00A0\u00A0"}\u00A0) ${texto}`;
}

function Kv({ label, value }: { label: string; value?: string }) {
  return (
    <Text style={est.texto}>
      <Text style={est.negrito}>{label} </Text>
      {value ?? ""}
    </Text>
  );
}

type CelulaDef = { span: number; node: ReactNode };

/** Linha da grade: distribui as células nas 15 colunas do modelo. */
function Linha({
  cells,
  quebra = false,
  base = false,
}: {
  cells: CelulaDef[];
  /** permite a linha atravessar páginas (textos longos) */
  quebra?: boolean;
  /** fecha a base da tabela (última linha do documento) */
  base?: boolean;
}) {
  let offset = 0;
  const restantes = [...cells];
  return (
    <View style={est.linha} wrap={!quebra}>
      {restantes.map((c, i) => {
        const w = largura(offset, c.span);
        offset += c.span;
        const ultima = i === restantes.length - 1;
        return (
          <View
            key={i}
            style={[
              est.celula,
              { width: w },
              ...(ultima ? [est.celulaFim] : []),
              ...(base && ultima ? [est.celulaBase] : []),
            ]}
          >
            {c.node}
          </View>
        );
      })}
    </View>
  );
}

const FullRow = ({
  node,
  base,
  quebra = true,
}: {
  node: ReactNode;
  base?: boolean;
  /** textos longos podem atravessar páginas (padrão das linhas de largura total) */
  quebra?: boolean;
}) => <Linha cells={[{ span: 15, node }]} base={base} quebra={quebra} />;

/** Tabela interna (seções 8 e 9): grade própria dentro de uma célula. */
function TabelaInterna({
  colunas,
  linhas,
}: {
  colunas: Array<{ span: number; label: string }>;
  linhas: string[][];
}) {
  const celulaInterna = (span: number, node: ReactNode, i: number, ultimaColuna: boolean, ultimaLinha: boolean) => (
    <View
      key={i}
      style={[
        est.celula,
        { width: largura(colunas.slice(0, i).reduce((a, c) => a + c.span, 0), span) },
        ...(ultimaColuna ? [est.celulaFim] : []),
        ...(ultimaLinha ? [est.celulaBase] : []),
      ]}
    >
      {node}
    </View>
  );
  return (
    <View minPresenceAhead={30}>
      <View style={est.linha} wrap={false}>
        {colunas.map((c, i) =>
          celulaInterna(
            c.span,
            <Text style={[est.texto, est.centralizado, est.negrito]}>{c.label}</Text>,
            i,
            i === colunas.length - 1,
            false,
          ),
        )}
      </View>
      {linhas.map((linha, li) => (
        <View key={li} style={est.linha} wrap={false}>
          {linha.map((v, i) =>
            celulaInterna(
              colunas[i]?.span ?? 1,
              <Text style={[est.texto, est.centralizado]}>{v || "\u00A0"}</Text>,
              i,
              i === colunas.length - 1,
              li === linhas.length - 1,
            ),
          )}
        </View>
      ))}
    </View>
  );
}

/* ---------- documento ---------- */

export function RvnPdf({
  draft,
  brasao,
}: {
  draft: ReportDraft;
  /** PNG do brasão em data URI (lido do /public no servidor) */
  brasao?: string;
}) {
  const linhasCabecalho = cabecalhoEmLinhas(draft);

  const retornoOps = [
    { value: "prevista", label: "na data prevista." },
    {
      value: "restituicao",
      label: `em ${draft.retornoData || "___/___/______"}, havendo necessidade da restituição do valor recebido a mais.`,
    },
    {
      value: "complementacao",
      label: `em ${draft.retornoData || "___/___/______"}, havendo necessidade de complementação das diárias.`,
    },
    {
      value: "nao_ocorreu",
      label:
        "não ocorreu o afastamento da sede, havendo necessidade da restituição na integralidade das diárias.",
    },
  ];
  const acrescimoOps = [
    { value: "nao_utilizou", label: "não foi utilizado veículo oficial." },
    { value: "utilizou", label: "foi utilizado veículo oficial." },
    { value: "em_parte", label: "foi utilizado veículo oficial, em parte da viagem." },
    {
      value: "oficial_particular",
      label: "foi utilizado veículo oficial ou particular para afastar-se da sede.",
    },
  ];

  const naoUtilizados = draft.bilhetes.filter((b) => b.tipo === "nao_utilizado");
  const utilizados = draft.bilhetes.filter((b) => b.tipo === "utilizado");
  const linhas8 = naoUtilizados.length
    ? naoUtilizados.map((b) => [b.localizador, b.data, b.trecho, b.cia, b.voo, b.horario])
    : [["", "", "", "", "", ""]];
  const linhas9 = utilizados.length
    ? utilizados.map((b) => [b.data, b.trecho, b.cia, b.reserva, b.horario])
    : [["", "", "", "", ""]];

  return (
    <Document
      title={`Relatório de Viagem Nacional${draft.pcdpNumero ? ` — PCDP ${draft.pcdpNumero}` : ""}`}
      author={draft.nome || "RVN Fácil"}
      creator="RVN Fácil"
      producer="RVN Fácil"
    >
      <Page size={[A4.largura, A4.altura]} style={est.pagina}>
        {/* ===== Cabeçalho ===== */}
        <View style={est.cabecalho}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image do
              @react-pdf/renderer não aceita alt; o brasão é decorativo */}
          {brasao ? <Image src={brasao} style={est.brasao} /> : null}
          {linhasCabecalho.map((l, i) => (
            <Text key={i} style={[est.texto, est.linhaCabecalho]}>
              {i === 4 ? `“${semAspasExternas(l)}”` : l}
            </Text>
          ))}
          <Text style={[est.texto, est.espacador]}> </Text>
          <Text style={[est.texto, est.titulo]}>RELATÓRIO DE VIAGEM NACIONAL</Text>
        </View>

        {/* ===== 1. PCDP ===== */}
        <Linha
          cells={[
            {
              span: 15,
              node: (
                <Text style={est.texto}>
                  <Text style={est.negrito}>
                    1. Relatório de Viagem Nacional / PCDP:{" "}
                  </Text>
                  {draft.pcdpNumero}
                  {draft.pcdpData ? ` - ${draft.pcdpData}` : ""}
                </Text>
              ),
            },
          ]}
        />

        {/* ===== 2. Beneficiário ===== */}
        <Linha
          cells={[
            { span: 4, node: <Text style={[est.texto, est.negrito]}>2. Beneficiário</Text> },
            {
              span: 4,
              node: (
                <Text style={est.texto}>
                  {cb(draft.tipoBeneficiario === "militar", "Militar")}
                </Text>
              ),
            },
            {
              span: 4,
              node: (
                <Text style={est.texto}>
                  {cb(draft.tipoBeneficiario === "civil", "Servidor Civil")}
                </Text>
              ),
            },
            {
              span: 3,
              node: (
                <Text style={est.texto}>
                  {cb(draft.tipoBeneficiario === "colaborador", "Colaborador Eventual")}
                </Text>
              ),
            },
          ]}
        />
        <Linha
          cells={[
            { span: 9, node: <Kv label="Nome:" value={draft.nome.toUpperCase()} /> },
            { span: 6, node: <Kv label="OM:" value={draft.om} /> },
          ]}
        />
        <Linha
          cells={[
            { span: 9, node: <Kv label="Posto/Grad/Cargo:" value={draft.postoCargo} /> },
            { span: 6, node: <Kv label="CPF:" value={draft.cpf} /> },
          ]}
        />
        <Linha
          cells={[
            { span: 5, node: <Kv label="Banco:" value={draft.banco} /> },
            { span: 6, node: <Kv label="Agência:" value={draft.agencia} /> },
            { span: 4, node: <Kv label="Conta corrente:" value={draft.conta} /> },
          ]}
        />
        <Linha
          cells={[
            { span: 11, node: <Kv label="E-mail:" value={draft.email} /> },
            { span: 4, node: <Kv label="Idt:" value={draft.identidade} /> },
          ]}
        />

        {/* ===== 3. Afastamento da sede ===== */}
        <FullRow node={<Text style={[est.texto, est.negrito]}>3. Afastamento da sede</Text>} />
        <Linha
          cells={[
            { span: 9, node: <Kv label="Ida: (data/hora):" value={draft.idaDataHora} /> },
            { span: 6, node: <Kv label="Volta: (data/hora):" value={draft.voltaDataHora} /> },
          ]}
        />
        <FullRow
          node={
            <Kv
              label="BI que publicou a autorização para o afastamento:"
              value={draft.biAutorizacao}
            />
          }
        />
        <FullRow
          node={
            <Kv
              label="Itinerário completo compreendendo as cidades da missão:"
              value={draft.itinerario}
            />
          }
        />

        {/* ===== 4. Evento ===== */}
        <FullRow node={<Text style={[est.texto, est.negrito]}>4. Evento</Text>} />
        <Linha
          cells={[
            { span: 9, node: <Kv label="Início (data/hora):" value={draft.eventoInicio} /> },
            { span: 6, node: <Kv label="Término (data/hora):" value={draft.eventoTermino} /> },
          ]}
        />
        <FullRow
          node={
            <Text style={[est.texto, est.justificado]}>
              <Text style={est.negrito}>Evento: </Text>
              {draft.eventoDescricao}
            </Text>
          }
        />

        {/* ===== 5. Retorno ===== */}
        <FullRow
          node={
            <>
              <Text style={[est.texto, est.negrito]}>
                5. Quanto a data do afastamento da sede o retorno foi:
              </Text>
              {retornoOps.map((o) => (
                <Text key={o.value} style={est.texto}>
                  {cb(draft.retornoSituacao === o.value, o.label)}
                </Text>
              ))}
            </>
          }
        />

        {/* ===== 6. Diárias ===== */}
        <FullRow node={<Text style={[est.texto, est.negrito]}>6. Diárias</Text>} />
        <FullRow
          node={
            <Text style={[est.texto, est.justificado]}>
              <Text>BI que publicou a concessão de diárias: </Text>
              {draft.diariasBi}
            </Text>
          }
        />
        <Linha
          cells={[
            { span: 6, node: <Kv label="Nº de dias de afastamento:" value={draft.diariasDias} /> },
            { span: 5, node: <Text style={est.texto}> </Text> },
            { span: 4, node: <Text style={est.texto}> </Text> },
          ]}
        />
        <FullRow
          node={<Kv label="Valor total das diárias recebidas:" value={draft.diariasValor} />}
        />
        <FullRow
          node={
            <Kv
              label="Valor total das diárias recebidas (por extenso):"
              value={draft.diariasExtenso}
            />
          }
        />

        {/* ===== 7. Acréscimo ===== */}
        <FullRow
          node={
            <>
              <Text style={[est.texto, est.negrito]}>
                7. Quanto ao acréscimo de embarque e desembarque:
              </Text>
              {acrescimoOps.map((o) => (
                <Text key={o.value} style={est.texto}>
                  {cb(draft.acrescimoSituacao === o.value, o.label)}
                </Text>
              ))}
            </>
          }
        />

        {/* ===== 8. Bilhetes não utilizados ===== */}
        <FullRow
          node={
            <>
              <Text style={[est.texto, est.negrito, est.justificado]}>
                8. Quanto à devolução do bilhete de passagem não utilizado:
              </Text>
              <Text style={[est.texto, est.justificado]}>
                Anexos a este relatório estão sendo devolvidos os bilhetes, a
                seguir relacionados:
              </Text>
            </>
          }
        />
        <FullRow
          node={
            <TabelaInterna
              colunas={[
                { span: 1, label: "Localizador" },
                { span: 2, label: "Data" },
                { span: 4, label: "Trecho" },
                { span: 3, label: "Cia/Transportadora" },
                { span: 4, label: "Nº voo" },
                { span: 1, label: "Horário" },
              ]}
              linhas={linhas8}
            />
          }
        />
        <FullRow
          node={
            <Text style={[est.texto, est.justificado]}>
              <Text>Justificativa: </Text>
              {draft.devolucaoJustificativa}
            </Text>
          }
        />

        {/* ===== 9. Canhotos ===== */}
        <FullRow
          node={
            <Text style={[est.texto, est.negrito, est.justificado]}>
              9. Quanto à entrega dos canhotos dos cartões de embarque e bilhetes
              utilizados:
            </Text>
          }
        />
        <FullRow
          node={
            <TabelaInterna
              colunas={[
                { span: 2, label: "Data" },
                { span: 5, label: "Trecho" },
                { span: 4, label: "Cia/Transportadora" },
                { span: 2, label: "Reserva" },
                { span: 2, label: "Horário" },
              ]}
              linhas={linhas9}
            />
          }
        />

        {/* ===== Local/data e assinatura ===== */}
        <Linha
          base
          cells={[
            {
              span: 15,
              node: (
                <View style={[est.centralizado, { paddingTop: 8, paddingBottom: 2 }]}>
                  <Text style={est.texto}>{draft.localData || " "}</Text>
                  <Text style={est.texto}> </Text>
                  <Text style={est.texto}> </Text>
                  <Text style={[est.texto, est.negrito]}>
                    {draft.assinatura ||
                      (draft.nome
                        ? `${draft.nome.toUpperCase()}${
                            draft.postoCargo
                              ? ` – ${draft.postoCargo.toUpperCase()}`
                              : ""
                          }`
                        : " ")}
                  </Text>
                </View>
              ),
            },
          ]}
        />
      </Page>
    </Document>
  );
}

/** Gera o PDF (Buffer) do relatório informado. */
export async function gerarPdfRvn(
  draft: ReportDraft,
  brasao?: string,
): Promise<Buffer> {
  const elemento = createElement(RvnPdf, { draft, brasao }) as React.ReactElement<
    DocumentProps
  >;
  return renderToBuffer(elemento);
}
