import Image from "next/image";
import { cabecalhoEmLinhas, semAspasExternas } from "@/lib/org";
import type { ReportDraft } from "@/lib/types";
import type { CSSProperties, ReactNode } from "react";

/**
 * RÉPLICA FIEL do modelo oficial "RVN - Modelo.odt" (SCDP).
 *
 * Estrutura extraída do arquivo original:
 * - Cabeçalho: brasão da República colorido, centralizado (1,95cm);
 *   5 linhas, Times New Roman 10pt, negrito, centralizadas;
 *   1 linha em branco (8pt); título "RELATÓRIO DE VIAGEM NACIONAL" 11pt negrito.
 *   Linhas em branco recebem o padrão do Batalhão (ver `@/lib/org`).
 * - Corpo: UMA única tabela de 15 colunas (larguras em cm da grade original),
 *   bordas 1.05pt pretas, padding lateral 0.123cm, alinhamento vertical médio.
 * - Rótulos de seção em negrito; campos em 10pt normal; checkboxes literais
 *   "( X )" / "(   )"; tabelas internas (seções 8 e 9) encaixadas na mesma
 *   grade de 15 colunas.
 */

/* Larguras da grade original (cm) — total 19.512cm */
const COLS_CM = [
  2.129, 0.993, 1.136, 0.621, 2.646, 1.074, 0.206, 0.889, 0.64, 2.688, 0.268,
  1.221, 1.115, 0.642, 3.244,
];
const COLS_PCT = COLS_CM.map((w) => `${((w / 19.512) * 100).toFixed(3)}%`);

const cellStyle: CSSProperties = {
  border: "1.05pt solid #000001",
  padding: "0 0.123cm",
  verticalAlign: "middle",
  fontSize: "10pt",
  lineHeight: 1.35,
};

/* ---------- Primitivos ---------- */

/** Checkbox literal do modelo: "( X )" quando marcado, "(   )" quando não. */
function CB({ checked, children }: { checked: boolean; children: ReactNode }) {
  return (
    <>
      ({"\u00A0"}
      {checked ? "X" : "\u00A0\u00A0"}
      {"\u00A0"}) {children}
    </>
  );
}

/** Parágrafo "Rótulo: valor" dentro de uma célula. */
function Kv({
  label,
  value,
  boldLabel = false,
}: {
  label: string;
  value: string;
  boldLabel?: boolean;
}) {
  return (
    <p style={{ margin: 0 }}>
      <span style={boldLabel ? { fontWeight: 700 } : undefined}>{label} </span>
      {value}
    </p>
  );
}

/** Título de seção em negrito (estilo P3 do modelo). */
function SecTitle({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: 0, fontWeight: 700 }} className="break-inside-avoid">
      {children}
    </p>
  );
}

function Cell({
  span,
  children,
  center = false,
}: {
  span: number;
  children: ReactNode;
  center?: boolean;
}) {
  return (
    <td
      colSpan={span}
      style={{
        ...cellStyle,
        textAlign: center ? ("center" as const) : undefined,
      }}
    >
      {children}
    </td>
  );
}

const EmptyCell = () => <span>{"\u00A0"}</span>;

/** Linha de largura total da tabela (15 colunas). */
function FullRow({ children }: { children: ReactNode }) {
  return (
    <tr>
      <Cell span={15}>{children}</Cell>
    </tr>
  );
}

/* ---------- Documento ---------- */

export function RvnDocument({ draft }: { draft: ReportDraft }) {
  const naoUtilizados = draft.bilhetes.filter((b) => b.tipo === "nao_utilizado");
  const utilizados = draft.bilhetes.filter((b) => b.tipo === "utilizado");

  // 5 linhas institucionais, na ordem de impressão; se alguma estiver em
  // branco, entra o padrão do Batalhão.
  const linhasCabecalho = cabecalhoEmLinhas(draft);

  const retornoOps: Array<{ value: string; label: string }> = [
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
    {
      value: "em_parte",
      label: "foi utilizado veículo oficial, em parte da viagem.",
    },
    {
      value: "oficial_particular",
      label:
        "foi utilizado veículo oficial ou particular para afastar-se da sede.",
    },
  ];

  const linhas8 =
    naoUtilizados.length > 0
      ? naoUtilizados
      : [
          {
            localizador: "",
            data: "",
            trecho: "",
            cia: "",
            voo: "",
            horario: "",
          },
        ];
  const linhas9 =
    utilizados.length > 0
      ? utilizados
      : [{ data: "", trecho: "", cia: "", reserva: "", horario: "" }];

  return (
    <article
      className="rvn-doc mx-auto bg-white text-black"
      style={{
        fontFamily: '"Times New Roman", "Liberation Serif", Times, serif',
        fontSize: "10pt",
        lineHeight: 1.35,
      }}
    >
      {/* ===== Cabeçalho (fora da tabela) — 10pt negrito centralizado ===== */}
      <header
        className="text-center"
        style={{ lineHeight: 1.2, breakInside: "avoid" }}
      >
        <Image
          src="/images/brasao-republica.png"
          alt="Brasão da República Federativa do Brasil"
          width={959}
          height={959}
          unoptimized
          preload
          style={{
            display: "block",
            width: "1.95cm",
            height: "1.95cm",
            objectFit: "contain",
            margin: "0 auto 0.15cm",
          }}
        />
        {linhasCabecalho.map((l, i) => (
          <p key={i} style={{ margin: 0, fontWeight: 700, fontSize: "10pt" }}>
            {/* Nome histórico da OM sai entre aspas (como no modelo) */}
            {i === 4 ? `“${semAspasExternas(l)}”` : l}
          </p>
        ))}
        {/* espaçador 8pt */}
        <p style={{ margin: 0, fontSize: "8pt" }}>&nbsp;</p>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "11pt" }}>
          RELATÓRIO DE VIAGEM NACIONAL
        </p>
      </header>

      {/* ===== Tabela única (19.512cm × grade de 15 colunas) ===== */}
      {/* A grade (19,512cm do modelo) é distribuída em 100% da área útil:
          a tabela não invade mais as margens — a sangria de 0,591cm era
          cortada pela impressora e o texto da 1ª coluna saía mutilado. */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          {COLS_PCT.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <tbody>
          {/* 1. PCDP */}
          <FullRow>
            <p style={{ margin: 0 }}>
              <span style={{ fontWeight: 700 }}>
                1. Relatório de Viagem Nacional / PCDP:{" "}
              </span>
              {draft.pcdpNumero}
              {draft.pcdpData && ` - ${draft.pcdpData}`}
            </p>
          </FullRow>

          {/* 2. Beneficiário — linha de seleção em 4 células */}
          <tr>
            <Cell span={4}>
              <SecTitle>2. Beneficiário</SecTitle>
            </Cell>
            <Cell span={4}>
              <p style={{ margin: 0 }}>
                <CB checked={draft.tipoBeneficiario === "militar"}>Militar</CB>
              </p>
            </Cell>
            <Cell span={4}>
              <p style={{ margin: 0 }}>
                <CB checked={draft.tipoBeneficiario === "civil"}>
                  Servidor Civil
                </CB>
              </p>
            </Cell>
            <Cell span={3}>
              <p style={{ margin: 0 }}>
                <CB checked={draft.tipoBeneficiario === "colaborador"}>
                  Colaborador Eventual
                </CB>
              </p>
            </Cell>
          </tr>
          <tr>
            <Cell span={9}>
              <Kv label="Nome:" value={draft.nome.toUpperCase()} />
            </Cell>
            <Cell span={6}>
              <Kv label="OM:" value={draft.om} />
            </Cell>
          </tr>
          <tr>
            <Cell span={9}>
              <Kv label="Posto/Grad/Cargo:" value={draft.postoCargo} />
            </Cell>
            <Cell span={6}>
              <Kv label="CPF:" value={draft.cpf} />
            </Cell>
          </tr>
          <tr>
            <Cell span={5}>
              <Kv label="Banco:" value={draft.banco} />
            </Cell>
            <Cell span={6}>
              <Kv label="Agência:" value={draft.agencia} />
            </Cell>
            <Cell span={4}>
              <Kv label="Conta corrente:" value={draft.conta} />
            </Cell>
          </tr>
          <tr>
            <Cell span={11}>
              <Kv label="E-mail:" value={draft.email} />
            </Cell>
            <Cell span={4}>
              <Kv label="Idt:" value={draft.identidade} />
            </Cell>
          </tr>

          {/* 3. Afastamento da sede */}
          <FullRow>
            <SecTitle>3. Afastamento da sede</SecTitle>
          </FullRow>
          <tr>
            <Cell span={9}>
              <Kv label="Ida: (data/hora):" value={draft.idaDataHora} />
            </Cell>
            <Cell span={6}>
              <Kv label="Volta: (data/hora):" value={draft.voltaDataHora} />
            </Cell>
          </tr>
          <FullRow>
            <Kv
              label="BI que publicou a autorização para o afastamento:"
              value={draft.biAutorizacao}
            />
          </FullRow>
          <FullRow>
            <Kv
              label="Itinerário completo compreendendo as cidades da missão:"
              value={draft.itinerario}
            />
          </FullRow>

          {/* 4. Evento */}
          <FullRow>
            <SecTitle>4. Evento</SecTitle>
          </FullRow>
          <tr>
            <Cell span={9}>
              <Kv label="Início (data/hora):" value={draft.eventoInicio} />
            </Cell>
            <Cell span={6}>
              <Kv label="Término (data/hora):" value={draft.eventoTermino} />
            </Cell>
          </tr>
          <FullRow>
            <Kv label="Evento:" value={draft.eventoDescricao} />
          </FullRow>

          {/* 5. Retorno */}
          <FullRow>
            <div className="break-inside-avoid">
              <SecTitle>
                5. Quanto a data do afastamento da sede o retorno foi:
              </SecTitle>
              {retornoOps.map((o) => (
                <p key={o.value} style={{ margin: 0 }}>
                  <CB checked={draft.retornoSituacao === o.value}>
                    {o.label}
                  </CB>
                </p>
              ))}
            </div>
          </FullRow>

          {/* 6. Diárias */}
          <FullRow>
            <SecTitle>6. Diárias</SecTitle>
          </FullRow>
          <FullRow>
            <p style={{ margin: 0, textAlign: "justify" }}>
              <span>BI que publicou a concessão de diárias: </span>
              {draft.diariasBi}
            </p>
          </FullRow>
          <tr>
            <Cell span={6}>
              <Kv
                label="Nº de dias de afastamento:"
                value={draft.diariasDias}
              />
            </Cell>
            <Cell span={5}>
              <EmptyCell />
            </Cell>
            <Cell span={4}>
              <EmptyCell />
            </Cell>
          </tr>
          <FullRow>
            <Kv
              label="Valor total das diárias recebidas:"
              value={draft.diariasValor}
            />
          </FullRow>
          <FullRow>
            <Kv
              label="Valor total das diárias recebidas (por extenso):"
              value={draft.diariasExtenso}
            />
          </FullRow>

          {/* 7. Acréscimo */}
          <FullRow>
            <div className="break-inside-avoid">
              <SecTitle>
                7. Quanto ao acréscimo de embarque e desembarque:
              </SecTitle>
              {acrescimoOps.map((o) => (
                <p key={o.value} style={{ margin: 0 }}>
                  <CB checked={draft.acrescimoSituacao === o.value}>
                    {o.label}
                  </CB>
                </p>
              ))}
            </div>
          </FullRow>

          {/* 8. Bilhetes não utilizados */}
          <FullRow>
            <SecTitle>
              8. Quanto à devolução do bilhete de passagem não utilizado:
            </SecTitle>
            <p style={{ margin: 0 }}>
              Anexos a este relatório estão sendo devolvidos os bilhetes, a
              seguir relacionados:
            </p>
          </FullRow>
          <tr>
            {[
              { span: 1, label: "Localizador" },
              { span: 2, label: "Data" },
              { span: 4, label: "Trecho" },
              { span: 3, label: "Cia/Transportadora" },
              { span: 4, label: "Nº voo" },
              { span: 1, label: "Horário" },
            ].map((c) => (
              <Cell key={c.label} span={c.span} center>
                <p style={{ margin: 0, fontWeight: 700 }}>{c.label}</p>
              </Cell>
            ))}
          </tr>
          {linhas8.map((b, i) => (
            <tr key={i}>
              <Cell span={1} center>
                <p style={{ margin: 0 }}>{b.localizador || "\u00A0"}</p>
              </Cell>
              <Cell span={2} center>
                <p style={{ margin: 0 }}>{b.data || "\u00A0"}</p>
              </Cell>
              <Cell span={4} center>
                <p style={{ margin: 0 }}>{b.trecho || "\u00A0"}</p>
              </Cell>
              <Cell span={3} center>
                <p style={{ margin: 0 }}>{b.cia || "\u00A0"}</p>
              </Cell>
              <Cell span={4} center>
                <p style={{ margin: 0 }}>{b.voo || "\u00A0"}</p>
              </Cell>
              <Cell span={1} center>
                <p style={{ margin: 0 }}>{b.horario || "\u00A0"}</p>
              </Cell>
            </tr>
          ))}
          <FullRow>
            <p style={{ margin: 0, textAlign: "justify" }}>
              <span>Justificativa: </span>
              {draft.devolucaoJustificativa}
            </p>
          </FullRow>

          {/* 9. Canhotos */}
          <FullRow>
            <SecTitle>
              9. Quanto à entrega dos canhotos dos cartões de embarque e
              bilhetes utilizados:
            </SecTitle>
          </FullRow>
          <tr>
            {[
              { span: 2, label: "Data" },
              { span: 5, label: "Trecho" },
              { span: 4, label: "Cia/Transportadora" },
              { span: 2, label: "Reserva" },
              { span: 2, label: "Horário" },
            ].map((c) => (
              <Cell key={c.label} span={c.span} center>
                <p style={{ margin: 0, fontWeight: 700 }}>{c.label}</p>
              </Cell>
            ))}
          </tr>
          {linhas9.map((b, i) => (
            <tr key={i}>
              <Cell span={2} center>
                <p style={{ margin: 0 }}>{b.data || "\u00A0"}</p>
              </Cell>
              <Cell span={5} center>
                <p style={{ margin: 0 }}>{b.trecho || "\u00A0"}</p>
              </Cell>
              <Cell span={4} center>
                <p style={{ margin: 0 }}>{b.cia || "\u00A0"}</p>
              </Cell>
              <Cell span={2} center>
                <p style={{ margin: 0 }}>{b.reserva || "\u00A0"}</p>
              </Cell>
              <Cell span={2} center>
                <p style={{ margin: 0 }}>{b.horario || "\u00A0"}</p>
              </Cell>
            </tr>
          ))}

          {/* Local/data + assinatura (sem linha desenhada, como no modelo) */}
          <tr>
            <Cell span={15}>
              <div className="break-inside-avoid text-center">
                <p style={{ margin: 0 }}>
                  {draft.localData || "\u00A0"}
                </p>
                <p style={{ margin: 0 }}>&nbsp;</p>
                <p style={{ margin: 0 }}>&nbsp;</p>
                <p style={{ margin: 0 }}>&nbsp;</p>
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {draft.assinatura ||
                    (draft.nome
                      ? `${draft.nome.toUpperCase()}${draft.postoCargo ? ` – ${draft.postoCargo.toUpperCase()}` : ""}`
                      : "\u00A0")}
                </p>
              </div>
            </Cell>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
