import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// ⚠️ Substitua pelo número real do WhatsApp da loja (formato DDI+DDD+número, só dígitos).
export const WHATSAPP_NUMERO = '5511999999999';

document.addEventListener('DOMContentLoaded', () => {
  // Ano automático no rodapé
  document.querySelectorAll('[data-ano-atual]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Marca o link ativo do menu conforme a página atual
  const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-yeshua .nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === paginaAtual || (paginaAtual === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // ---------- Cardápio: filtro por categoria ----------
  const filtros = document.querySelectorAll('[data-filtro-categoria]');
  const pratos = document.querySelectorAll('[data-categoria]');
  if (filtros.length && pratos.length) {
    filtros.forEach((botao) => {
      botao.addEventListener('click', () => {
        filtros.forEach((b) => b.classList.remove('active'));
        botao.classList.add('active');
        const categoria = botao.dataset.filtroCategoria;
        pratos.forEach((prato) => {
          const mostrar = categoria === 'todos' || prato.dataset.categoria === categoria;
          prato.closest('.prato-wrapper').classList.toggle('d-none', !mostrar);
        });
      });
    });
  }

  // ---------- Cardápio: preço muda conforme tamanho escolhido ----------
  document.querySelectorAll('[data-precos]').forEach((card) => {
    const precos = JSON.parse(card.dataset.precos);
    const precoEl = card.querySelector('[data-preco-exibido]');
    const botoesTamanho = card.querySelectorAll('[data-tamanho]');
    botoesTamanho.forEach((botao) => {
      botao.addEventListener('click', () => {
        botoesTamanho.forEach((b) => b.classList.remove('active'));
        botao.classList.add('active');
        const tamanho = botao.dataset.tamanho;
        if (precoEl && precos[tamanho]) {
          precoEl.textContent = `R$ ${precos[tamanho].toFixed(2).replace('.', ',')}`;
        }
      });
    });
  });

  // ---------- Formulário: Encomenda personalizada -> WhatsApp ----------
  const formPersonalizar = document.getElementById('form-personalizar');
  if (formPersonalizar) {
    formPersonalizar.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!formPersonalizar.checkValidity()) {
        formPersonalizar.classList.add('was-validated');
        return;
      }

      const dados = new FormData(formPersonalizar);
      const nome = dados.get('nome');
      const telefone = dados.get('telefone');
      const bairro = dados.get('bairro');
      const tamanho = dados.get('tamanho');
      const quantidade = dados.get('quantidade');
      const proteina = dados.get('proteina');
      const restricoes = dados.get('restricoes') || 'Nenhuma';
      const dataEntrega = dados.get('data-entrega');
      const observacoes = dados.get('observacoes') || '—';

      const mensagem = [
        '*Nova encomenda personalizada — Yeshua Marmitas Fit*',
        `Nome: ${nome}`,
        `Telefone: ${telefone}`,
        `Bairro/Região (SP): ${bairro}`,
        `Tamanho: ${tamanho}`,
        `Quantidade: ${quantidade}`,
        `Proteína preferida: ${proteina}`,
        `Restrições alimentares: ${restricoes}`,
        `Data desejada de entrega: ${dataEntrega}`,
        `Observações: ${observacoes}`,
      ].join('\n');

      const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank', 'noopener');

      const alerta = document.getElementById('alerta-envio');
      if (alerta) {
        alerta.classList.remove('d-none');
        alerta.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      formPersonalizar.reset();
      formPersonalizar.classList.remove('was-validated');
    });
  }

  // ---------- Formulário de contato -> WhatsApp ----------
  const formContato = document.getElementById('form-contato');
  if (formContato) {
    formContato.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!formContato.checkValidity()) {
        formContato.classList.add('was-validated');
        return;
      }
      const dados = new FormData(formContato);
      const mensagem = [
        '*Contato pelo site — Yeshua Marmitas Fit*',
        `Nome: ${dados.get('nome')}`,
        `E-mail: ${dados.get('email')}`,
        `Mensagem: ${dados.get('mensagem')}`,
      ].join('\n');
      const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank', 'noopener');
      formContato.reset();
      formContato.classList.remove('was-validated');
    });
  }
});
