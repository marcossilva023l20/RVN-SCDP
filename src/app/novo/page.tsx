"use client";

import { Loader2, PlaneTakeoff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { tituloPadrao } from "@/lib/format";
import { parseScdp } from "@/lib/scdp";

function NovoInner() {
  const router = useRouter();
  const params = useSearchParams();
  const started = useRef(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const pcdp = params.get("pcdp") ?? "";
    const trecho = (params.get("t") ?? "").trim();
    // Texto copiado no SCDP: extrai PCDP, datas, itinerário, evento, diárias…
    // O parser aqui serve só para o título/nº da PCDP: o texto completo vai
    // para a caixa "Importar do SCDP" do editor, onde você confere e aplica.
    const importado = parseScdp(trecho);
    const body: Record<string, unknown> = {
      titulo: tituloPadrao(importado.pcdpNumero ?? pcdp, importado.nome),
      pcdpNumero: importado.pcdpNumero ?? pcdp,
    };
    (async () => {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const { id } = (await res.json()) as { id: number };
        // O texto selecionado segue pela URL e cai direto na caixa
        // "Importar do SCDP (colar texto)" do editor.
        const alvo = trecho
          ? `/relatorios/${id}?t=${encodeURIComponent(trecho)}`
          : `/relatorios/${id}`;
        router.replace(alvo);
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
