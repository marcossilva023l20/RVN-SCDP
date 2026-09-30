import { CHAVE_CAPTURA } from "@/lib/captura";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Recebe a captura do favorito "Capturar do SCDP".
 *
 * O favorito envia um formulário (POST) com o texto selecionado no SCDP — o
 * conteúdo vai no corpo da requisição, então NÃO existe o limite de tamanho
 * das URLs: a seleção inteira é aceita.
 *
 * A resposta é a página de entrega: guarda o texto na sessionStorage (mesma
 * aba, mesma origem) e abre o editor, onde o texto aparece na caixa
 * "Importar do SCDP (colar texto)". O `/novo` lê a mesma sessionStorage para
 * já criar o relatório com os campos reconhecidos.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const texto = String(form?.get("t") ?? "");

  const dados = JSON.stringify({ texto, chave: CHAVE_CAPTURA }).replace(
    /</g,
    "\\u003c",
  );

  return new Response(paginaDeEntrega(dados), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

/** GET sem POST não tem texto para entregar: orienta a usar o favorito. */
export async function GET() {
  return Response.json(
    {
      erro: "Use o favorito “Capturar do SCDP” (ele envia a seleção por POST).",
    },
    { status: 405 },
  );
}

function paginaDeEntrega(dados: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Capturando do SCDP…</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#0d150f;color:#edf2ee;font:15px/1.6 system-ui,-apple-system,sans-serif}
  .cx{text-align:center;padding:24px}
  .n{color:#a9cfba;font-weight:700}
  .d{color:#7e9789;font-size:13px}
</style>
</head>
<body>
<div class="cx">
  <p>Texto capturado do SCDP: <span class="n" id="n">0</span> caracteres.</p>
  <p class="d">Abrindo o editor…</p>
</div>
<script type="application/json" id="dados">${dados}</script>
<script>
(function(){
  var dados = JSON.parse(document.getElementById("dados").textContent);
  try { sessionStorage.setItem(dados.chave, dados.texto); } catch (e) {}
  var alvo = document.getElementById("n");
  if (alvo) alvo.textContent = dados.texto.length.toLocaleString("pt-BR");
  location.replace("/novo?captura=1");
})();
</script>
</body>
</html>`;
}
