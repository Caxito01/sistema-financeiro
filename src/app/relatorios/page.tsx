'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function RelatoriosPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: 'TODOS',
    dataInicio: '',
    dataFim: '',
    grupo_id: '',
    subgrupo_id: '',
    classe_id: '',
    palavraChave: ''
  });

  const [grupos, setGrupos] = useState([]);
  const [subgrupos, setSubgrupos] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    loadGrupos();
  }, []);

  // Carregar relatório automaticamente quando os filtros mudarem
  useEffect(() => {
    loadRelatorio();
  }, [filtros.tipo, filtros.dataInicio, filtros.dataFim, filtros.grupo_id, filtros.subgrupo_id, filtros.classe_id, filtros.palavraChave]);

  async function loadGrupos() {
    const { data } = await supabase.from('grupos').select('*').order('nome');
    if (data) setGrupos(data);
  }

  useEffect(() => {
    async function loadSubgrupos() {
      if (!filtros.grupo_id) {
        setSubgrupos([]);
        return;
      }
      const { data } = await supabase
        .from('subgrupos')
        .select('*')
        .eq('grupo_id', filtros.grupo_id)
        .order('nome');
      if (data) setSubgrupos(data);
    }
    loadSubgrupos();
  }, [filtros.grupo_id]);

  useEffect(() => {
    async function loadClasses() {
      if (!filtros.subgrupo_id) {
        setClasses([]);
        return;
      }
      const { data } = await supabase
        .from('classes')
        .select('*')
        .eq('subgrupo_id', filtros.subgrupo_id)
        .order('descricao');
      if (data) setClasses(data);
    }
    loadClasses();
  }, [filtros.subgrupo_id]);

  async function loadRelatorio() {
    setLoading(true);

    // Se tiver subgrupo selecionado, buscar IDs das classes desse subgrupo
    let classesPermitidas = [];
    if (filtros.subgrupo_id) {
      const { data: classesData } = await supabase
        .from('classes')
        .select('id')
        .eq('subgrupo_id', filtros.subgrupo_id);
      classesPermitidas = classesData?.map(c => c.id) || [];
    }
    // Se tiver grupo selecionado (mas não subgrupo), buscar IDs das classes desse grupo
    else if (filtros.grupo_id) {
      const { data: subgruposData } = await supabase
        .from('subgrupos')
        .select('id')
        .eq('grupo_id', filtros.grupo_id);
      const subgruposIds = subgruposData?.map(s => s.id) || [];
      
      if (subgruposIds.length > 0) {
        const { data: classesData } = await supabase
          .from('classes')
          .select('id')
          .in('subgrupo_id', subgruposIds);
        classesPermitidas = classesData?.map(c => c.id) || [];
      }
    }

    let query = supabase
      .from('lancamentos')
      .select(`
        id,
        valor,
        tipo,
        data,
        descricao_complementar,
        quitado,
        classe:classes(
          id,
          codigo,
          descricao,
          palavras_chave,
          subgrupo:subgrupos(
            id,
            codigo,
            nome,
            grupo:grupos(
              id,
              codigo,
              nome,
              tipo
            )
          )
        )
      `);

    if (filtros.tipo !== 'TODOS') {
      query = query.eq('tipo', filtros.tipo);
    }
    if (filtros.dataInicio) {
      query = query.gte('data', filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte('data', filtros.dataFim);
    }
    if (filtros.classe_id) {
      query = query.eq('classe_id', filtros.classe_id);
    } else if (classesPermitidas.length > 0) {
      query = query.in('classe_id', classesPermitidas);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar relatório:', error);
      setLoading(false);
      return;
    }

    // Filtrar por palavra-chave se especificado
    let dadosFiltrados = data || [];
    if (filtros.palavraChave) {
      const palavraLower = filtros.palavraChave.toLowerCase();
      dadosFiltrados = dadosFiltrados.filter(lanc => {
        const palavrasChave = lanc.classe?.palavras_chave || [];
        return palavrasChave.some(p => p.toLowerCase().includes(palavraLower)) ||
               lanc.descricao_complementar?.toLowerCase().includes(palavraLower);
      });
    }

    // Agrupar dados hierarquicamente
    const agrupado = agruparDados(dadosFiltrados);
    setRelatorio(agrupado);
    setLoading(false);
  }

  function agruparDados(lancamentos) {
    const grupos = {};

    lancamentos.forEach(lanc => {
      const grupoNome = lanc.classe?.subgrupo?.grupo?.nome || 'Sem Grupo';
      const grupoCodigo = lanc.classe?.subgrupo?.grupo?.codigo || 0;
      const subgrupoNome = lanc.classe?.subgrupo?.nome || 'Sem Subgrupo';
      const subgrupoCodigo = lanc.classe?.subgrupo?.codigo || 0;
      const classeNome = lanc.classe?.descricao || 'Sem Classe';
      const classeCodigo = lanc.classe?.codigo || 0;
      
      // Criar chave única para separar quitados de não quitados
      const classeKey = lanc.quitado ? `${classeNome}_quitado` : classeNome;
      const classeDisplay = lanc.quitado ? `${classeNome} (quitado)` : classeNome;

      if (!grupos[grupoNome]) {
        grupos[grupoNome] = {
          nome: grupoNome,
          codigo: grupoCodigo,
          tipo: lanc.tipo,
          total: 0,
          subgrupos: {}
        };
      }

      if (!grupos[grupoNome].subgrupos[subgrupoNome]) {
        grupos[grupoNome].subgrupos[subgrupoNome] = {
          nome: subgrupoNome,
          codigo: subgrupoCodigo,
          total: 0,
          classes: {}
        };
      }

      if (!grupos[grupoNome].subgrupos[subgrupoNome].classes[classeKey]) {
        grupos[grupoNome].subgrupos[subgrupoNome].classes[classeKey] = {
          nome: classeDisplay,
          codigo: classeCodigo,
          total: 0,
          lancamentos: [],
          quitado: lanc.quitado || false
        };
      }

      const valor = parseFloat(lanc.valor);
      grupos[grupoNome].total += valor;
      grupos[grupoNome].subgrupos[subgrupoNome].total += valor;
      grupos[grupoNome].subgrupos[subgrupoNome].classes[classeKey].total += valor;
      grupos[grupoNome].subgrupos[subgrupoNome].classes[classeKey].lancamentos.push(lanc);
    });

    return Object.values(grupos);
  }

  // Calcular total de receitas e despesas separadamente
  const totalReceitas = relatorio
    .filter(grupo => Object.values(grupo.subgrupos).some((sub: any) => 
      Object.values(sub.classes).some((classe: any) => 
        classe.lancamentos.some((l: any) => l.tipo === 'RECEITA')
      )
    ))
    .reduce((sum, grupo) => {
      const receitasDoGrupo = Object.values(grupo.subgrupos).reduce((subSum, subgrupo: any) => {
        return subSum + Object.values(subgrupo.classes).reduce((classSum, classe: any) => {
          const receitasDaClasse = classe.lancamentos
            .filter((l: any) => l.tipo === 'RECEITA')
            .reduce((lSum: number, l: any) => lSum + parseFloat(l.valor), 0);
          return classSum + receitasDaClasse;
        }, 0);
      }, 0);
      return sum + receitasDoGrupo;
    }, 0);

  const totalDespesas = relatorio
    .filter(grupo => Object.values(grupo.subgrupos).some((sub: any) => 
      Object.values(sub.classes).some((classe: any) => 
        classe.lancamentos.some((l: any) => l.tipo === 'DESPESA')
      )
    ))
    .reduce((sum, grupo) => {
      const despesasDoGrupo = Object.values(grupo.subgrupos).reduce((subSum, subgrupo: any) => {
        return subSum + Object.values(subgrupo.classes).reduce((classSum, classe: any) => {
          const despesasDaClasse = classe.lancamentos
            .filter((l: any) => l.tipo === 'DESPESA')
            .reduce((lSum: number, l: any) => lSum + parseFloat(l.valor), 0);
          return classSum + despesasDaClasse;
        }, 0);
      }, 0);
      return sum + despesasDoGrupo;
    }, 0);

  // Total geral = receitas - despesas
  const totalGeral = totalReceitas - totalDespesas;
  
  // Calcular total de lançamentos quitados
  const totalQuitados = relatorio.reduce((sum, grupo) => {
    return sum + Object.values(grupo.subgrupos).reduce((subSum, subgrupo) => {
      return subSum + Object.values(subgrupo.classes).reduce((classSum, classe) => {
        if (classe.quitado) {
          return classSum + classe.total;
        }
        return classSum;
      }, 0);
    }, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📊 Relatórios por Categoria</h1>
          <div className="flex gap-3">
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

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🔍 Filtros (aplicados automaticamente)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
              <select
                value={filtros.grupo_id}
                onChange={(e) => setFiltros({ ...filtros, grupo_id: e.target.value, subgrupo_id: '', classe_id: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {grupos.map(grupo => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subgrupo</label>
              <select
                value={filtros.subgrupo_id}
                onChange={(e) => setFiltros({ ...filtros, subgrupo_id: e.target.value, classe_id: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                disabled={!filtros.grupo_id}
              >
                <option value="">Todos</option>
                {subgrupos.map(subgrupo => (
                  <option key={subgrupo.id} value={subgrupo.id}>
                    {subgrupo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
              <select
                value={filtros.classe_id}
                onChange={(e) => setFiltros({ ...filtros, classe_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                disabled={!filtros.subgrupo_id}
              >
                <option value="">Todas</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.codigo} - {classe.descricao}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavra-chave</label>
              <input
                type="text"
                value={filtros.palavraChave}
                onChange={(e) => setFiltros({ ...filtros, palavraChave: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: agua, luz, aluguel"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFiltros({
                  tipo: 'TODOS',
                  dataInicio: '',
                  dataFim: '',
                  grupo_id: '',
                  subgrupo_id: '',
                  classe_id: '',
                  palavraChave: ''
                })}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                🔄 Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Total Receitas</p>
                <p className="text-3xl font-bold mt-1">R$ {totalReceitas.toFixed(2)}</p>
              </div>
              <div className="text-5xl opacity-20">📈</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Total Despesas</p>
                <p className="text-3xl font-bold mt-1">R$ {totalDespesas.toFixed(2)}</p>
              </div>
              <div className="text-5xl opacity-20">📉</div>
            </div>
          </div>

          <div className={`bg-gradient-to-r ${totalGeral >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white rounded-lg shadow-md p-6`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Saldo (Receitas - Despesas)</p>
                <p className="text-3xl font-bold mt-1">R$ {totalGeral.toFixed(2)}</p>
              </div>
              <div className="text-5xl opacity-20">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Total Quitado</p>
                <p className="text-3xl font-bold mt-1">R$ {totalQuitados.toFixed(2)}</p>
              </div>
              <div className="text-5xl opacity-20">✓</div>
            </div>
          </div>
        </div>

        {/* Relatório Hierárquico */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2">Carregando relatório...</p>
            </div>
          ) : relatorio.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum dado encontrado para os filtros selecionados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Código</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.map((grupo, gIdx) => (
                    <>
                      {/* GRUPO */}
                      <tr key={`grupo-${gIdx}`} className={`bg-gradient-to-r ${grupo.tipo === 'RECEITA' ? 'from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500' : 'from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500'} text-white font-bold transition-all`}>
                        <td className="px-6 py-4">{grupo.codigo}</td>
                        <td className="px-6 py-4 uppercase">{grupo.nome}</td>
                        <td className="px-6 py-4 text-right">R$ {grupo.total.toFixed(2)}</td>
                      </tr>

                      {/* SUBGRUPOS */}
                      {Object.values(grupo.subgrupos).map((subgrupo: any, sIdx) => (
                        <>
                          <tr key={`subgrupo-${gIdx}-${sIdx}`} className="bg-blue-50 hover:bg-blue-100 font-semibold text-blue-900 transition-colors">
                            <td className="px-6 py-3 pl-12">{subgrupo.codigo}</td>
                            <td className="px-6 py-3">{subgrupo.nome}</td>
                            <td className="px-6 py-3 text-right">R$ {subgrupo.total.toFixed(2)}</td>
                          </tr>

                          {/* CLASSES */}
                          {Object.values(subgrupo.classes).map((classe: any, cIdx) => (
                            <tr key={`classe-${gIdx}-${sIdx}-${cIdx}`} className={`border-b border-slate-100 transition-colors ${classe.quitado ? 'bg-green-50 hover:bg-green-100' : 'bg-white hover:bg-slate-50'}`}>
                              <td className={`px-6 py-3 pl-16 text-sm ${classe.quitado ? 'text-green-600' : 'text-slate-600'}`}>{classe.codigo}</td>
                              <td className={`px-6 py-3 text-sm ${classe.quitado ? 'text-green-700' : 'text-slate-700'}`}>{classe.nome}</td>
                              <td className={`px-6 py-3 text-right text-sm font-semibold ${classe.quitado ? 'text-green-700' : 'text-slate-900'}`}>
                                R$ {classe.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}