# Yeshua Marmitas Fit Congeladas

Site institucional e de encomendas da **Yeshua**, marmitas fit congeladas com cardápio fixo (tamanhos **P, M, G**) e encomendas personalizadas, com entrega para toda a cidade de São Paulo.

- Paleta: preto, dourado (escuro/claro) e terracota (escuro/claro)
- Logo: leão preto e dourado, em estilo geométrico
- Bootstrap **5.3** (via npm, bundlado com Vite)
- Projeto estático multi-página, pronto para rodar no [StackBlitz](https://stackblitz.com)

## Páginas

- `index.html` — Home / apresentação da marca
- `cardapio.html` — Cardápio fixo com filtro por categoria e seleção de tamanho (P/M/G)
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
- Ajuste preços, pratos e fotos do cardápio em `cardapio.html`.
- Troque o Instagram/e-mail de exemplo no rodapé de cada página.
- Substitua os emojis usados como placeholder de foto dos pratos por fotos reais quando disponíveis.
