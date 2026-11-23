# D. Compósitos Projetos de Estruturas — instruções para o Claude Code

Os arquivos desta pasta são a versão atual do app, feita e testada como página do Claude (claude.ai). Coloque-os no meu repositório GitHub `mansurdaniel07-ui/Projeto-e-c-lculo-estrutural-` (substituindo o app antigo "Cálculo de Estruturas") e publique como PWA. Primeiro faça uma VERSÃO DE TESTE (branch/preview separado, sem substituir nada) e me mostre. Só publique depois da minha aprovação. Fale comigo em português; medidas em mm.

## Arquivos
- `index.html` — app principal: tela inicial, projetos de estrutura (piscina, tanque retangular, tanque cilíndrico, mesa, berço de molde, escada, corrimão, capota, filamentadora-estrutura, em branco), conversa com o Claude, lista de corte, PDF, vídeo.
- `filamentadora.html` — filamentadora de tanques em 3D animado e editável (automática e semiautomática), dimensionamento de acionamento, lista de material, PDF por partes, vídeo.
- `manifest.webmanifest`, `sw.js`, `icon-*.png` — PWA instalável e offline.
- Bibliotecas por CDN: three.js r128 + OrbitControls (cdnjs/jsdelivr), jsPDF 2.5.1 e pdf.js 3.11.174 (cdnjs).

## 1. O que precisa mudar para rodar FORA do Claude
Hoje o app usa `window.claude.use(...)` (recursos da página do Claude). Fora do claude.ai isso volta `undefined`; os caminhos alternativos já existem em parte. Faça:
1. **Voz:** onde usa `claude.use('dictation')`, usar a Web Speech API (`webkitSpeechRecognition`, `lang='pt-BR'`, resultados parciais no campo de texto). Manter o microfone do teclado como último recurso.
2. **Claude (conversa e comandos livres):** onde usa `claude.use('sample')`, chamar uma função no servidor (Cloudflare Pages Function, `/api/claude`) que repassa para a API Messages da Anthropic. A chave fica SÓ no servidor (secret `ANTHROPIC_API_KEY`), nunca no app. Aceitar texto + imagens (fotos e páginas de PDF já viram JPEG no app). Modelo: `claude-sonnet-5-5` para montar estrutura nova; `claude-haiku-5-5` para comandos simples. Me explicar como criar a chave e pôr limite de gasto no console da Anthropic.
3. **Ler respostas em voz alta:** onde usa `claude.use('tts')`, usar `speechSynthesis` pt-BR.
4. **Salvar arquivos (PDF, PNG, vídeo):** onde usa `claude.use('downloads')`, usar download normal (`<a download>`); no celular, se der, `navigator.share` com o arquivo.
5. Se o repositório continuar no GitHub Pages, ok; se eu quiser a função do servidor, publicar no Cloudflare Pages (igual ao meu app de cálculo de material, dcompositos.pages.dev).

## 2. Estrutura igual em TODOS os projetos (já feita, manter)
- Tela inicial "O que vamos fazer?": Projeto novo (voz/texto/foto/PDF com o Claude), Filamentadora 3D, modelos prontos, Continuar o último, Meus projetos. Botão ⌂ Início.
- Ordem e nomes das seções: **Comando · Configuração · Perfis e componentes · Lista de material · Projeto (PDF e foto) · Vídeo · Meus projetos**.
- 3D: ferramentas escondidas atrás de um botão ☰ no alto (abre/fecha), ⛶ tela cheia, vistas, corte, rótulos, animação quando houver. Tocar numa peça marca; apagar peça; mostrar apagadas.
- Lista de material universal (tela, "Copiar pedido" e folha do PDF): **Estrutura** (tubos/perfis em varas de 6 m, metros, kg; vara e perda de corte editáveis; aço 7,85 kg/dm³) · **Chapas** (medida × espessura, m², kg) · **Mecânicos** · **Acionamento** · **Comando e elétrica** · **Compósito**. Componentes automáticos (ex.: rodízios quando a opção está ligada; área de molde em m²) + adicionados à mão ou pelo Claude.
- Projeto em PDF (A4 deitada, carimbo D. Compósitos com nome do projeto, cliente, data, folha n/N; nome do arquivo = nome do projeto + data): escolher **completo / uma parte / uma peça**; folhas: foto limpa (sem cotas), vistas cotadas (superior, lateral, frontal, perspectiva), vista explodida, detalhe de cada peça com cotas (medida de corte, ângulos, perfil, quantidade, material), lista de peças e lista de material só do escolhido. "Salvar foto (PNG)" = só a imagem limpa do escolhido.
- Vídeo: 360° automático (10/20/30 s) e câmera livre (grava enquanto eu giro/aproximo; mesmo botão para parar e salvar). mp4 se o navegador aceitar, senão webm.

## 3. Filamentadora (filamentadora.html) — regras já implementadas, manter
- Tipos: Automática (roving: carro em torre, pente, banheira, espremedor de 2 rolos, bandeja articulada, gaiola de rovings fixa, cremalheira em calha) e Semiautomática (tecido/manta: rolo de tecido no carro, carro manual com trava, sem cremalheira/gaiola).
- Base única com trilhos ligando cabeçote fixo e apoio móvel; cavaletes em A; mandril passante com gabaritos (anel + raios + abraçadeira); motorredutor fora da projeção do tanque; trilhos do carro elevados ~400 mm e presos à base nas duas pontas; rodas de PU com guias e antitombamento.
- **Regra de comando e acionamento:**
  - CLP Delta + IHM → mandril motorredutor + inversor + **encoder no eixo** (carro segue o encoder); carro motor de passo malha fechada + pinhão/cremalheira.
  - DDCS V4.1/V3.1 → mandril **servo + redutor** (motorredutor não serve: DDCS só manda pulso/direção); carro passo ou servo.
  - Semiautomática → motorredutor + timer (liga/desliga), carro manual com trava.
- **Dimensionamento de referência (marcar [CONFIRMAR]):**
  - Mandril: T = 1,3 × (tração dos fios × raio + inércia do tanque × aceleração em 3 s + atrito 0,02 × peso × g × 0,11); P = T × ω ÷ 0,85; motor = primeiro da lista comercial ≥ 1,25 × P; redução = rotação do motor (1740 motorredutor 4 polos / 3000 servo) ÷ rpm do mandril, com corrente 1:3 + redutor.
  - Carro: F = massa (180 kg auto / 220 kg semi) × (0,05 × g + v ÷ 0,5 s) + 0,2 × fios × tensão; torque no pinhão = F × (módulo × dentes ÷ 2) × 1,5; passo malha fechada até ~900 rpm, acima disso redução ou servo.
  - Campos "escolhido" (potência, redução, torque) comparam com o necessário: ✔ atende / ✘ não atende.
- Semiautomática: largura útil = largura − sobreposição; nº de faixas = arredondar p/ cima((L − sobreposição) ÷ largura útil).
- Folha por partes: Filamentadora completa, Só o carro, Só o mandril e gabaritos, Só a base/cabeçote/apoio/motorredutor, Só os trilhos, Só a gaiola, Só uma peça (lista com todas as peças por nome).

## 4. Melhorias que ficaram para você (Claude Code)
1. Na filamentadora, dar nome a TODAS as peças do 3D e deixar o Claude apagar/mostrar qualquer uma pelo nome; salvar as peças apagadas no projeto.
2. Nos projetos de estrutura (index.html), detalhar as peças com o mesmo nível da filamentadora (chapas planificadas, rolos, pinos) quando o projeto tiver esses itens; animação 3D quando fizer sentido.
3. Unificar o código das duas páginas num só núcleo (3D, lista de material, PDF, vídeo, voz, Claude) para que tudo que existir num tipo de projeto exista nos outros automaticamente. Cada tipo de projeto vira só uma "configuração" + "gerador de peças".
4. Próximos módulos (deixar no menu como "em breve"): moldes (gradeamento com rodízios, reforço e virador; molde escalável sobre trilho; berço de barco), palco, torre, grade, motorização (pulsos/mm, velocidades), CNC router, mesa laminadora, máquina de tubo. Depois ligar ao app de cálculo de material (dcompositos.pages.dev) para resina, manta e tecido.

## 5. Testes antes de me mostrar
- Abrir no celular (Android e iPhone): tela inicial, abrir piscina, mesa, capota e filamentadora; ☰ abre/fecha; ⛶ tela cheia.
- Filamentadora: trocar CLP ↔ DDCS ↔ semiautomática e conferir motorredutor/servo/encoder/inversor na lista de material; padrão (Ø3000, 6000, 8 fios, 30 N, 1000 kg, 10 rpm) → mandril ≈ 1.517 N·m, ≈ 1,87 kW, motorredutor 3 kW, redução ≈ 1:174.
- Semiautomática 1808, largura 1200, sobreposição 100, L 6000 → largura útil 1100, 6 faixas.
- PDF "Só o carro" sai só com carro (foto limpa, explodida, peças, lista); "Só uma peça" sai só a peça; nome do projeto no carimbo e no arquivo.
- Voz (Web Speech) e Claude pela função do servidor funcionando; anexar foto e PDF.
- Vídeo 360° e câmera livre baixando no celular.
- Lista de material: soma dos kg batendo; "Copiar pedido" com todas as seções.

## 6. Pendências [CONFIRMAR] (deixar editáveis)
Perfis reais de cada parte, espessuras de chapa, gramatura dos tecidos/manta, tex do roving, relação resina:fibra, tensão real do fio, peso real do tanque com gabaritos, modelos de motor/redutor/inversor/CLP/driver, módulo da cremalheira, rolamentos do mancal do eixo.
