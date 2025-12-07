// Estatísticas - Dayane Diniz
// Script para página de estatísticas

// Variáveis globais
let clientes = [];
let clientesFiltrados = [];
let confirmCallback = null;
let servicosChartInstance = null;
let atendimentosChartInstance = null;
let pagamentosChartInstance = null;
let faturamentoServicoChartInstance = null;
let faturamentoMensalChartInstance = null;

// Elementos DOM
const totalClientes = document.getElementById('totalClientes');
const totalPagos = document.getElementById('totalPagos');
const totalPendentes = document.getElementById('totalPendentes');
const valorTotal = document.getElementById('valorTotal');
const btnBackup = document.getElementById('btnBackup');
const btnRestore = document.getElementById('btnRestore');
const filtroMes = document.getElementById('filtroMes');
const filtroAno = document.getElementById('filtroAno');
const btnAplicarFiltro = document.getElementById('btnAplicarFiltro');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarClientes();
    popularFiltroAno();
    aplicarFiltros(); // Aplica filtros iniciais (sem filtro) e gera gráficos

    btnBackup.addEventListener('click', fazerBackup);
    btnRestore.addEventListener('click', abrirModalRestauracao);
    btnAplicarFiltro.addEventListener('click', aplicarFiltros);

    document.getElementById('btnConfirmRestore').addEventListener('click', restaurarDados);
    document.getElementById('btnConfirm').addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
            fecharModal('confirmModal');
        }
    });
});

// Funções principais
function carregarClientes() {
    const clientesJSON = localStorage.getItem('dayane_clientes');
    if (clientesJSON) {
        clientes = JSON.parse(clientesJSON);
    }
}

function popularFiltroAno() {
    const anos = new Set();
    clientes.forEach(cliente => {
        if (cliente.data) {
            anos.add(new Date(cliente.data).getFullYear());
        }
    });
    const anosOrdenados = Array.from(anos).sort((a, b) => b - a);
    anosOrdenados.forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        filtroAno.appendChild(option);
    });
}

function aplicarFiltros() {
    const mesSelecionado = filtroMes.value;
    const anoSelecionado = filtroAno.value;

    clientesFiltrados = clientes.filter(cliente => {
        const dataAtendimento = new Date(cliente.data);
        const mesCliente = dataAtendimento.getMonth().toString();
        const anoCliente = dataAtendimento.getFullYear().toString();

        const matchMes = mesSelecionado === '' || mesCliente === mesSelecionado;
        const matchAno = anoSelecionado === '' || anoCliente === anoSelecionado;

        return matchMes && matchAno;
    });

    atualizarEstatisticas();
    gerarTodosGraficos();
}

function atualizarEstatisticas() {
    totalClientes.textContent = clientesFiltrados.length;

    const pagos = clientesFiltrados.filter(cliente => cliente.pago).length;
    totalPagos.textContent = pagos;

    const pendentes = clientesFiltrados.length - pagos;
    totalPendentes.textContent = pendentes;

    const total = clientesFiltrados.reduce((soma, cliente) => soma + (cliente.valor || 0), 0);
    valorTotal.textContent = formatarMoeda(total);
}

function gerarTodosGraficos() {
    // Destruir instâncias anteriores para evitar sobreposição
    if (servicosChartInstance) servicosChartInstance.destroy();
    if (atendimentosChartInstance) atendimentosChartInstance.destroy();
    if (pagamentosChartInstance) pagamentosChartInstance.destroy();
    if (faturamentoServicoChartInstance) faturamentoServicoChartInstance.destroy();
    if (faturamentoMensalChartInstance) faturamentoMensalChartInstance.destroy();

    gerarGraficoServicos();
    gerarGraficoFaturamentoServico();
    gerarGraficoAtendimentos();
    gerarGraficoFaturamentoMensal();
    gerarGraficoPagamentos();
}

function gerarGraficoServicos() {
    const servicosCount = {};
    clientesFiltrados.forEach(cliente => {
        if (cliente.servico) {
            servicosCount[cliente.servico] = (servicosCount[cliente.servico] || 0) + 1;
        }
    });

    const servicosOrdenados = Object.entries(servicosCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    const labels = servicosOrdenados.map(item => item[0]);
    const data = servicosOrdenados.map(item => item[1]);

    const backgroundColors = [
        'rgba(223, 185, 19, 0.7)', 'rgba(223, 185, 19, 0.6)', 'rgba(223, 185, 19, 0.5)',
        'rgba(223, 185, 19, 0.4)', 'rgba(223, 185, 19, 0.3)', 'rgba(223, 185, 19, 0.2)'
    ];

    const ctx = document.getElementById('servicosChart').getContext('2d');
    servicosChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: 'rgba(223, 185, 19, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Quantidade: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function gerarGraficoFaturamentoServico() {
    const faturamentoPorServico = {};
    clientesFiltrados.forEach(cliente => {
        if (cliente.servico && cliente.valor) {
            faturamentoPorServico[cliente.servico] = (faturamentoPorServico[cliente.servico] || 0) + cliente.valor;
        }
    });

    const servicosOrdenados = Object.entries(faturamentoPorServico)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    const labels = servicosOrdenados.map(item => item[0]);
    const data = servicosOrdenados.map(item => item[1]);

    const backgroundColors = [
        'rgba(75, 192, 192, 0.7)', 'rgba(75, 192, 192, 0.6)', 'rgba(75, 192, 192, 0.5)',
        'rgba(75, 192, 192, 0.4)', 'rgba(75, 192, 192, 0.3)', 'rgba(75, 192, 192, 0.2)'
    ];

    const ctx = document.getElementById('faturamentoServicoChart').getContext('2d');
    faturamentoServicoChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Faturamento (R$)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatarMoeda(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Faturamento: ${formatarMoeda(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

function gerarGraficoAtendimentos() {
    const atendimentosPorMes = {};
    const mesesNomes = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    clientesFiltrados.forEach(cliente => {
        if (cliente.data) {
            const data = new Date(cliente.data);
            const mesAno = `${data.getFullYear()}-${data.getMonth().toString().padStart(2, '0')}`;
            atendimentosPorMes[mesAno] = (atendimentosPorMes[mesAno] || 0) + 1;
        }
    });

    const mesesOrdenados = Object.keys(atendimentosPorMes).sort();
    const labels = mesesOrdenados.map(mesAno => {
        const [ano, mes] = mesAno.split('-');
        return `${mesesNomes[parseInt(mes)]}/${ano.slice(2)}`;
    });
    const data = mesesOrdenados.map(mesAno => atendimentosPorMes[mesAno]);

    const ctx = document.getElementById('atendimentosChart').getContext('2d');
    atendimentosChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Atendimentos',
                data: data,
                borderColor: 'rgba(223, 185, 19, 1)',
                backgroundColor: 'rgba(223, 185, 19, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function gerarGraficoFaturamentoMensal() {
    const faturamentoMensal = {};
    const mesesNomes = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    clientesFiltrados.forEach(cliente => {
        if (cliente.data && cliente.valor) {
            const data = new Date(cliente.data);
            const mesAno = `${data.getFullYear()}-${data.getMonth().toString().padStart(2, '0')}`;
            faturamentoMensal[mesAno] = (faturamentoMensal[mesAno] || 0) + cliente.valor;
        }
    });

    const mesesOrdenados = Object.keys(faturamentoMensal).sort();
    const labels = mesesOrdenados.map(mesAno => {
        const [ano, mes] = mesAno.split('-');
        return `${mesesNomes[parseInt(mes)]}/${ano.slice(2)}`;
    });
    const data = mesesOrdenados.map(mesAno => faturamentoMensal[mesAno]);

    const ctx = document.getElementById('faturamentoMensalChart').getContext('2d');
    faturamentoMensalChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Faturamento (R$)',
                data: data,
                borderColor: 'rgba(0, 123, 255, 1)',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatarMoeda(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function gerarGraficoPagamentos() {
    const pagos = clientesFiltrados.filter(cliente => cliente.pago).length;
    const pendentes = clientesFiltrados.length - pagos;

    const valorPago = clientesFiltrados
        .filter(cliente => cliente.pago)
        .reduce((soma, cliente) => soma + (cliente.valor || 0), 0);

    const valorPendente = clientesFiltrados
        .filter(cliente => !cliente.pago)
        .reduce((soma, cliente) => soma + (cliente.valor || 0), 0);

    const ctx = document.getElementById('pagamentosChart').getContext('2d');
    pagamentosChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pagos', 'Pendentes'],
            datasets: [{
                data: [pagos, pendentes],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.7)',
                    'rgba(220, 53, 69, 0.7)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            
                            if (label === 'Pagos') {
                                return `${label}: ${value} (${percentage}%) - ${formatarMoeda(valorPago)}`;
                            } else {
                                return `${label}: ${value} (${percentage}%) - ${formatarMoeda(valorPendente)}`;
                            }
                        }
                    }
                }
            }
        }
    });
}

function fazerBackup() {
    if (clientes.length === 0) {
        mostrarAlerta('Não há dados para fazer backup!', 'warning');
        return;
    }

    const backup = {
        data: clientes,
        metadata: {
            versao: '1.0',
            dataBackup: new Date().toISOString(),
            quantidadeRegistros: clientes.length
        }
    };

    const backupJSON = JSON.stringify(backup);

    const blob = new Blob([backupJSON], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const dataFormatada = new Date().toISOString().split('T')[0];
    const nomeArquivo = `backup-clientes-dayane-${dataFormatada}.json`;

    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarAlerta('Backup realizado com sucesso!', 'success');
}

function abrirModalRestauracao() {
    abrirModal('restoreModal');
}

function restaurarDados() {
    const fileInput = document.getElementById('fileRestore');
    const file = fileInput.files[0];

    if (!file) {
        mostrarAlerta('Selecione um arquivo de backup!', 'warning');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);

            if (!backup.data || !Array.isArray(backup.data)) {
                throw new Error('Formato de arquivo inválido!');
            }

            confirmCallback = () => {
                clientes = backup.data;
                localStorage.setItem('dayane_clientes', JSON.stringify(clientes));

                aplicarFiltros(); // Reaplicar filtros e gerar gráficos com os novos dados

                fecharModal('restoreModal');
                mostrarAlerta(`Backup restaurado com sucesso! ${clientes.length} registros recuperados.`, 'success');
            };

            document.getElementById('confirmMessage').textContent = `Tem certeza que deseja restaurar ${backup.data.length} registros? Isso substituirá todos os dados atuais.`;

            fecharModal('restoreModal');
            abrirModal('confirmModal');

        } catch (error) {
            mostrarAlerta('Erro ao restaurar backup: ' + error.message, 'danger');
        }
    };

    reader.readAsText(file);
}

// Funções auxiliares
function formatarMoeda(valor) {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
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
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.setAttribute('role', 'alert');
    alerta.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;

    document.querySelector('main').prepend(alerta);

    setTimeout(() => {
        alerta.classList.remove('show');
        setTimeout(() => alerta.remove(), 300);
    }, 5000);
}


