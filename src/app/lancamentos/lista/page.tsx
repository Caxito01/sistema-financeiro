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

  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: 'TODOS',
    dataInicio: '',
    dataFim: '',
    grupo: '',
    subgrupo: ''
  });

  const [grupos, setGrupos] = useState([]);
  const [subgrupos, setSubgrupos] = useState([]);
  const [fontSize, setFontSize] = useState(14);
  const [ocultarValores, setOcultarValores] = useState(false);

  useEffect(() => {
    loadGrupos();
    loadLancamentos();
  }, []);

  async function loadGrupos() {
    const { data } = await supabase.from('grupos').select('*').order('nome');
    if (data) setGrupos(data);
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

  const totalDespesas = lancamentos
    .filter(l => l.tipo === 'DESPESA')
    .reduce((sum, l) => sum + parseFloat(l.valor), 0);

  const totalReceitas = lancamentos
    .filter(l => l.tipo === 'RECEITA')
    .reduce((sum, l) => sum + parseFloat(l.valor), 0);

  const saldo = totalReceitas - totalDespesas;

  function exportarParaExcel() {
    const csv = gerarCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lancamentos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  function gerarCSV() {
    let csv = 'Data,Descrição,Grupo,Subgrupo,Classe,Tipo,Valor\n';
    lancamentos.forEach(lanc => {
      const data = new Date(lanc.data).toLocaleDateString('pt-BR');
      const descricao = (lanc.descricao_complementar || '').replace(/,/g, ';');
      const grupo = lanc.classe?.subgrupo?.grupo?.nome || '-';
      const subgrupo = lanc.classe?.subgrupo?.nome || '-';
      const classe = lanc.classe?.descricao || '-';
      const tipo = lanc.tipo;
      const valor = parseFloat(lanc.valor).toFixed(2);
      csv += `${data},"${descricao}",${grupo},${subgrupo},${classe},${tipo},${valor}\n`;
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
          <h2 className="text-lg font-bold text-gray-800 mb-4">🔍 Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                ) : lancamentos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Nenhum lançamento encontrado
                    </td>
                  </tr>
                ) : (
                  lancamentos.map((lanc) => (
                    <tr key={lanc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(lanc.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {lanc.descricao_complementar || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {lanc.classe?.subgrupo?.grupo?.nome || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {lanc.classe?.subgrupo?.nome || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {lanc.classe?.descricao || '-'}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        lanc.tipo === 'DESPESA' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {ocultarValores ? '•••••' : (
                          <>
                            {lanc.tipo === 'DESPESA' ? '-' : '+'} R$ {parseFloat(lanc.valor).toFixed(2)}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center no-print">
                        <button
                          onClick={() => deletarLancamento(lanc.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          🗑️
                        </button>
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
    </div>
  );
}