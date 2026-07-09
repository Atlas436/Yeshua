import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// ⚠️ Substitua pelo número real do WhatsApp da loja (formato DDI+DDD+número, só dígitos).
export const WHATSAPP_NUMERO = '5511999999999';

// ⚠️ Valores de frete de exemplo — ajuste para os valores reais de cada região.
export const FRETE_POR_ZONA = {
  'Centro': 8,
  'Zona Sul': 12,
  'Zona Oeste': 12,
  'Zona Norte': 15,
  'Zona Leste': 15,
  'Grande SP': 25,
};

// ⚠️ Valor mínimo de pratos (sem contar o frete) para o frete sair grátis.
export const FRETE_GRATIS_ACIMA_DE = 150;

// ---------- Tela de carregamento (evita o "susto" do leão surgindo de repente) ----------
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('loader-oculto');
    setTimeout(() => loader.remove(), 500);
  }, 350);
});

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

  // ---------- Cardápio: botão "Comprar" leva para o checkout do prato ----------
  document.querySelectorAll('[data-comprar]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const card = botao.closest('[data-precos]');
      const precos = JSON.parse(card.dataset.precos);
      const botaoTamanhoAtivo = card.querySelector('[data-tamanho].active');
      const tamanho = botaoTamanhoAtivo ? botaoTamanhoAtivo.dataset.tamanho : 'P';
      const nomePrato = card.querySelector('h5').textContent.trim();
      const preco = precos[tamanho];

      const params = new URLSearchParams({
        prato: nomePrato,
        tamanho,
        preco: preco.toFixed(2),
      });
      window.location.href = `checkout.html?${params.toString()}`;
    });
  });

  // ---------- Checkout: resumo do pedido, quantidade e finalização ----------
  const checkoutConteudo = document.getElementById('checkout-conteudo');
  if (checkoutConteudo) {
    const parametros = new URLSearchParams(window.location.search);
    const prato = parametros.get('prato');
    const tamanho = parametros.get('tamanho');
    const precoUnitario = parseFloat(parametros.get('preco'));

    if (!prato || !tamanho || Number.isNaN(precoUnitario)) {
      checkoutConteudo.classList.add('d-none');
      document.getElementById('checkout-vazio').classList.remove('d-none');
    } else {
      const formatarMoeda = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

      document.getElementById('resumo-prato').textContent = prato;
      document.getElementById('resumo-tamanho').textContent = tamanho;
      document.getElementById('resumo-preco-unit').textContent = formatarMoeda(precoUnitario);
      document.getElementById('frete-gratis-valor').textContent = formatarMoeda(FRETE_GRATIS_ACIMA_DE);

      let quantidade = 1;
      const quantidadeEl = document.getElementById('resumo-quantidade');
      const subtotalEl = document.getElementById('resumo-subtotal');
      const freteEl = document.getElementById('resumo-frete');
      const freteZonaEl = document.getElementById('resumo-frete-zona');
      const freteGratisAvisoEl = document.getElementById('resumo-frete-gratis-aviso');
      const totalEl = document.getElementById('resumo-total');
      const zonaSelect = document.getElementById('checkout-zona');

      const calcularFrete = (subtotal, zona) => {
        if (subtotal >= FRETE_GRATIS_ACIMA_DE) return 0;
        if (!zona || !(zona in FRETE_POR_ZONA)) return null;
        return FRETE_POR_ZONA[zona];
      };

      const atualizarResumo = () => {
        const subtotal = precoUnitario * quantidade;
        const zona = zonaSelect.value;
        const frete = calcularFrete(subtotal, zona);

        quantidadeEl.textContent = quantidade;
        subtotalEl.textContent = formatarMoeda(subtotal);
        freteZonaEl.textContent = zona ? ` (${zona})` : '';
        freteGratisAvisoEl.classList.toggle('d-none', subtotal < FRETE_GRATIS_ACIMA_DE);

        if (frete === null) {
          freteEl.textContent = 'Selecione a zona';
          totalEl.textContent = formatarMoeda(subtotal);
        } else if (frete === 0) {
          freteEl.textContent = 'Grátis';
          totalEl.textContent = formatarMoeda(subtotal);
        } else {
          freteEl.textContent = formatarMoeda(frete);
          totalEl.textContent = formatarMoeda(subtotal + frete);
        }
      };
      atualizarResumo();

      document.getElementById('qtd-menos').addEventListener('click', () => {
        if (quantidade > 1) {
          quantidade -= 1;
          atualizarResumo();
        }
      });
      document.getElementById('qtd-mais').addEventListener('click', () => {
        quantidade += 1;
        atualizarResumo();
      });
      zonaSelect.addEventListener('change', atualizarResumo);

      const formCheckout = document.getElementById('form-checkout');
      formCheckout.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!formCheckout.checkValidity()) {
          formCheckout.classList.add('was-validated');
          return;
        }

        const dados = new FormData(formCheckout);
        const subtotal = precoUnitario * quantidade;
        const zona = dados.get('zona');
        const frete = calcularFrete(subtotal, zona) ?? 0;
        const total = subtotal + frete;

        const mensagem = [
          '*Novo pedido — Yeshua Marmitas Fit*',
          `Prato: ${prato}`,
          `Tamanho: ${tamanho}`,
          `Quantidade: ${quantidade}`,
          `Subtotal: ${formatarMoeda(subtotal)}`,
          `Frete (${zona}): ${frete === 0 ? 'Grátis' : formatarMoeda(frete)}`,
          `*Total: ${formatarMoeda(total)}*`,
          '',
          `Nome: ${dados.get('nome')}`,
          `Telefone: ${dados.get('telefone')}`,
          `Endereço: ${dados.get('endereco')}`,
          `Complemento: ${dados.get('complemento') || '—'}`,
          `Bairro: ${dados.get('bairro')}`,
          `Zona de entrega: ${zona}`,
          `Data desejada de entrega: ${dados.get('data-entrega')}`,
          `Forma de pagamento: ${dados.get('pagamento')}`,
        ].join('\n');

        const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank', 'noopener');

        const alerta = document.getElementById('alerta-checkout');
        alerta.classList.remove('d-none');
        alerta.scrollIntoView({ behavior: 'smooth', block: 'center' });
        formCheckout.reset();
        formCheckout.classList.remove('was-validated');
        atualizarResumo();
      });
    }
  }

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
