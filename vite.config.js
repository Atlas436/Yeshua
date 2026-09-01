import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sobre: resolve(__dirname, 'sobre.html'),
        cardapio: resolve(__dirname, 'cardapio.html'),
        personalizar: resolve(__dirname, 'personalizar.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        carrinho: resolve(__dirname, 'carrinho.html'),
        contato: resolve(__dirname, 'contato.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  }
});
