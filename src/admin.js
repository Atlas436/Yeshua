import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { supabase } from './supabase.js';

const STATUS_LABELS = { novo: 'Novo', preparando: 'Preparando', entregue: 'Entregue', cancelado: 'Cancelado' };

const secaoLogin = document.getElementById('admin-login');
const secaoPainel = document.getElementById('admin-painel');
const formLogin = document.getElementById('form-login');
const loginErro = document.getElementById('login-erro');
const btnLogout = document.getElementById('btn-logout');
const btnAtualizar = document.getElementById('btn-atualizar');
const listaEl = document.getElementById('pedidos-lista');
const vazioEl = document.getElementById('pedidos-vazio');

const formatarMoeda = (valor) => (valor === null || valor === undefined ? '—' : `R$ ${Number(valor).toFixed(2).replace('.', ',')}`);
const formatarData = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function renderizarItens(itens) {
  if (!Array.isArray(itens)) return '';
  return itens
    .map((item) => {
      if (item.descricao) return `${item.quantidade}x Marmita ${item.tamanho} — ${item.descricao}`;
      const partes = [`${item.quantidade || 1}x`, item.tamanho, item.proteina].filter(Boolean);
      return partes.join(' ');
    })
    .join('<br>');
}

async function carregarPedidos() {
  listaEl.innerHTML = '<p class="small" style="color: rgba(40,14,4,0.6);">Carregando…</p>';
  const { data, error } = await supabase.from('pedidos').select('*').order('criado_em', { ascending: false });

  if (error) {
    listaEl.innerHTML = `<div class="alert alert-danger">Erro ao carregar pedidos: ${error.message}</div>`;
    return;
  }

  if (!data.length) {
    vazioEl.classList.remove('d-none');
    listaEl.innerHTML = '';
    return;
  }

  vazioEl.classList.add('d-none');
  listaEl.innerHTML = data
    .map(
      (pedido) => `
    <div class="card-yeshua p-4">
      <div class="d-flex justify-content-between flex-wrap gap-2 mb-2">
        <div>
          <span class="badge badge-categoria rounded-pill me-2">${pedido.origem === 'checkout' ? 'Cardápio fixo' : 'Personalizado'}</span>
          <strong>${pedido.nome}</strong>
        </div>
        <span class="small" style="color: rgba(40,14,4,0.6);">${formatarData(pedido.criado_em)}</span>
      </div>
      <p class="small mb-1" style="color: rgba(40,14,4,0.75);">${renderizarItens(pedido.itens)}</p>
      <p class="small mb-1" style="color: rgba(40,14,4,0.6);">
        Tel: ${pedido.telefone}${pedido.bairro ? ' · Bairro: ' + pedido.bairro : ''}${pedido.zona ? ' · Zona: ' + pedido.zona : ''}
      </p>
      ${pedido.total ? `<p class="fonte-titulo text-dourado mb-2">${formatarMoeda(pedido.total)}</p>` : ''}
      ${pedido.observacoes ? `<p class="small mb-2" style="color: rgba(40,14,4,0.6);">${pedido.observacoes}</p>` : ''}
      <select class="form-select form-select-sm" style="max-width: 200px;" data-pedido-status="${pedido.id}">
        ${Object.entries(STATUS_LABELS)
          .map(([valor, label]) => `<option value="${valor}" ${pedido.status === valor ? 'selected' : ''}>${label}</option>`)
          .join('')}
      </select>
    </div>
  `
    )
    .join('');

  listaEl.querySelectorAll('[data-pedido-status]').forEach((select) => {
    select.addEventListener('change', async () => {
      const id = select.dataset.pedidoStatus;
      const { error: erroUpdate } = await supabase.from('pedidos').update({ status: select.value }).eq('id', id);
      if (erroUpdate) alert('Erro ao atualizar status: ' + erroUpdate.message);
    });
  });
}

function mostrarPainel() {
  secaoLogin.classList.add('d-none');
  secaoPainel.classList.remove('d-none');
  carregarPedidos();
}

function mostrarLogin() {
  secaoPainel.classList.add('d-none');
  secaoLogin.classList.remove('d-none');
}

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErro.classList.add('d-none');
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    loginErro.textContent = 'E-mail ou senha incorretos.';
    loginErro.classList.remove('d-none');
    return;
  }
  mostrarPainel();
});

btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut();
  mostrarLogin();
});

btnAtualizar.addEventListener('click', carregarPedidos);

supabase.auth.getSession().then(({ data }) => {
  if (data.session) mostrarPainel();
  else mostrarLogin();
});

window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('loader-oculto');
    setTimeout(() => loader.remove(), 500);
  }, 200);
});
