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

// Tamanhos do montador de marmita: pesos por categoria (g) e preço de venda.
// Preço = custo_total / (1 - margem_lucro); ver especificação técnica do cardápio.
export const TAMANHOS_MARMITA = {
  P: { pesoTotal: 320, proteina: 150, carboidrato: 100, legume: 70, preco: 14.0 },
  M: { pesoTotal: 450, proteina: 200, carboidrato: 150, legume: 100, preco: 19.0 },
  G: { pesoTotal: 600, proteina: 250, carboidrato: 200, legume: 150, preco: 25.0 },
};

const FEIJOES = ['Feijão carioca', 'Feijão preto'];

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

  // ---------- Cardápio: montador de marmita (tamanho + ingredientes) ----------
  const grupoTamanho = document.getElementById('grupoTamanho');
  if (grupoTamanho) {
    const selecao = {
      tamanho: null,
      proteina: null,
      carboidrato: null,
      molho: null,
      complementoCarboidrato: null,
      legume: null,
    };

    const pesoProteinaEl = document.getElementById('pesoProteina');
    const pesoCarboidratoEl = document.getElementById('pesoCarboidrato');
    const pesoLegumeEl = document.getElementById('pesoLegume');
    const pesoComplementoFeijaoEl = document.getElementById('pesoComplementoFeijao');
    const blocoMolho = document.getElementById('blocoMolho');
    const blocoFeijaoComplemento = document.getElementById('blocoFeijaoComplemento');
    const btnFinalizar = document.getElementById('btnFinalizarMontagem');

    const formatarMoedaMontador = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

    // Regra especial do feijão: 70% do peso de carboidrato vira feijão automaticamente,
    // e o restante precisa ser completado com outro carboidrato (regra da especificação, escalada por tamanho).
    const pesosFeijao = (tamanho) => {
      const totalCarb = TAMANHOS_MARMITA[tamanho].carboidrato;
      const feijao = Math.round(totalCarb * 0.7);
      return { feijao, complemento: totalCarb - feijao };
    };

    const selecionarChip = (grupo, valor) => {
      document.querySelectorAll(`[data-grupo-ingrediente="${grupo}"] .chip-ingrediente`).forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.valor === valor);
      });
    };

    const atualizarMontador = () => {
      if (selecao.tamanho) {
        const t = TAMANHOS_MARMITA[selecao.tamanho];
        pesoProteinaEl.textContent = `· ${t.proteina}g`;
        pesoLegumeEl.textContent = `· ${t.legume}g`;
        if (selecao.carboidrato && FEIJOES.includes(selecao.carboidrato)) {
          const { feijao, complemento } = pesosFeijao(selecao.tamanho);
          pesoCarboidratoEl.textContent = `· ${feijao}g + ${complemento}g`;
          pesoComplementoFeijaoEl.textContent = `${complemento}g`;
        } else {
          pesoCarboidratoEl.textContent = `· ${t.carboidrato}g`;
        }
      } else {
        pesoProteinaEl.textContent = '';
        pesoCarboidratoEl.textContent = '';
        pesoLegumeEl.textContent = '';
      }

      blocoMolho.classList.toggle('d-none', selecao.carboidrato !== 'Macarrão');
      blocoFeijaoComplemento.classList.toggle('d-none', !(selecao.carboidrato && FEIJOES.includes(selecao.carboidrato)));

      document.getElementById('resumoTamanhoTxt').textContent = selecao.tamanho || '—';
      document.getElementById('resumoProteinaTxt').textContent = selecao.proteina || '—';

      let carboidratoTxt = '—';
      if (selecao.carboidrato === 'Macarrão') {
        carboidratoTxt = selecao.molho ? `Macarrão (molho ${selecao.molho})` : 'Macarrão (escolha o molho)';
      } else if (selecao.carboidrato && FEIJOES.includes(selecao.carboidrato)) {
        carboidratoTxt = selecao.complementoCarboidrato
          ? `${selecao.carboidrato} + ${selecao.complementoCarboidrato}`
          : `${selecao.carboidrato} (complete a porção)`;
      } else if (selecao.carboidrato) {
        carboidratoTxt = selecao.carboidrato;
      }
      document.getElementById('resumoCarboidratoTxt').textContent = carboidratoTxt;
      document.getElementById('resumoLegumeTxt').textContent = selecao.legume || '—';

      const preco = selecao.tamanho ? TAMANHOS_MARMITA[selecao.tamanho].preco : 0;
      document.getElementById('resumoPrecoTxt').textContent = formatarMoedaMontador(preco);

      const carboidratoCompleto = selecao.carboidrato
        && (selecao.carboidrato !== 'Macarrão' || selecao.molho)
        && (!FEIJOES.includes(selecao.carboidrato) || selecao.complementoCarboidrato);

      btnFinalizar.disabled = !(selecao.tamanho && selecao.proteina && carboidratoCompleto && selecao.legume);
    };

    document.querySelectorAll('[data-tamanho-marmita]').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('[data-tamanho-marmita]').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        selecao.tamanho = card.dataset.tamanhoMarmita;
        atualizarMontador();
      });
    });

    ['proteina', 'carboidrato', 'molho', 'complementoCarboidrato', 'legume'].forEach((grupo) => {
      document.querySelectorAll(`[data-grupo-ingrediente="${grupo}"] .chip-ingrediente`).forEach((chip) => {
        chip.addEventListener('click', () => {
          const valor = chip.dataset.valor;
          if (grupo === 'carboidrato' && selecao.carboidrato !== valor) {
            selecao.molho = null;
            selecao.complementoCarboidrato = null;
            selecionarChip('molho', null);
            selecionarChip('complementoCarboidrato', null);
          }
          selecao[grupo] = valor;
          selecionarChip(grupo, valor);
          atualizarMontador();
        });
      });
    });

    btnFinalizar.addEventListener('click', () => {
      if (btnFinalizar.disabled) return;
      const tamanho = selecao.tamanho;

      let carboidratoDescricao = selecao.carboidrato;
      if (selecao.carboidrato === 'Macarrão') {
        carboidratoDescricao = `Macarrão (molho ${selecao.molho})`;
      } else if (FEIJOES.includes(selecao.carboidrato)) {
        carboidratoDescricao = `${selecao.carboidrato} + ${selecao.complementoCarboidrato}`;
      }

      const nomePrato = `Marmita ${tamanho} — ${selecao.proteina}, ${carboidratoDescricao}, ${selecao.legume}`;
      const preco = TAMANHOS_MARMITA[tamanho].preco;

      const params = new URLSearchParams({
        prato: nomePrato,
        tamanho,
        preco: preco.toFixed(2),
      });
      window.location.href = `checkout.html?${params.toString()}`;
    });

    atualizarMontador();
  }

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
