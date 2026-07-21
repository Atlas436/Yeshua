# Yeshua Marmitas Fit Congeladas

Site institucional e de encomendas da **Yeshua**, marmitas fit congeladas com cardápio fixo (tamanhos **P, M, G**) e encomendas personalizadas, com entrega para toda a cidade de São Paulo.

- Paleta: laranja claro e amarelo (fundo), preto como cor de acento (navbar, rodapé, textos), com um toque de terracota
- Logo: ainda não definida — o site está sem logo por enquanto (texto/wordmark "Yeshua" no lugar)
- Bootstrap **5.3** (via npm, bundlado com Vite)
- Projeto estático multi-página, pronto para rodar no [StackBlitz](https://stackblitz.com)

## Páginas

- `index.html` — Home / apresentação da marca
- `sobre.html` — Sobre a Yeshua (história, missão/visão/valores, diferenciais)
- `cardapio.html` — Montador da marmita fixa (tamanho P/M/G + ingredientes)
- `carrinho.html` — Revisão das marmitas escolhidas antes do checkout
- `checkout.html` — Dados de entrega, cálculo de frete por zona e fechamento do pedido pelo WhatsApp
- `personalizar.html` — Formulário de encomenda personalizada (envia o pedido pronto para o WhatsApp)
- `contato.html` — Contato, áreas de entrega em SP, formulário e perguntas frequentes

## Rodando localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (geralmente `http://localhost:5173`).

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

## Abrindo no StackBlitz

Depois de subir este repositório para o GitHub, basta acessar:

```
https://stackblitz.com/github/SEU_USUARIO/SEU_REPOSITORIO
```

O StackBlitz detecta o `package.json`, instala as dependências (Vite + Bootstrap) e abre o site rodando automaticamente — dá pra editar e ver o resultado ao vivo, sem instalar nada na sua máquina.

## Pendências antes de virar um negócio real

- Quando tiver a logo definitiva: adicionar de volta as referências de imagem no `<head>` (favicon) e na navbar/rodapé de cada página — hoje o site está de propósito sem logo (só o wordmark "Yeshua" em texto).
- Confira os preços por tamanho e os valores de frete por zona em `src/main.js` (constantes `TAMANHOS_MARMITA` e `FRETE_POR_ZONA`) — ainda são valores de referência.
- Ajuste pratos, ingredientes e fotos do cardápio em `cardapio.html`.
- Troque o Instagram de exemplo (`href="#"`) no rodapé de cada página pelo link real, quando existir.
- Substitua os emojis usados como placeholder de foto dos pratos por fotos reais quando disponíveis.
- O conteúdo institucional (Sobre nós, calorias/macros do cardápio, kits semanal/mensal) ainda é fictício/ilustrativo — revisar antes de operar de verdade.
- Falta uma política de troca/cancelamento (exigida por lei para loja online) e depoimentos/prova social.

## Publicando o site

O site já está publicado via [Netlify](https://netlify.com) em `yeshua-marmitas-fit.netlify.app`, com deploy automático a cada commit enviado para esta branch — o arquivo `netlify.toml` na raiz configura o `npm run build` e a pasta `dist` publicada. Para republicar do zero em outro projeto Netlify:

1. Entrar em [app.netlify.com](https://app.netlify.com) e criar uma conta gratuita (dá pra usar login do GitHub).
2. Clicar em **"Add new site" → "Import an existing project"** e escolher **GitHub**.
3. Selecionar o repositório `atlas436/Yeshua` e a branch com o site.
4. O Netlify já reconhece as configurações do `netlify.toml` automaticamente — é só clicar em **"Deploy"**.

Alternativas igualmente simples: [Vercel](https://vercel.com) (mesmo fluxo, também detecta o Vite sozinho) ou **GitHub Pages** (gratuito, mas exige um ajuste extra no `vite.config.js` por causa do caminho do site).
