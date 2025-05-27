// Estatísticas - Dayane Diniz
// Script para página de estatísticas

// Variáveis globais
let clientes = [];
let confirmCallback = null;

// Elementos DOM
const totalClientes = document.getElementById('totalClientes');
const totalPagos = document.getElementById('totalPagos');
const totalPendentes = document.getElementById('totalPendentes');
const valorTotal = document.getElementById('valorTotal');
const btnBackup = document.getElementById('btnBackup');
const btnRestore = document.getElementById('btnRestore');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados do localStorage
    carregarClientes();
    
    // Atualizar estatísticas
    atualizarEstatisticas();
    
    // Gerar gráficos
    gerarGraficoServicos();
    gerarGraficoAtendimentos();
    gerarGraficoPagamentos();
    
    // Configurar eventos
    btnBackup.addEventListener('click', fazerBackup);
    btnRestore.addEventListener('click', abrirModalRestauracao);
    
    // Configurar modal de restauração
    document.getElementById('btnConfirmRestore').addEventListener('click', restaurarDados);
    
    // Configurar modal de confirmação
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

function atualizarEstatisticas() {
    // Total de clientes
    totalClientes.textContent = clientes.length;
    
    // Total de pagamentos realizados
    const pagos = clientes.filter(cliente => cliente.pago).length;
    totalPagos.textContent = pagos;
    
    // Total de pagamentos pendentes
    const pendentes = clientes.length - pagos;
    totalPendentes.textContent = pendentes;
    
    // Valor total
    const total = clientes.reduce((soma, cliente) => soma + (cliente.valor || 0), 0);
    valorTotal.textContent = formatarMoeda(total);
}

function gerarGraficoServicos() {
    // Contar serviços
    const servicosCount = {};
    
    clientes.forEach(cliente => {
        if (cliente.servico) {
            servicosCount[cliente.servico] = (servicosCount[cliente.servico] || 0) + 1;
        }
    });
    
    // Ordenar por quantidade (decrescente)
    const servicosOrdenados = Object.entries(servicosCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6); // Limitar a 6 serviços mais populares
    
    // Preparar dados para o gráfico
    const labels = servicosOrdenados.map(item => item[0]);
    const data = servicosOrdenados.map(item => item[1]);
    
    // Cores
    const backgroundColors = [
        'rgba(223, 185, 19, 0.7)',
        'rgba(223, 185, 19, 0.6)',
        'rgba(223, 185, 19, 0.5)',
        'rgba(223, 185, 19, 0.4)',
        'rgba(223, 185, 19, 0.3)',
        'rgba(223, 185, 19, 0.2)'
    ];
    
    // Criar gráfico
    const ctx = document.getElementById('servicosChart').getContext('2d');
    new Chart(ctx, {
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

function gerarGraficoAtendimentos() {
    // Agrupar por mês
    const atendimentosPorMes = {};
    const mesesNomes = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    // Obter mês atual e 5 meses anteriores
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth();
    const anoAtual = dataAtual.getFullYear();
    
    // Inicializar contagem para os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
        const mes = (mesAtual - i + 12) % 12; // Garantir que o mês seja positivo
        const ano = anoAtual - Math.floor((i - mesAtual) / 12);
        const chave = `${ano}-${mes.toString().padStart(2, '0')}`;
        atendimentosPorMes[chave] = {
            nome: mesesNomes[mes],
            count: 0
        };
    }
    
    // Contar atendimentos por mês
    clientes.forEach(cliente => {
        if (cliente.data) {
            const data = new Date(cliente.data);
            const mes = data.getMonth();
            const ano = data.getFullYear();
            const chave = `${ano}-${mes.toString().padStart(2, '0')}`;
            
            if (atendimentosPorMes[chave]) {
                atendimentosPorMes[chave].count++;
            }
        }
    });
    
    // Ordenar por data
    const mesesOrdenados = Object.entries(atendimentosPorMes)
        .sort((a, b) => a[0].localeCompare(b[0]));
    
    // Preparar dados para o gráfico
    const labels = mesesOrdenados.map(item => item[1].nome);
    const data = mesesOrdenados.map(item => item[1].count);
    
    // Criar gráfico
    const ctx = document.getElementById('atendimentosChart').getContext('2d');
    new Chart(ctx, {
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

function gerarGraficoPagamentos() {
    // Contar pagos e pendentes
    const pagos = clientes.filter(cliente => cliente.pago).length;
    const pendentes = clientes.length - pagos;
    
    // Calcular valor total pago e pendente
    const valorPago = clientes
        .filter(cliente => cliente.pago)
        .reduce((soma, cliente) => soma + (cliente.valor || 0), 0);
    
    const valorPendente = clientes
        .filter(cliente => !cliente.pago)
        .reduce((soma, cliente) => soma + (cliente.valor || 0), 0);
    
    // Criar gráfico
    const ctx = document.getElementById('pagamentosChart').getContext('2d');
    new Chart(ctx, {
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
                            const percentage = Math.round((value / total) * 100);
                            
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
    // Verificar se há dados
    if (clientes.length === 0) {
        mostrarAlerta('Não há dados para fazer backup!', 'warning');
        return;
    }
    
    // Criar objeto com dados e metadados
    const backup = {
        data: clientes,
        metadata: {
            versao: '1.0',
            dataBackup: new Date().toISOString(),
            quantidadeRegistros: clientes.length
        }
    };
    
    // Converter para JSON
    const backupJSON = JSON.stringify(backup);
    
    // Criar blob e link para download
    const blob = new Blob([backupJSON], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Nome do arquivo com data
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
            
            // Verificar se o arquivo tem o formato correto
            if (!backup.data || !Array.isArray(backup.data)) {
                throw new Error('Formato de arquivo inválido!');
            }
            
            // Confirmar restauração
            confirmCallback = () => {
                // Restaurar dados
                clientes = backup.data;
                localStorage.setItem('dayane_clientes', JSON.stringify(clientes));
                
                // Atualizar estatísticas
                atualizarEstatisticas();
                
                // Recriar gráficos
                gerarGraficoServicos();
                gerarGraficoAtendimentos();
                gerarGraficoPagamentos();
                
                // Fechar modal
                fecharModal('restoreModal');
                
                // Mostrar mensagem
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
    // Criar elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.setAttribute('role', 'alert');
    alerta.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    
    // Adicionar ao topo da página
    document.querySelector('main').prepend(alerta);
    
    // Remover após 5 segundos
    setTimeout(() => {
        alerta.classList.remove('show');
        setTimeout(() => alerta.remove(), 300);
    }, 5000);
}
