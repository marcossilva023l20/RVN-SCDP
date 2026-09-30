"use client";

import { Loader2, PlaneTakeoff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { guardarCaptura, lerCaptura } from "@/lib/captura";
import { tituloPadrao } from "@/lib/format";
import { CHAVES_IMPORT_SCDP, parseScdp } from "@/lib/scdp";

function NovoInner() {
  const router = useRouter();
  const params = useSearchParams();
  const started = useRef(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const pcdp = params.get("pcdp") ?? "";
    // Captura do favorito: o texto chega pela sessionStorage (POST, sem o
    // limite de tamanho das URLs). O `?t=` continua valendo para links antigos.
    const captura = params.get("captura") === "1";
    const trecho = (captura ? lerCaptura() : (params.get("t") ?? "")).trim();
    // Texto copiado no SCDP: extrai PCDP, datas, itinerário, evento, diárias…
    const importado = parseScdp(trecho);
    // Se o parser não reconheceu a descrição, guarda o texto bruto só quando
    // ele *é* uma descrição (texto curto, sem seções do SCDP) — assim o campo
    // "Evento" nunca recebe o bloco de bilhetes/roteiro colado.
    const trechoEhOutraSecao =
      trecho.length > 400 ||
      /BILHETES|ROTEIRO DA VIAGEM|INFORMA[ÇC][ÕO]ES DA VIAGEM|QUADRO DE TOTALIZA|C[óo]digo da Reserva|Tarifa|DADOS ATUALIZADOS/i.test(
        trecho,
      );
    const body: Record<string, unknown> = {
      // O servidor também ajusta no POST; aqui já sai certo na tela.
      titulo: tituloPadrao(importado.pcdpNumero ?? pcdp, importado.nome),
      pcdpNumero: importado.pcdpNumero ?? pcdp,
      eventoDescricao:
        importado.eventoDescricao || (trechoEhOutraSecao ? "" : trecho),
    };
    for (const chave of CHAVES_IMPORT_SCDP) {
      const v = importado[chave];
      if (v) body[chave] = v;
    }
    // Bilhetes a prestar contas (seções 8/9), quando copiados.
    if (importado.bilhetes?.length) {
      body.bilhetesCopia = importado.bilhetes.map((b, i) => ({
        tipo: b.tipo,
        localizador: b.localizador,
        data: b.data,
        trecho: b.trecho,
        cia: b.cia,
        voo: b.voo,
        reserva: b.reserva,
        horario: b.horario,
        ordem: i,
      }));
    }
    (async () => {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const { id } = (await res.json()) as { id: number };
        // O editor lê a captura da sessionStorage para preencher a caixa
        // "Importar do SCDP (colar texto)"; o `?t=` entra pelo mesmo caminho.
        if (trecho && !captura) guardarCaptura(trecho);
        router.replace(
          `/relatorios/${id}${trecho ? "?captura=1" : ""}`,
        );
      } catch {
        setErro("Não foi possível criar o relatório. Tente novamente.");
      }
    })();
  }, [params, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d150f] text-[#edf2ee]">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7ba889]/15 text-[#a9cfba]">
        <PlaneTakeoff className="h-7 w-7" strokeWidth={1.8} />
      </span>
      {erro ? (
        <>
          <p className="mt-5 text-[15px] font-semibold text-red-300">{erro}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-full bg-[#7ba889]/20 px-5 py-2 text-[13px] font-semibold text-[#c9e6d2]"
          >
            Voltar ao painel
          </button>
        </>
      ) : (
        <>
          <p className="mt-5 flex items-center gap-2 text-[15px] font-semibold">
            <Loader2 className="h-4 w-4 animate-spin" />
            Criando seu relatório…
          </p>
          <p className="mt-1.5 text-[12.5px] text-[#7e9789]">
            {params.get("pcdp")
              ? `PCDP ${params.get("pcdp")} detectado automaticamente`
              : "Preparando o editor"}
          </p>
        </>
      )}
    </div>
  );
}

export default function NovoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0d150f] text-[#edf2ee]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <NovoInner />
    </Suspense>
  );
}
