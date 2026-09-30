import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Origens liberadas durante o `next dev` (não afeta produção/Vercel).
   * Necessário para abrir a prévia do app por um domínio proxy, que sem
   * isso tem os arquivos estáticos (_next/static) bloqueados — a página
   * abre sem estilo nem scripts.
   */
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
