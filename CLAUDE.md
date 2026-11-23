# D. Compósitos Projetos de Estruturas – briefing

Daniel Mansur (D. Compósitos). Responder em português, medidas em mm. Testar primeiro; publicar só com "pode publicar". Instruções completas do app em `PROMPT-CLAUDE-CODE.md` (seções 1 a 6).

- Base: ramificação `dcompositos-projetos-v2` (versão feita como página do Claude). Trabalho em `ccr-53178d52-k1ej2l`. A `main` ainda tem o app antigo "Cálculo de Estruturas".
- `index.html` (projetos de estrutura) e `filamentadora.html` (filamentadora 3D). Bibliotecas por CDN (three r128, jsPDF 2.5.1, pdf.js 3.11.174).
- **Rodar fora do Claude (seção 1, feito):** `dc-ponte.js` cria `window.claude.use()` só quando não está no claude.ai: `sample` → `/api/claude`; `dictation` → Web Speech pt-BR; `tts` → speechSynthesis; `downloads` → `<a download>` ou compartilhar no celular.
- `functions/api/claude.js` (Cloudflare Pages Function): chave no secret `ANTHROPIC_API_KEY`; nível "complexo" → `claude-sonnet-5-5` (effort medium, fallbacks default), "simples" → `claude-haiku-5-5` (effort low); resposta em streaming (SSE) para não estourar o tempo de 100 s; só aceita pedidos do próprio site; GET devolve `{pronto}`.
- `sw.js`: mudar o CACHE a cada versão (hoje `dcompositos-projetos-v2`); não guarda `/api/`.
- Cloudflare Pages: projeto **"dcompositos-projetos"** (conta 255c65de033e7d9756d04c90bc824735, saída = raiz, produção em `main`). O push **não dispara deploy sozinho**: disparar com `POST .../pages/projects/dcompositos-projetos/deployments` (form `branch=ccr-53178d52-k1ej2l`). Teste: https://ccr-53178d52-k1ej2l.dcompositos-projetos.pages.dev. Publicar: trocar `production_branch` para a ramificação de trabalho, novo deploy, voltar para `main`.
- Testes locais: CDNs bloqueados no contêiner; usar cópias do npm (three@0.128.0, jspdf@2.5.1, pdfjs-dist@3.11.174) via `page.route` no playwright.
