// Sistema de Cadastro de Clientes - Dayane Diniz
// Script principal

// Variáveis globais
let clientes = [];
let clienteEmEdicao = null;
let confirmCallback = null;

// Elementos DOM
const clientForm = document.getElementById("clientForm");
const clientesTableBody = document.getElementById("clientesTableBody");
const semRegistros = document.getElementById("semRegistros");
const formTitle = document.getElementById("formTitle");
const btnCancelar = document.getElementById("btnCancelar");
const btnRelatorio = document.getElementById("btnRelatorio");
const btnBackup = document.getElementById("btnBackup");
const btnRestore = document.getElementById("btnRestore");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");
const filtroNome = document.getElementById("filtroNome");
const filtroStatus = document.getElementById("filtroStatus");
const filtroServico = document.getElementById("filtroServico");

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Carregar dados do localStorage
  carregarClientes();

  // Configurar eventos
  clientForm.addEventListener("submit", salvarCliente);
  btnCancelar.addEventListener("click", cancelarEdicao);
  btnRelatorio.addEventListener("click", gerarRelatorio);
  btnBackup.addEventListener("click", fazerBackup);
  btnRestore.addEventListener("click", abrirModalRestauracao);
  btnLimparFiltros.addEventListener("click", limparFiltros);

  // Configurar eventos de filtro
  filtroNome.addEventListener("input", aplicarFiltros);
  filtroStatus.addEventListener("change", aplicarFiltros);
  filtroServico.addEventListener("change", aplicarFiltros);

  // Configurar modal de confirmação
  document.getElementById("btnConfirm").addEventListener("click", () => {
    if (confirmCallback) {
      confirmCallback();
      fecharModal("confirmModal");
    }
  });

  // Configurar modal de restauração
  document.getElementById("btnConfirmRestore").addEventListener("click", restaurarDados);

  // Formatar campo de CPF
  document.getElementById("cpf").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{3})$/, "$1.$2");
    }

    e.target.value = value;
  });

  // Atualizar tabela
  atualizarTabela();
});

// Funções principais
function carregarClientes() {
  const clientesJSON = localStorage.getItem("dayane_clientes");
  if (clientesJSON) {
    clientes = JSON.parse(clientesJSON);
  }
}

function salvarNoLocalStorage() {
  localStorage.setItem("dayane_clientes", JSON.stringify(clientes));
}

function salvarCliente(event) {
  event.preventDefault();

  // Obter valores do formulário
  const id = document.getElementById("clientId").value || gerarId();
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const cpf = document.getElementById("cpf").value;
  const servico = document.getElementById("servico").value;
  const data = document.getElementById("data").value;
  const valor = document.getElementById("valor").value
    ? parseFloat(document.getElementById("valor").value)
    : 0;
  const pago = document.getElementById("pago").checked;
  const observacoes = document.getElementById("observacoes").value;

  // Criar objeto cliente
  const cliente = {
    id,
    nome,
    email,
    cpf,
    servico,
    data,
    valor,
    pago,
    observacoes,
    dataRegistro: clienteEmEdicao
      ? clienteEmEdicao.dataRegistro
      : new Date().toISOString(),
  };

  // Verificar se é edição ou novo cadastro
  if (clienteEmEdicao) {
    // Atualizar cliente existente
    const index = clientes.findIndex((c) => c.id === id);
    if (index !== -1) {
      clientes[index] = cliente;
    }
    clienteEmEdicao = null;
  } else {
    // Adicionar novo cliente
    clientes.push(cliente);
  }

  // Salvar no localStorage
  salvarNoLocalStorage();

  // Limpar formulário e atualizar tabela
  clientForm.reset();
  document.getElementById("clientId").value = "";
  formTitle.textContent = "Cadastrar Cliente";
  btnCancelar.style.display = "none";

  // Atualizar tabela
  atualizarTabela();

  // Mostrar mensagem de sucesso
  mostrarAlerta("Cliente salvo com sucesso!", "success");
}

function atualizarTabela() {
  // Limpar tabela
  clientesTableBody.innerHTML = "";

  // Aplicar filtros
  const clientesFiltrados = filtrarClientes();

  // Verificar se há registros
  if (clientesFiltrados.length === 0) {
    semRegistros.style.display = "block";
    return;
  }

  semRegistros.style.display = "none";

  // Ordenar por data (mais recente primeiro)
  clientesFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

  // Adicionar clientes à tabela
  clientesFiltrados.forEach((cliente) => {
    const tr = document.createElement("tr");
    if (!cliente.pago) {
      tr.classList.add("cliente-pendente");
    }

    // Formatar data
    const dataFormatada = formatarData(cliente.data);

    // Formatar valor
    const valorFormatado = formatarMoeda(cliente.valor);

    tr.innerHTML = `
            <td>${cliente.nome}</td>
            <td>${cliente.servico}</td>
            <td>${dataFormatada}</td>
            <td>${valorFormatado}</td>
            <td>
                <span class="status-badge ${cliente.pago ? "status-pago" : "status-pendente"}">
                    ${cliente.pago ? "Pago" : "Pendente"}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${cliente.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${cliente.id}" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info btn-historico" data-id="${cliente.id}" data-nome="${cliente.nome}" title="Histórico">
                        <i class="fas fa-history"></i>
                    </button>
                </div>
            </td>
        `;

    clientesTableBody.appendChild(tr);
  });

  // Adicionar eventos aos botões
  document.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.addEventListener("click", () => editarCliente(btn.dataset.id));
  });

  document.querySelectorAll(".btn-excluir").forEach((btn) => {
    btn.addEventListener("click", () => confirmarExclusao(btn.dataset.id));
  });

  document.querySelectorAll(".btn-historico").forEach((btn) => {
    btn.addEventListener("click", () => mostrarHistorico(btn.dataset.id, btn.dataset.nome));
  });
}

function filtrarClientes() {
  const nome = filtroNome.value.toLowerCase();
  const status = filtroStatus.value;
  const servico = filtroServico.value;

  return clientes.filter((cliente) => {
    // Filtrar por nome
    if (nome && !cliente.nome.toLowerCase().includes(nome)) {
      return false;
    }

    // Filtrar por status
    if (status && cliente.pago.toString() !== status) {
      return false;
    }

    // Filtrar por serviço
    if (servico && cliente.servico !== servico) {
      return false;
    }

    return true;
  });
}

function aplicarFiltros() {
  atualizarTabela();
}

function limparFiltros() {
  filtroNome.value = "";
  filtroStatus.value = "";
  filtroServico.value = "";
  aplicarFiltros();
}

function editarCliente(id) {
  // Encontrar cliente pelo ID
  const cliente = clientes.find((c) => c.id === id);
  if (!cliente) return;

  // Preencher formulário
  document.getElementById("clientId").value = cliente.id;
  document.getElementById("nome").value = cliente.nome;
  document.getElementById("email").value = cliente.email || "";
  document.getElementById("cpf").value = cliente.cpf || "";
  document.getElementById("servico").value = cliente.servico;
  document.getElementById("data").value = cliente.data;
  document.getElementById("valor").value = cliente.valor || "";
  document.getElementById("pago").checked = cliente.pago;
  document.getElementById("observacoes").value = cliente.observacoes || "";

  // Atualizar estado
  clienteEmEdicao = cliente;
  formTitle.textContent = "Editar Cliente";
  btnCancelar.style.display = "block";

  // Rolar para o formulário
  document.querySelector(".card").scrollIntoView({ behavior: "smooth" });
}

function cancelarEdicao() {
  clientForm.reset();
  document.getElementById("clientId").value = "";
  clienteEmEdicao = null;
  formTitle.textContent = "Cadastrar Cliente";
  btnCancelar.style.display = "none";
}

function confirmarExclusao(id) {
  confirmCallback = () => excluirCliente(id);
  document.getElementById("confirmMessage").textContent = "Tem certeza que deseja excluir este cliente?";
  abrirModal("confirmModal");
}

function excluirCliente(id) {
  // Remover cliente
  clientes = clientes.filter((c) => c.id !== id);

  // Salvar no localStorage
  salvarNoLocalStorage();

  // Atualizar tabela
  atualizarTabela();

  // Mostrar mensagem
  mostrarAlerta("Cliente excluído com sucesso!", "success");
}

function mostrarHistorico(clienteId, clienteNome) {
  // Encontrar todos os atendimentos do cliente (pelo CPF ou email)
  const cliente = clientes.find((c) => c.id === clienteId);
  if (!cliente) return;

  const historicoTableBody = document.getElementById("historicoTableBody");
  historicoTableBody.innerHTML = "";

  // Identificador único (CPF ou email)
  const identificador = cliente.cpf || cliente.email;

  // Se não tiver identificador, mostrar apenas o registro atual
  let atendimentos = [];

  if (identificador) {
    // Buscar todos os atendimentos com o mesmo CPF ou email
    atendimentos = clientes.filter((c) => {
      const cpfMatch = c.cpf && c.cpf === cliente.cpf && cliente.cpf;
      const emailMatch = c.email && c.email === cliente.email && cliente.email;
      return cpfMatch || emailMatch;
    });
  } else {
    // Se não tiver identificador, mostrar apenas este cliente
    atendimentos = [cliente];
  }

  // Ordenar por data (mais recente primeiro)
  atendimentos.sort((a, b) => new Date(b.data) - new Date(a.data));

  // Adicionar à tabela
  atendimentos.forEach((atendimento) => {
    const tr = document.createElement("tr");
    const dataFormatada = formatarData(atendimento.data);
    const valorFormatado = formatarMoeda(atendimento.valor);

    tr.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${atendimento.servico}</td>
            <td>${valorFormatado}</td>
            <td>
                <span class="status-badge ${atendimento.pago ? "status-pago" : "status-pendente"}">
                    ${atendimento.pago ? "Pago" : "Pendente"}
                </span>
            </td>
            <td>${atendimento.observacoes || "-"}</td>
        `;

    historicoTableBody.appendChild(tr);
  });

  // Abrir modal
  abrirModal("historicoModal");
}

// Funções de Backup e Restauração
function fazerBackup() {
  const backup = {
    data: new Date().toISOString(),
    clientes: clientes,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `backup-dayane-${new Date().toISOString().split("T")[0]}.json`;
  link.click();

  mostrarAlerta("Backup realizado com sucesso!", "success");
}

function abrirModalRestauracao() {
  abrirModal("restoreModal");
}

function restaurarDados() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    mostrarAlerta("Selecione um arquivo de backup!", "warning");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result);

      if (!backup.clientes || !Array.isArray(backup.clientes)) {
        mostrarAlerta("Arquivo de backup inválido!", "danger");
        return;
      }

      clientes = backup.clientes;
      salvarNoLocalStorage();
      atualizarTabela();

      fecharModal("restoreModal");
      mostrarAlerta("Dados restaurados com sucesso!", "success");
    } catch (error) {
      mostrarAlerta("Erro ao restaurar dados: " + error.message, "danger");
    }
  };

  reader.readAsText(file);
}

// Função para gerar relatório CSV
function gerarRelatorio() {
  // Cabeçalho
  let csv =
    "Nome,CPF,Email,Serviço,Data,Valor,Status,Observações\n";

  // Ordenar clientes por data (mais recentes primeiro)
  const clientesOrdenados = [...clientes].sort((a, b) => {
    if (!a.data || !b.data) return 0;
    return new Date(b.data) - new Date(a.data); // Mais recentes primeiro
  });

  // Adicionar dados
  clientesOrdenados.forEach((cliente) => {
    // Escapar campos com vírgulas
    const nome = `"${cliente.nome.replace(/"/g, '"')}"`;
    const cpf = `"${cliente.cpf ? cliente.cpf.replace(/"/g, '"') : ""}"`;
    const email = `"${cliente.email ? cliente.email.replace(/"/g, '"') : ""}"`;
    const servico = `"${cliente.servico.replace(/"/g, '"')}"`;
    const data = `"${formatarData(cliente.data).replace(/"/g, '"')}"`;
    const valor = `"${formatarMoeda(cliente.valor).replace(/"/g, '"')}"`;
    const status = `"${cliente.pago ? "Pago" : "Pendente"}"`;
    const observacoes = `"${cliente.observacoes ? cliente.observacoes.replace(/"/g, '"') : ""}"`;

    csv += `${nome},${cpf},${email},${servico},${data},${valor},${status},${observacoes}\n`;
  });

  // Criar blob e link para download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  // Nome do arquivo com data
  const dataFormatada = new Date().toISOString().split("T")[0];
  const nomeArquivo = `relatorio-clientes-dayane-${dataFormatada}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", nomeArquivo);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  mostrarAlerta("Relatório CSV gerado com sucesso!", "success");
}

function gerarId() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

// Funções auxiliares
function formatarData(dataString) {
  const data = new Date(dataString + "T00:00:00"); // Adiciona T00:00:00 para evitar problemas de fuso horário
  return data.toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function abrirModal(id) {
  const modal = new bootstrap.Modal(document.getElementById(id));
  modal.show();
}

function fecharModal(id) {
  const modalEl = document.getElementById(id);
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

function mostrarAlerta(mensagem, tipo) {
  const alerta = document.createElement("div");
  alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
  alerta.setAttribute("role", "alert");
  alerta.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;

  document.querySelector("main").prepend(alerta);

  setTimeout(() => {
    alerta.classList.remove("show");
    setTimeout(() => alerta.remove(), 300);
  }, 5000);
}
