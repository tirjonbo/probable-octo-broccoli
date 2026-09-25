import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Каталог data/ создаётся во время работы — не включаем его в трассировку сборки.
  outputFileTracingExcludes: { "*": ["./data/**/*"] },
};

export default nextConfig;
