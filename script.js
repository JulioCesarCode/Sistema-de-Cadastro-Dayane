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
    atendimentos = clientes.filter(
      (c) =>
        (cliente.cpf && c.cpf === cliente.cpf) ||
        (cliente.email && c.email === cliente.email)
    );
  } else {
    // Apenas o registro atual
    atendimentos = [cliente];
  }

  // Ordenar por data (mais recente primeiro)
  atendimentos.sort((a, b) => new Date(b.data) - new Date(a.data));

  // Mostrar nome do cliente
  document.getElementById("historicoClienteNome").textContent = `Cliente: ${clienteNome}`;

  // Verificar se há histórico
  if (atendimentos.length === 0) {
    document.getElementById("semHistorico").style.display = "block";
    abrirModal("historicoModal");
    return;
  }

  document.getElementById("semHistorico").style.display = "none";

  // Adicionar atendimentos à tabela
  atendimentos.forEach((atendimento) => {
    const tr = document.createElement("tr");

    // Formatar data
    const dataFormatada = formatarData(atendimento.data);

    // Formatar valor
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
        `;

    historicoTableBody.appendChild(tr);
  });

  // Abrir modal
  abrirModal("historicoModal");
}

function gerarRelatorio() {
  // Verificar se há clientes
  if (clientes.length === 0) {
    mostrarAlerta("Não há clientes para gerar relatório!", "warning");
    return;
  }

  // Perguntar qual formato
  confirmCallback = gerarRelatorioPDF;
  document.getElementById("confirmMessage").textContent = "Escolha o formato do relatório:";

  // Personalizar botões do modal
  const btnConfirm = document.getElementById("btnConfirm");
  btnConfirm.textContent = "PDF";
  btnConfirm.className = "btn btn-primary";

  const btnCancel = btnConfirm.previousElementSibling;
  btnCancel.textContent = "CSV";
  btnCancel.className = "btn btn-success";
  btnCancel.onclick = () => {
    gerarRelatorioCSV();
    fecharModal("confirmModal");
  };

  abrirModal("confirmModal");
}

function gerarRelatorioPDF() {
  // Usar jsPDF para gerar PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text("Relatório de Clientes - Dayane Diniz", 14, 20);

  // Data do relatório
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 30);

  // Preparar dados para a tabela
  const dadosTabela = [];

  // Cabeçalho
  const cabecalho = ["Nome", "Serviço", "Data", "Valor", "Status"];

  // Ordenar por status (pendentes primeiro) e depois por data
  const clientesOrdenados = [...clientes].sort((a, b) => {
    if (a.pago !== b.pago) {
      return a.pago ? 1 : -1; // Pendentes primeiro
    }
    return new Date(b.data) - new Date(a.data); // Mais recentes primeiro
  });

  // Adicionar dados
  clientesOrdenados.forEach((cliente) => {
    dadosTabela.push([
      cliente.nome,
      cliente.servico,
      formatarData(cliente.data),
      formatarMoeda(cliente.valor),
      cliente.pago ? "Pago" : "Pendente",
    ]);
  });

  // Criar tabela
  doc.autoTable({
    head: [cabecalho],
    body: dadosTabela,
    startY: 40,
    styles: {
      fontSize: 9,
    },
    columnStyles: {
      4: { // Coluna de status
        cellCallback: function (cell, data) {
          if (data.raw[4] === "Pendente") {
            cell.styles.fillColor = [255, 200, 200];
            cell.styles.textColor = [180, 0, 0];
          }
        },
      },
    },
  });

  // Resumo
  const totalClientes = clientes.length;
  const clientesPagos = clientes.filter((c) => c.pago).length;
  const clientesPendentes = totalClientes - clientesPagos;
  const valorTotal = clientes.reduce(
    (total, cliente) => total + (cliente.valor || 0),
    0
  );
  const valorPendente = clientes
    .filter((c) => !c.pago)
    .reduce((total, cliente) => total + (cliente.valor || 0), 0);

  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text("Resumo:", 14, finalY);
  doc.setFontSize(10);
  doc.text(`Total de clientes: ${totalClientes}`, 14, finalY + 7);
  doc.text(`Pagamentos realizados: ${clientesPagos}`, 14, finalY + 14);
  doc.text(`Pagamentos pendentes: ${clientesPendentes}`, 14, finalY + 21);
  doc.text(`Valor total: ${formatarMoeda(valorTotal)}`, 14, finalY + 28);
  doc.text(`Valor pendente: ${formatarMoeda(valorPendente)}`, 14, finalY + 35);

  // Salvar PDF
  doc.save("relatorio-clientes-dayane.pdf");
}

function gerarRelatorioCSV() {
  // Cabeçalho
  let csv = "Nome,CPF,Email,Serviço,Data,Valor,Status,Observações\n";

  // Ordenar por status (pendentes primeiro) e depois por data
  const clientesOrdenados = [...clientes].sort((a, b) => {
    if (a.pago !== b.pago) {
      return a.pago ? 1 : -1; // Pendentes primeiro
    }
    return new Date(b.data) - new Date(a.data); // Mais recentes primeiro
  });

  // Adicionar dados
  clientesOrdenados.forEach((cliente) => {
    // Escapar campos com vírgulas
    const nome = `"${cliente.nome.replace(/"/g, """")}"`;
    const cpf = `"${cliente.cpf ? cliente.cpf.replace(/"/g, """") : ""}"`;
    const email = `"${cliente.email ? cliente.email.replace(/"/g, """") : ""}"`;
    const servico = `"${cliente.servico.replace(/"/g, """")}"`;
    const data = `"${formatarData(cliente.data).replace(/"/g, """")}"`;
    const valor = `"${formatarMoeda(cliente.valor).replace(/"/g, """")}"`;
    const status = `"${cliente.pago ? "Pago" : "Pendente"}"`;
    const observacoes = `"${cliente.observacoes ? cliente.observacoes.replace(/"/g, """") : ""}"`;

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


