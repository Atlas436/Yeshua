import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { supabase } from './supabase.js';

// Salva o pedido no banco em segundo plano — nunca atrasa/bloqueia o
// window.open do WhatsApp (que precisa rodar sincronamente pro navegador
// não bloquear o popup) nem impede o pedido de seguir se o banco falhar.
function salvarPedidoNoBanco(pedido) {
  supabase.from('pedidos').insert(pedido).then(({ error }) => {
    if (error) console.error('Não foi possível salvar o pedido no banco:', error);
  });
}

export const WHATSAPP_NUMERO = '5511998686034';

// Frete fixo por zona — como a marmita vai congelada, a entrega não precisa
// ser imediata: dá pra agrupar pedidos por região e rota, por isso o valor é
// fixo por zona (e não calculado por distância/tempo real).
// ⚠️ Ajuste os valores para os reais praticados pela Yeshua.
export const FRETE_POR_ZONA = {
  'Centro': 12,
  'Zona Oeste': 12,
  'Zona Sul': 18,
  'Zona Norte': 18,
  'Zona Leste': 18,
  'Grande São Paulo': 25,
};

// ⚠️ Valor mínimo em pratos (sem contar o frete) para o frete sair grátis.
export const FRETE_GRATIS_ACIMA_DE = 150;

// Tamanhos do montador de marmita: pesos por categoria (g) e preço de venda.
// Preço = custo_total / (1 - margem_lucro); ver especificação técnica do cardápio.
export const TAMANHOS_MARMITA = {
  P: { pesoTotal: 320, proteina: 150, carboidrato: 100, legume: 70, preco: 14.0 },
  M: { pesoTotal: 450, proteina: 200, carboidrato: 150, legume: 100, preco: 19.0 },
  G: { pesoTotal: 600, proteina: 250, carboidrato: 200, legume: 150, preco: 25.0 },
};

const formatarMoeda = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

// ---------- Carrinho (persistido no navegador via localStorage) ----------
const CARRINHO_STORAGE_KEY = 'yeshua_carrinho';

function obterCarrinho() {
  try {
    const dados = JSON.parse(localStorage.getItem(CARRINHO_STORAGE_KEY));
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function salvarCarrinho(itens) {
  localStorage.setItem(CARRINHO_STORAGE_KEY, JSON.stringify(itens));
  atualizarBadgeCarrinho();
}

function adicionarAoCarrinho({ tamanho, descricao, preco }) {
  const itens = obterCarrinho();
  const chave = `${tamanho}|${descricao}`;
  const existente = itens.find((item) => item.chave === chave);
  if (existente) {
    existente.quantidade += 1;
  } else {
    itens.push({ chave, tamanho, descricao, preco, quantidade: 1 });
  }
  salvarCarrinho(itens);
}

function atualizarBadgeCarrinho() {
  document.querySelectorAll('#carrinho-contador').forEach((badge) => {
    const total = obterCarrinho().reduce((soma, item) => soma + item.quantidade, 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline-block' : 'none';
  });
}

// ---------- Tela de carregamento (evita o "susto" do leão surgindo de repente) ----------
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('loader-oculto');
    setTimeout(() => loader.remove(), 500);
  }, 350);
});

// ---------- Acessibilidade: aumentar tamanho do texto ----------
const TEXTO_STORAGE_KEY = 'yeshua_tamanho_texto';
const TAMANHOS_TEXTO = ['normal', 'grande', 'extra-grande'];

function aplicarTamanhoTexto(tamanho) {
  document.documentElement.classList.remove('texto-grande', 'texto-extra-grande');
  if (tamanho === 'grande') document.documentElement.classList.add('texto-grande');
  if (tamanho === 'extra-grande') document.documentElement.classList.add('texto-extra-grande');
}

aplicarTamanhoTexto(localStorage.getItem(TEXTO_STORAGE_KEY) || 'normal');

function mudarTamanhoTexto(delta) {
  const atual = localStorage.getItem(TEXTO_STORAGE_KEY) || 'normal';
  const idxAtual = TAMANHOS_TEXTO.indexOf(atual);
  const idxNovo = Math.min(TAMANHOS_TEXTO.length - 1, Math.max(0, idxAtual + delta));
  const novo = TAMANHOS_TEXTO[idxNovo];
  localStorage.setItem(TEXTO_STORAGE_KEY, novo);
  aplicarTamanhoTexto(novo);
}

document.addEventListener('DOMContentLoaded', () => {
  atualizarBadgeCarrinho();

  document.querySelectorAll('.botao-fonte-mais').forEach((botao) => {
    botao.addEventListener('click', () => mudarTamanhoTexto(1));
  });
  document.querySelectorAll('.botao-fonte-menos').forEach((botao) => {
    botao.addEventListener('click', () => mudarTamanhoTexto(-1));
  });

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
    const GRUPOS_INGREDIENTE = [
      'proteina', 'ovoPreparo', 'frangoPreparo', 'carneMoidaPreparo', 'peixePreparo',
      'carboidrato', 'molho', 'arrozTipo', 'feijaoTipo', 'pureBatataTipo', 'escondidinhoProteina',
      'complementoCarboidrato', 'complementoArrozTipo', 'complementoPureBatataTipo',
      'legume', 'legumePreparo',
    ];

    // Sub-preparos que dependem de um ingrediente "pai" e precisam ser limpos quando ele muda.
    const DEPENDENTES = {
      proteina: ['ovoPreparo', 'frangoPreparo', 'carneMoidaPreparo', 'peixePreparo'],
      carboidrato: ['molho', 'arrozTipo', 'feijaoTipo', 'pureBatataTipo', 'escondidinhoProteina', 'complementoCarboidrato', 'complementoArrozTipo', 'complementoPureBatataTipo'],
      complementoCarboidrato: ['complementoArrozTipo', 'complementoPureBatataTipo'],
    };

    // Descrição rápida das proteínas que não têm sub-preparo — só aparece quando a pessoa escolhe aquele chip.
    const DESCRICOES_PROTEINA = {
      'Carne de panela': 'Cozida bem devagar até desmanchar, com batata e cenoura no caldo.',
      'Frango assado': 'Assado no forno com ervas.',
      'Bife (iscas/tiras)': 'Grelhado na chapa, em tiras.',
      'Frango desfiado': 'Cozido e desfiado, temperado.',
      'Almôndegas': 'Ao molho vermelho, feitas com carne moída.',
      'Carne de jaca': 'Desfiada e temperada, substituto vegano de carne.',
    };

    // Descrição rápida das opções de preparo do ovo que não são autoexplicativas.
    const DESCRICOES_OVO_PREPARO = {
      'Omelete fit': 'Frango desfiado, espinafre e queijo branco.',
    };

    const selecao = Object.fromEntries(GRUPOS_INGREDIENTE.map((g) => [g, null]));
    selecao.tamanho = null;

    const pesoProteinaEl = document.getElementById('pesoProteina');
    const pesoCarboidratoEl = document.getElementById('pesoCarboidrato');
    const pesoLegumeEl = document.getElementById('pesoLegume');
    const pesoComplementoFeijaoEl = document.getElementById('pesoComplementoFeijao');
    const blocoOvoPreparo = document.getElementById('blocoOvoPreparo');
    const blocoOvoPreparoDescricao = document.getElementById('blocoOvoPreparoDescricao');
    const blocoFrangoPreparo = document.getElementById('blocoFrangoPreparo');
    const blocoCarneMoidaPreparo = document.getElementById('blocoCarneMoidaPreparo');
    const blocoPeixePreparo = document.getElementById('blocoPeixePreparo');
    const blocoProteinaDescricao = document.getElementById('blocoProteinaDescricao');
    const blocoMolho = document.getElementById('blocoMolho');
    const blocoArrozTipo = document.getElementById('blocoArrozTipo');
    const blocoFeijaoTipo = document.getElementById('blocoFeijaoTipo');
    const blocoPureBatataTipo = document.getElementById('blocoPureBatataTipo');
    const blocoEscondidinhoProteina = document.getElementById('blocoEscondidinhoProteina');
    const blocoFeijaoComplemento = document.getElementById('blocoFeijaoComplemento');
    const blocoComplementoArrozTipo = document.getElementById('blocoComplementoArrozTipo');
    const blocoComplementoPureBatataTipo = document.getElementById('blocoComplementoPureBatataTipo');
    const blocoLegumePreparo = document.getElementById('blocoLegumePreparo');
    const btnFinalizar = document.getElementById('btnFinalizarMontagem');
    const detalheTamanhoEl = document.getElementById('detalheTamanhoSelecionado');
    const alertaCarrinho = document.getElementById('alerta-carrinho');

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

    // Monta os textos finais (usados no resumo ao vivo e na descrição enviada pro carrinho)
    // e indica se cada grupo já está completo, considerando os sub-preparos obrigatórios.
    const composicaoAtual = () => {
      let proteinaTxt = selecao.proteina || '—';
      let proteinaCompleta = Boolean(selecao.proteina);
      if (selecao.proteina === 'Ovo') {
        proteinaCompleta = Boolean(selecao.ovoPreparo);
        proteinaTxt = selecao.ovoPreparo ? `Ovo — ${selecao.ovoPreparo}` : 'Ovo (escolha o preparo)';
      } else if (selecao.proteina === 'Filé de frango') {
        proteinaCompleta = Boolean(selecao.frangoPreparo);
        proteinaTxt = selecao.frangoPreparo ? `Filé de frango — ${selecao.frangoPreparo}` : 'Filé de frango (escolha o preparo)';
      } else if (selecao.proteina === 'Carne moída') {
        proteinaCompleta = Boolean(selecao.carneMoidaPreparo);
        proteinaTxt = selecao.carneMoidaPreparo ? `Carne moída — ${selecao.carneMoidaPreparo}` : 'Carne moída (escolha o preparo)';
      } else if (selecao.proteina === 'Peixe (filé)') {
        proteinaCompleta = Boolean(selecao.peixePreparo);
        proteinaTxt = selecao.peixePreparo ? `Peixe (filé) — ${selecao.peixePreparo}` : 'Peixe (filé) (escolha o preparo)';
      }

      let carboidratoTxt = selecao.carboidrato || '—';
      let carboidratoCompleta = Boolean(selecao.carboidrato);
      if (selecao.carboidrato === 'Macarrão') {
        carboidratoCompleta = Boolean(selecao.molho);
        carboidratoTxt = selecao.molho ? `Macarrão (molho ${selecao.molho})` : 'Macarrão (escolha o molho)';
      } else if (selecao.carboidrato === 'Arroz') {
        carboidratoCompleta = Boolean(selecao.arrozTipo);
        carboidratoTxt = selecao.arrozTipo ? `Arroz ${selecao.arrozTipo.toLowerCase()}` : 'Arroz (escolha o tipo)';
      } else if (selecao.carboidrato === 'Purê de batata') {
        carboidratoCompleta = Boolean(selecao.pureBatataTipo);
        carboidratoTxt = selecao.pureBatataTipo ? `Purê de ${selecao.pureBatataTipo.toLowerCase()}` : 'Purê de batata (escolha o tipo)';
      } else if (selecao.carboidrato === 'Escondidinho') {
        carboidratoCompleta = Boolean(selecao.escondidinhoProteina);
        carboidratoTxt = selecao.escondidinhoProteina ? `Escondidinho de ${selecao.escondidinhoProteina}` : 'Escondidinho (escolha a proteína)';
      } else if (selecao.carboidrato === 'Feijão') {
        const tipoTxt = selecao.feijaoTipo ? `Feijão ${selecao.feijaoTipo.toLowerCase()}` : 'Feijão (escolha o tipo)';

        let complementoTxt = selecao.complementoCarboidrato;
        let complementoCompleto = Boolean(selecao.complementoCarboidrato);
        if (selecao.complementoCarboidrato === 'Arroz') {
          complementoCompleto = Boolean(selecao.complementoArrozTipo);
          complementoTxt = selecao.complementoArrozTipo ? `Arroz ${selecao.complementoArrozTipo.toLowerCase()}` : 'Arroz (escolha o tipo)';
        } else if (selecao.complementoCarboidrato === 'Purê de batata') {
          complementoCompleto = Boolean(selecao.complementoPureBatataTipo);
          complementoTxt = selecao.complementoPureBatataTipo ? `Purê de ${selecao.complementoPureBatataTipo.toLowerCase()}` : 'Purê de batata (escolha o tipo)';
        }

        carboidratoCompleta = Boolean(selecao.feijaoTipo && selecao.complementoCarboidrato && complementoCompleto);
        carboidratoTxt = selecao.complementoCarboidrato ? `${tipoTxt} + ${complementoTxt}` : `${tipoTxt}, complete a porção`;
      }

      let legumeTxt = selecao.legume || '—';
      let legumeCompleto = Boolean(selecao.legume);
      if (selecao.legume) {
        legumeCompleto = Boolean(selecao.legumePreparo);
        legumeTxt = selecao.legumePreparo ? `${selecao.legume} — ${selecao.legumePreparo}` : `${selecao.legume} (escolha o preparo)`;
      }

      return { proteinaTxt, proteinaCompleta, carboidratoTxt, carboidratoCompleta, legumeTxt, legumeCompleto };
    };

    const atualizarMontador = () => {
      if (selecao.tamanho) {
        const t = TAMANHOS_MARMITA[selecao.tamanho];
        pesoProteinaEl.textContent = `· ${t.proteina}g`;
        pesoLegumeEl.textContent = `· ${t.legume}g`;
        detalheTamanhoEl.textContent = `Tamanho ${selecao.tamanho}: proteína ${t.proteina}g · carboidrato ${t.carboidrato}g · legumes ${t.legume}g`;
        if (selecao.carboidrato === 'Feijão') {
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
        detalheTamanhoEl.textContent = '';
      }

      blocoOvoPreparo.classList.toggle('d-none', selecao.proteina !== 'Ovo');
      const descricaoOvoPreparo = DESCRICOES_OVO_PREPARO[selecao.ovoPreparo];
      blocoOvoPreparoDescricao.textContent = descricaoOvoPreparo || '';
      blocoOvoPreparoDescricao.classList.toggle('d-none', !descricaoOvoPreparo);
      blocoFrangoPreparo.classList.toggle('d-none', selecao.proteina !== 'Filé de frango');
      blocoCarneMoidaPreparo.classList.toggle('d-none', selecao.proteina !== 'Carne moída');
      blocoPeixePreparo.classList.toggle('d-none', selecao.proteina !== 'Peixe (filé)');
      const descricaoProteina = DESCRICOES_PROTEINA[selecao.proteina];
      blocoProteinaDescricao.textContent = descricaoProteina || '';
      blocoProteinaDescricao.classList.toggle('d-none', !descricaoProteina);
      blocoMolho.classList.toggle('d-none', selecao.carboidrato !== 'Macarrão');
      blocoArrozTipo.classList.toggle('d-none', selecao.carboidrato !== 'Arroz');
      blocoPureBatataTipo.classList.toggle('d-none', selecao.carboidrato !== 'Purê de batata');
      blocoEscondidinhoProteina.classList.toggle('d-none', selecao.carboidrato !== 'Escondidinho');
      blocoFeijaoTipo.classList.toggle('d-none', selecao.carboidrato !== 'Feijão');
      blocoFeijaoComplemento.classList.toggle('d-none', selecao.carboidrato !== 'Feijão');
      blocoComplementoArrozTipo.classList.toggle('d-none', selecao.complementoCarboidrato !== 'Arroz');
      blocoComplementoPureBatataTipo.classList.toggle('d-none', selecao.complementoCarboidrato !== 'Purê de batata');
      blocoLegumePreparo.classList.toggle('d-none', !selecao.legume);

      const { proteinaTxt, proteinaCompleta, carboidratoTxt, carboidratoCompleta, legumeTxt, legumeCompleto } = composicaoAtual();

      document.getElementById('resumoTamanhoTxt').textContent = selecao.tamanho || '—';
      document.getElementById('resumoProteinaTxt').textContent = proteinaTxt;
      document.getElementById('resumoCarboidratoTxt').textContent = carboidratoTxt;
      document.getElementById('resumoLegumeTxt').textContent = legumeTxt;

      const preco = selecao.tamanho ? TAMANHOS_MARMITA[selecao.tamanho].preco : 0;
      document.getElementById('resumoPrecoTxt').textContent = formatarMoeda(preco);

      btnFinalizar.disabled = !(
        selecao.tamanho
        && selecao.proteina && proteinaCompleta
        && selecao.carboidrato && carboidratoCompleta
        && selecao.legume && legumeCompleto
      );
    };

    const limparSelecao = () => {
      GRUPOS_INGREDIENTE.forEach((g) => { selecao[g] = null; });
      selecao.tamanho = null;
      document.querySelectorAll('[data-tamanho-marmita]').forEach((c) => c.classList.remove('active'));
      GRUPOS_INGREDIENTE.forEach((g) => selecionarChip(g, null));
      atualizarMontador();
    };

    document.querySelectorAll('[data-tamanho-marmita]').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('[data-tamanho-marmita]').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        selecao.tamanho = chip.dataset.tamanhoMarmita;
        atualizarMontador();
      });
    });

    GRUPOS_INGREDIENTE.forEach((grupo) => {
      document.querySelectorAll(`[data-grupo-ingrediente="${grupo}"] .chip-ingrediente`).forEach((chip) => {
        chip.addEventListener('click', () => {
          const valor = chip.dataset.valor;
          const dependentes = DEPENDENTES[grupo];
          if (dependentes && selecao[grupo] !== valor) {
            dependentes.forEach((dep) => {
              selecao[dep] = null;
              selecionarChip(dep, null);
            });
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
      const { proteinaTxt, carboidratoTxt, legumeTxt } = composicaoAtual();
      const descricao = `${proteinaTxt}, ${carboidratoTxt}, ${legumeTxt}`;
      const preco = TAMANHOS_MARMITA[tamanho].preco;

      adicionarAoCarrinho({ tamanho, descricao, preco });
      limparSelecao();

      alertaCarrinho.classList.remove('d-none');
      alertaCarrinho.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    atualizarMontador();
  }

  // ---------- Carrinho: listar, ajustar quantidade e remover itens ----------
  const carrinhoListaEl = document.getElementById('carrinho-lista');
  if (carrinhoListaEl) {
    const carrinhoVazioEl = document.getElementById('carrinho-vazio');
    const carrinhoResumoEl = document.getElementById('carrinho-resumo');
    const carrinhoSubtotalEl = document.getElementById('carrinho-subtotal');
    const carrinhoAdicionarOutraEl = document.getElementById('carrinho-adicionar-outra');

    const renderizarCarrinho = () => {
      const itens = obterCarrinho();

      if (itens.length === 0) {
        carrinhoListaEl.innerHTML = '';
        carrinhoVazioEl.classList.remove('d-none');
        carrinhoResumoEl.classList.add('d-none');
        carrinhoAdicionarOutraEl.classList.add('d-none');
        return;
      }

      carrinhoVazioEl.classList.add('d-none');
      carrinhoResumoEl.classList.remove('d-none');
      carrinhoAdicionarOutraEl.classList.remove('d-none');

      carrinhoListaEl.innerHTML = itens.map((item, indice) => `
        <div class="card-yeshua p-4 mb-3 d-flex flex-row justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <span class="badge badge-categoria rounded-pill mb-2">Marmita ${item.tamanho}</span>
            <p class="fw-semibold mb-1">${item.descricao}</p>
            <p class="small text-dourado-claro mb-0">${formatarMoeda(item.preco)} cada</p>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-outline-dourado btn-sm" data-carrinho-menos="${indice}" aria-label="Diminuir quantidade">−</button>
            <span class="fonte-titulo" style="min-width: 1.5rem; text-align: center;">${item.quantidade}</span>
            <button type="button" class="btn btn-outline-dourado btn-sm" data-carrinho-mais="${indice}" aria-label="Aumentar quantidade">+</button>
            <span class="fonte-titulo text-dourado ms-2" style="min-width: 5rem; text-align: right;">${formatarMoeda(item.preco * item.quantidade)}</span>
            <button type="button" class="btn btn-terracota btn-sm" data-carrinho-remover="${indice}" aria-label="Remover item"><svg class="icone-linha" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>
          </div>
        </div>
      `).join('');

      const subtotal = itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
      carrinhoSubtotalEl.textContent = formatarMoeda(subtotal);

      carrinhoListaEl.querySelectorAll('[data-carrinho-mais]').forEach((botao) => {
        botao.addEventListener('click', () => {
          const atuais = obterCarrinho();
          atuais[Number(botao.dataset.carrinhoMais)].quantidade += 1;
          salvarCarrinho(atuais);
          renderizarCarrinho();
        });
      });
      carrinhoListaEl.querySelectorAll('[data-carrinho-menos]').forEach((botao) => {
        botao.addEventListener('click', () => {
          const atuais = obterCarrinho();
          const indice = Number(botao.dataset.carrinhoMenos);
          if (atuais[indice].quantidade > 1) {
            atuais[indice].quantidade -= 1;
          } else {
            atuais.splice(indice, 1);
          }
          salvarCarrinho(atuais);
          renderizarCarrinho();
        });
      });
      carrinhoListaEl.querySelectorAll('[data-carrinho-remover]').forEach((botao) => {
        botao.addEventListener('click', () => {
          const atuais = obterCarrinho();
          atuais.splice(Number(botao.dataset.carrinhoRemover), 1);
          salvarCarrinho(atuais);
          renderizarCarrinho();
        });
      });
    };

    renderizarCarrinho();
  }

  // ---------- Checkout: resumo do carrinho, frete e finalização ----------
  const checkoutConteudo = document.getElementById('checkout-conteudo');
  if (checkoutConteudo) {
    const itensCarrinho = obterCarrinho();

    if (itensCarrinho.length === 0) {
      checkoutConteudo.classList.add('d-none');
      document.getElementById('checkout-vazio').classList.remove('d-none');
    } else {
      document.getElementById('frete-gratis-valor').textContent = formatarMoeda(FRETE_GRATIS_ACIMA_DE);

      const itensListaEl = document.getElementById('checkout-itens-lista');
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

      const subtotalCarrinho = () => itensCarrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);

      const renderizarItens = () => {
        itensListaEl.innerHTML = itensCarrinho.map((item) => `
          <div class="d-flex justify-content-between align-items-start mb-3 pb-3" style="border-bottom: 1px solid rgba(232,115,15,0.15);">
            <div style="max-width: 70%;">
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge badge-categoria rounded-pill">${item.tamanho}</span>
                <span class="fw-semibold">Marmita ${item.tamanho}</span>
              </div>
              <p class="small mb-0" style="color: rgba(40, 14, 4,0.65);">${item.descricao}</p>
              <p class="small mb-0 text-dourado-claro">${item.quantidade} × ${formatarMoeda(item.preco)}</p>
            </div>
            <span class="text-dourado-claro fw-semibold">${formatarMoeda(item.preco * item.quantidade)}</span>
          </div>
        `).join('');
      };

      const atualizarResumo = () => {
        const subtotal = subtotalCarrinho();
        const zona = zonaSelect.value;
        const frete = calcularFrete(subtotal, zona);

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

      renderizarItens();
      atualizarResumo();
      zonaSelect.addEventListener('change', atualizarResumo);

      const formCheckout = document.getElementById('form-checkout');
      formCheckout.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!formCheckout.checkValidity()) {
          formCheckout.classList.add('was-validated');
          return;
        }

        const dados = new FormData(formCheckout);
        const subtotal = subtotalCarrinho();
        const zona = dados.get('zona');
        const frete = calcularFrete(subtotal, zona) ?? 0;
        const total = subtotal + frete;

        const linhasItens = itensCarrinho.map(
          (item) => `${item.quantidade}x Marmita ${item.tamanho} (${item.descricao}) — ${formatarMoeda(item.preco * item.quantidade)}`
        );

        const mensagem = [
          '*Novo pedido — Yeshua Marmitas Fit*',
          ...linhasItens,
          '',
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

        salvarPedidoNoBanco({
          origem: 'checkout',
          nome: dados.get('nome'),
          telefone: dados.get('telefone'),
          endereco: dados.get('endereco'),
          bairro: dados.get('bairro'),
          zona,
          itens: itensCarrinho,
          subtotal,
          frete,
          total,
          forma_pagamento: dados.get('pagamento'),
          observacoes: `Complemento: ${dados.get('complemento') || '—'} · Data desejada: ${dados.get('data-entrega')}`,
        });

        salvarCarrinho([]);

        const alerta = document.getElementById('alerta-checkout');
        alerta.classList.remove('d-none');
        alerta.scrollIntoView({ behavior: 'smooth', block: 'center' });
        formCheckout.reset();
        formCheckout.classList.remove('was-validated');
      });
    }
  }

  // ---------- Formulário: Pedido personalizado (fora do cardápio fixo) -> WhatsApp ----------
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
        '*Novo pedido personalizado (fora do cardápio) — Yeshua Marmitas Fit*',
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

      salvarPedidoNoBanco({
        origem: 'personalizado',
        nome,
        telefone,
        bairro,
        itens: [{ tamanho, quantidade, proteina }],
        observacoes: `Restrições: ${restricoes} · Data desejada: ${dataEntrega} · Observações: ${observacoes}`,
      });

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
