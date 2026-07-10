# Yeshua Marmitas Fit Congeladas

Site institucional e de encomendas da **Yeshua**, marmitas fit congeladas com cardápio fixo (tamanhos **P, M, G**) e encomendas personalizadas, com entrega para toda a cidade de São Paulo.

- Paleta: preto, dourado (escuro/claro) e terracota (escuro/claro)
- Logo: leão preto e dourado, em estilo geométrico
- Bootstrap **5.3** (via npm, bundlado com Vite)
- Projeto estático multi-página, pronto para rodar no [StackBlitz](https://stackblitz.com)

## Páginas

- `index.html` — Home / apresentação da marca
- `cardapio.html` — Montador da marmita fixa (tamanho P/M/G + ingredientes)
- `carrinho.html` — Revisão das marmitas escolhidas antes do checkout
- `checkout.html` — Dados de entrega, cálculo de frete por zona e fechamento do pedido pelo WhatsApp
- `personalizar.html` — Formulário de encomenda personalizada (envia o pedido pronto para o WhatsApp)
- `contato.html` — Contato, áreas de entrega em SP e formulário

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

## Antes de publicar

- Troque o número de WhatsApp de exemplo (`5511999999999`) pelo número real da loja em `src/main.js` (constante `WHATSAPP_NUMERO`) e nos links `wa.me` espalhados pelo HTML.
- Confira os preços por tamanho e os valores de frete por zona em `src/main.js` (constantes `TAMANHOS_MARMITA` e `FRETE_POR_ZONA`).
- Ajuste pratos, ingredientes e fotos do cardápio em `cardapio.html`.
- Troque o Instagram/e-mail de exemplo no rodapé de cada página.
- Substitua os emojis usados como placeholder de foto dos pratos por fotos reais quando disponíveis.
- Quando tiver a logo definitiva, é só substituir `public/logo.svg` (ou trocar por `.png`/`.jpg` e ajustar os `<img src>`).

## Publicando o site (quando estiver pronta)

O projeto já está preparado para publicar em um clique via [Netlify](https://netlify.com) — o arquivo `netlify.toml` na raiz já diz pra ele rodar `npm run build` e servir a pasta `dist`. **Nada disso publica o site sozinho** — só fica pronto para quando você decidir. O passo a passo, quando quiser seguir:

1. Entrar em [app.netlify.com](https://app.netlify.com) e criar uma conta gratuita (dá pra usar login do GitHub).
2. Clicar em **"Add new site" → "Import an existing project"** e escolher **GitHub**.
3. Selecionar o repositório `atlas436/Yeshua` e a branch com o site (a que estamos usando agora).
4. O Netlify já reconhece as configurações do `netlify.toml` automaticamente — é só clicar em **"Deploy"**.
5. Em alguns minutos o site fica no ar num link tipo `yeshua-marmitas.netlify.app` (dá pra trocar esse nome depois, e também dá pra ligar um domínio próprio como `yeshuamarmitas.com.br` nas configurações do Netlify).

Alternativas igualmente simples, caso prefira: [Vercel](https://vercel.com) (mesmo fluxo, também detecta o Vite sozinho) ou **GitHub Pages** (gratuito, mas exige um ajuste extra no `vite.config.js` por causa do caminho do site).

Qualquer uma dessas opções também redeploya automaticamente sempre que um novo commit for enviado pra branch conectada — ou seja, depois de publicado, é só continuar mandando ajustes por aqui que o site atualiza sozinho.
