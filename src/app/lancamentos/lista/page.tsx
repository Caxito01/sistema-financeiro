'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function ListaLancamentosPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: 'TODOS',
    dataInicio: '',
    dataFim: '',
    grupo: '',
    subgrupo: '',
    statusQuitado: 'TODAS' // TODAS, QUITADAS, ABERTAS
  });

  const [grupos, setGrupos] = useState<any[]>([]);
  const [subgrupos, setSubgrupos] = useState<any[]>([]);
  const [fontSize, setFontSize] = useState(14);
  const [ocultarValores, setOcultarValores] = useState(false);
  const [showModalAjuda, setShowModalAjuda] = useState(false);
  
  const [editandoValor, setEditandoValor] = useState<any>(null);
  const [novoValor, setNovoValor] = useState('');
  
  const [showQuitadoModal, setShowQuitadoModal] = useState(false);
  const [lancamentoParaQuitar, setLancamentoParaQuitar] = useState<any>(null);
  const [formasPagamento, setFormasPagamento] = useState<any[]>([]);
  const [dadosQuitacao, setDadosQuitacao] = useState({
    data_quitacao: new Date().toISOString().split('T')[0],
    forma_pagamento_id: ''
  });

  useEffect(() => {
    loadGrupos();
    loadLancamentos();
    loadFormasPagamento();
  }, []);

  async function loadGrupos() {
    const { data } = await supabase.from('grupos').select('*').order('nome');
    if (data) setGrupos(data);
  }

  async function loadFormasPagamento() {
    const { data } = await supabase.from('formas_pagamento').select('*').eq('ativo', true).order('nome');
    if (data) setFormasPagamento(data);
  }

  async function loadLancamentos() {
    setLoading(true);
    
    let query = supabase
      .from('lancamentos')
      .select(`
        *,
        classe:classes(
          id,
          codigo,
          descricao,
          subgrupo:subgrupos(
            id,
            nome,
            grupo:grupos(
              id,
              nome,
              tipo
            )
          )
        )
      `)
      .order('data', { ascending: false });

    if (filtros.tipo !== 'TODOS') {
      query = query.eq('tipo', filtros.tipo);
    }
    if (filtros.dataInicio) {
      query = query.gte('data', filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte('data', filtros.dataFim);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } else {
      setLancamentos(data || []);
    }
    setLoading(false);
  }

  async function deletarLancamento(id) {
    if (!confirm('Tem certeza que deseja deletar este lançamento?')) return;

    const { error } = await supabase
      .from('lancamentos')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erro ao deletar: ' + error.message);
    } else {
      alert('Lançamento deletado com sucesso!');
      loadLancamentos();
    }
  }

  function abrirModalQuitacao(lancamento) {
    setLancamentoParaQuitar(lancamento);
    setDadosQuitacao({
      data_quitacao: new Date().toISOString().split('T')[0],
      forma_pagamento_id: ''
    });
    setShowQuitadoModal(true);
  }

  function fecharModalQuitacao() {
    setShowQuitadoModal(false);
    setLancamentoParaQuitar(null);
  }

  async function confirmarQuitacao() {
    if (!dadosQuitacao.forma_pagamento_id) {
      alert('Por favor, selecione uma forma de pagamento');
      return;
    }

    const { error } = await supabase
      .from('lancamentos')
      .update({ 
        quitado: true,
        data_quitacao: dadosQuitacao.data_quitacao,
        forma_pagamento_id: dadosQuitacao.forma_pagamento_id
      })
      .eq('id', lancamentoParaQuitar.id);

    if (error) {
      alert('Erro ao quitar lançamento: ' + error.message);
    } else {
      alert('Lançamento quitado com sucesso!');
      fecharModalQuitacao();
      loadLancamentos();
    }
  }

  async function reabrirLancamento(id) {
    if (!confirm('Tem certeza que deseja reabrir este lançamento?')) return;

    const { error } = await supabase
      .from('lancamentos')
      .update({ 
        quitado: false,
        data_quitacao: null,
        forma_pagamento_id: null
      })
      .eq('id', id);

    if (error) {
      alert('Erro ao reabrir lançamento: ' + error.message);
    } else {
      loadLancamentos();
    }
  }

  function iniciarEdicaoValor(lancamento) {
    setEditandoValor(lancamento.id);
    setNovoValor(parseFloat(lancamento.valor).toFixed(2));
  }

  function cancelarEdicaoValor() {
    setEditandoValor(null);
    setNovoValor('');
  }

  async function salvarNovoValor(id) {
    const valorNumerico = parseFloat(novoValor);
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert('Por favor, insira um valor válido maior que zero');
      return;
    }

    const { error } = await supabase
      .from('lancamentos')
      .update({ valor: valorNumerico })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar valor: ' + error.message);
    } else {
      setEditandoValor(null);
      setNovoValor('');
      loadLancamentos();
    }
  }

  // Filtrar lançamentos por status de quitado
  const lancamentosFiltrados = lancamentos.filter(lanc => {
    if (filtros.statusQuitado === 'QUITADAS') {
      return lanc.tipo === 'DESPESA' && lanc.quitado === true;
    } else if (filtros.statusQuitado === 'ABERTAS') {
      return lanc.tipo === 'DESPESA' && lanc.quitado === false;
    }
    return true; // TODAS
  });

  const totalDespesas = lancamentos
    .filter(l => l.tipo === 'DESPESA' && !l.quitado)
    .reduce((sum, l) => sum + parseFloat(l.valor), 0);

  const totalReceitas = lancamentos
    .filter(l => l.tipo === 'RECEITA')
    .reduce((sum, l) => sum + parseFloat(l.valor), 0);

  const totalDespesasGeral = lancamentos
    .filter(l => l.tipo === 'DESPESA')
    .reduce((sum, l) => sum + parseFloat(l.valor), 0);

  const saldo = totalReceitas - totalDespesasGeral;

  const temFiltroAtivo = filtros.statusQuitado !== 'TODAS' || filtros.tipo !== 'TODOS' || 
                         filtros.dataInicio || filtros.dataFim;

  function exportarParaExcel() {
    const csv = gerarCSV();
    // Adicionar BOM para UTF-8 para Excel reconhecer acentos corretamente
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lancamentos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  function gerarCSV() {
    // Usar ponto-e-vírgula como separador (padrão Excel PT-BR)
    let csv = 'Data;Descrição;Grupo;Subgrupo;Classe;Tipo;Valor\n';
    lancamentos.forEach(lanc => {
      const data = new Date(lanc.data).toLocaleDateString('pt-BR');
      const descricao = (lanc.descricao_complementar || '').replace(/"/g, '""'); // Escapar aspas duplas
      const grupo = (lanc.classe?.subgrupo?.grupo?.nome || '-').replace(/"/g, '""');
      const subgrupo = (lanc.classe?.subgrupo?.nome || '-').replace(/"/g, '""');
      const classe = (lanc.classe?.descricao || '-').replace(/"/g, '""');
      const tipo = lanc.tipo;
      const valor = parseFloat(lanc.valor).toFixed(2).replace('.', ','); // Usar vírgula decimal
      csv += `"${data}";"${descricao}";"${grupo}";"${subgrupo}";"${classe}";"${tipo}";"${valor}"\n`;
    });
    return csv;
  }

  function imprimirPDF() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📋 Lançamentos</h1>
          <div className="flex gap-3 no-print">
            <button
              onClick={() => setShowModalAjuda(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              title="Ajuda"
            >
              ❓ Ajuda
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
            >
              ← Voltar
            </button>
            <button
              onClick={() => router.push('/lancamentos')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              ➕ Novo Lançamento
            </button>
          </div>
        </div>

        {/* Cards de Totais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border-l-4 border-red-500 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Despesas</p>
            <p className="text-2xl font-bold text-red-600">
              {ocultarValores ? '••••••' : `R$ ${totalDespesas.toFixed(2)}`}
            </p>
          </div>
          <div className="bg-white border-l-4 border-green-500 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Receitas</p>
            <p className="text-2xl font-bold text-green-600">
              {ocultarValores ? '••••••' : `R$ ${totalReceitas.toFixed(2)}`}
            </p>
          </div>
          <div className="bg-white border-l-4 border-blue-500 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Saldo</p>
            <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {ocultarValores ? '••••••' : `R$ ${saldo.toFixed(2)}`}
            </p>
          </div>
        </div>

        {/* Barra de Ferramentas */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 no-print">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 border-r pr-3">
              <span className="text-sm text-gray-600">Fonte:</span>
              <button
                onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded"
                title="Diminuir fonte"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize(Math.min(20, fontSize + 2))}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded"
                title="Aumentar fonte"
              >
                A+
              </button>
            </div>

            <button
              onClick={() => setOcultarValores(!ocultarValores)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded"
              title={ocultarValores ? 'Mostrar valores' : 'Ocultar valores'}
            >
              {ocultarValores ? '👁️' : '👁️‍🗨️'} {ocultarValores ? 'Mostrar' : 'Ocultar'}
            </button>

            <div className="flex items-center gap-2 border-l pl-3">
              <span className="text-sm text-gray-600">Exportar:</span>
              <button
                onClick={imprimirPDF}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                title="Imprimir / Salvar como PDF"
              >
                📄 PDF
              </button>
              <button
                onClick={exportarParaExcel}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                title="Exportar para Excel"
              >
                📊 Excel
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 no-print">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              🔍 Filtros {temFiltroAtivo && <span className="ml-2 text-blue-600">🔵 Filtro ativo</span>}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="TODOS">Todos</option>
                <option value="DESPESA">Despesas</option>
                <option value="RECEITA">Receitas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Despesas</label>
              <select
                value={filtros.statusQuitado}
                onChange={(e) => setFiltros({ ...filtros, statusQuitado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="TODAS">Todas</option>
                <option value="ABERTAS">Abertas</option>
                <option value="QUITADAS">Quitadas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadLancamentos}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: `${fontSize}px` }}>
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Data</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Descrição</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Grupo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Subgrupo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Classe</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Valor</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 no-print">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : lancamentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Nenhum lançamento encontrado
                    </td>
                  </tr>
                ) : (
                  lancamentosFiltrados.map((lanc) => (
                    <tr key={lanc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(lanc.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className={`px-4 py-3 ${lanc.quitado ? 'text-gray-400' : 'text-gray-700'}`}>
                        {lanc.descricao_complementar || '-'}{lanc.quitado ? ' (quitado)' : ''}
                      </td>
                      <td className={`px-4 py-3 ${lanc.quitado ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lanc.classe?.subgrupo?.grupo?.nome || '-'}
                      </td>
                      <td className={`px-4 py-3 ${lanc.quitado ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lanc.classe?.subgrupo?.nome || '-'}
                      </td>
                      <td className={`px-4 py-3 ${lanc.quitado ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lanc.classe?.descricao || '-'}{lanc.quitado ? ' (quitado)' : ''}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        lanc.tipo === 'DESPESA' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {ocultarValores ? '•••••' : (
                          editandoValor === lanc.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={novoValor}
                                onChange={(e) => setNovoValor(e.target.value)}
                                className="w-24 px-2 py-1 border border-blue-500 rounded text-right"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') salvarNovoValor(lanc.id);
                                  if (e.key === 'Escape') cancelarEdicaoValor();
                                }}
                              />
                              <button
                                onClick={() => salvarNovoValor(lanc.id)}
                                className="text-green-600 hover:text-green-700 text-xl"
                                title="Salvar"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelarEdicaoValor}
                                className="text-red-600 hover:text-red-700 text-xl"
                                title="Cancelar"
                              >
                                ✗
                              </button>
                            </div>
                          ) : (
                            <span 
                              onClick={() => !lanc.quitado && iniciarEdicaoValor(lanc)}
                              className={`px-2 py-1 rounded inline-block ${
                                lanc.quitado 
                                  ? 'cursor-not-allowed' 
                                  : 'cursor-pointer hover:bg-gray-100'
                              }`}
                              title={lanc.quitado ? 'Não é possível editar valor de lançamento quitado' : 'Clique para editar o valor'}
                            >
                              {lanc.tipo === 'DESPESA' ? '-' : '+'} R$ {parseFloat(lanc.valor).toFixed(2)}
                            </span>
                          )
                        )}
                      </td>
                      <td className="px-4 py-3 text-center no-print">
                        <div className="flex justify-center gap-2">
                          {lanc.tipo === 'DESPESA' && (
                            <button
                              onClick={() => lanc.quitado ? reabrirLancamento(lanc.id) : abrirModalQuitacao(lanc)}
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                lanc.quitado 
                                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                              }`}
                              title={lanc.quitado ? 'Marcar como quitado' : 'Marcar como quitado'}
                            >
                              {lanc.quitado ? '↻ Quitado' : '✓ Quitar'}
                            </button>
                          )}
                          <button
                            onClick={() => deletarLancamento(lanc.id)}
                            className={`font-medium text-xl ${
                              lanc.quitado && lanc.tipo === 'DESPESA'
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-red-600 hover:text-red-800'
                            }`}
                            title={lanc.quitado && lanc.tipo === 'DESPESA' ? 'Não é possível excluir lançamento quitado' : 'Excluir lançamento'}
                            disabled={lanc.quitado && lanc.tipo === 'DESPESA'}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center no-print">
          Total de {lancamentos.length} lançamento(s)
        </div>
      </div>

      {/* Modal de Quitação */}
      {showQuitadoModal && lancamentoParaQuitar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              💰 Quitar Lançamento
            </h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Descrição:</p>
              <p className="font-medium">{lancamentoParaQuitar.descricao_complementar || '-'}</p>
              <p className="text-sm text-gray-600 mt-2">Valor:</p>
              <p className="font-bold text-red-600">R$ {parseFloat(lancamentoParaQuitar.valor).toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data da Quitação *
                </label>
                <input
                  type="date"
                  value={dadosQuitacao.data_quitacao}
                  onChange={(e) => setDadosQuitacao({ ...dadosQuitacao, data_quitacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de Pagamento *
                </label>
                <select
                  value={dadosQuitacao.forma_pagamento_id}
                  onChange={(e) => setDadosQuitacao({ ...dadosQuitacao, forma_pagamento_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {formasPagamento.map(forma => (
                    <option key={forma.id} value={forma.id}>
                      {forma.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={fecharModalQuitacao}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarQuitacao}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ✓ Confirmar Quitação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS para impressão */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>

      {/* Modal de Ajuda */}
      {showModalAjuda && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">📚 Guia - Lista de Lançamentos</h2>
              <button
                onClick={() => setShowModalAjuda(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <h3 className="text-xl font-bold text-blue-600 mb-3">🎯 Visão Geral</h3>
                <p className="text-gray-700">
                  A lista de lançamentos mostra todos os seus registros financeiros com opções de edição, exclusão e análise.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-blue-600 mb-3">📊 Cards de Totais</h3>
                <p className="text-gray-700 mb-2">Na parte superior aparecem 3 cards com:</p>
                <ul className="space-y-1 text-gray-700">
                  <li>• <strong>Total Despesas:</strong> Soma de todas as despesas</li>
                  <li>• <strong>Total Receitas:</strong> Soma de todas as receitas</li>
                  <li>• <strong>Saldo:</strong> Receitas menos Despesas</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-blue-600 mb-3">🔧 Ferramentas</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Filtros:</strong> Filtre por tipo, data, grupo, status de quitação</li>
                  <li><strong>Tamanho de Fonte:</strong> Ajuste o tamanho do texto da tabela</li>
                  <li><strong>Ocultar Valores:</strong> Esconda valores para privacidade</li>
                  <li><strong>Imprimir:</strong> Imprima a lista de lançamentos</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-blue-600 mb-3">⚙️ Ações na Tabela</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>✏️ Editar:</strong> Modifique os dados do lançamento</li>
                  <li><strong>🗑️ Excluir:</strong> Remova um lançamento</li>
                  <li><strong>✓ Quitar:</strong> Marque como pago/quitado</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-blue-600 mb-3">💡 Dicas</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Clique no cabeçalho da coluna para ordenar</li>
                  <li>• Use os filtros para encontrar lançamentos específicos</li>
                  <li>• Marque como quitado para acompanhar pagamentos</li>
                  <li>• Clique em "Novo Lançamento" para adicionar um novo item</li>
                </ul>
              </section>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end">
              <button
                onClick={() => setShowModalAjuda(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                Entendi!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}