/**
 * Captura do SCDP (favorito "Capturar do SCDP").
 *
 * O texto selecionado no SCDP é enviado por POST (formulário) para
 * `/api/captura` — assim NÃO passa pela barra de endereços e não tem o limite
 * de tamanho das URLs: vale a seleção inteira, por maior que seja.
 *
 * A rota guarda o texto na `sessionStorage` do navegador (mesma aba, mesma
 * origem) e manda o navegador para o editor, que lê o texto de lá e o coloca
 * na caixa "Importar do SCDP (colar texto)".
 */

/** Chave da sessionStorage onde a captura fica até o editor consumi-la. */
export const CHAVE_CAPTURA = "rvn:captura-scdp";

/** Guarda a captura (usado pela página de entrega e pelo /novo). */
export function guardarCaptura(texto: string): void {
  try {
    sessionStorage.setItem(CHAVE_CAPTURA, texto);
  } catch {
    // Navegador em modo restrito (ou sem sessionStorage): o botão "Colar"
    // continua funcionando, porque o favorito também copia para a área de
    // transferência.
  }
}

/** Lê a captura pendente (string vazia quando não há nenhuma). */
export function lerCaptura(): string {
  try {
    return sessionStorage.getItem(CHAVE_CAPTURA) ?? "";
  } catch {
    return "";
  }
}

/** Descarta a captura depois de usada. */
export function limparCaptura(): void {
  try {
    sessionStorage.removeItem(CHAVE_CAPTURA);
  } catch {
    // sem sessionStorage: nada a limpar
  }
}
