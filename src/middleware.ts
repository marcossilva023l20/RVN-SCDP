import { NextRequest, NextResponse } from "next/server";

/**
 * Proteção opcional por usuário e senha (HTTP Basic Auth).
 *
 * O app guarda dados sensíveis (CPF, conta bancária, e-mail). Ao hospedar,
 * defina as variáveis de ambiente APP_USER e APP_PASSWORD — todo o app
 * passará a exigir login. Sem elas (ex.: uso local), o acesso fica livre.
 */
export function middleware(req: NextRequest) {
  const user = process.env.APP_USER;
  const pass = process.env.APP_PASSWORD;

  // Sem credenciais configuradas → acesso livre (desenvolvimento local)
  if (!user || !pass) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      try {
        const decoded = atob(encoded);
        const sep = decoded.indexOf(":");
        if (
          decoded.slice(0, sep) === user &&
          decoded.slice(sep + 1) === pass
        ) {
          return NextResponse.next();
        }
      } catch {
        /* credencial inválida */
      }
    }
  }

  return new NextResponse("Acesso restrito.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="RVN Facil", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|api/health).*)",
  ],
};
