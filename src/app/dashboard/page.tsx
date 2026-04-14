/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';
import { Eye, EyeOff, Plus, List, BarChart3, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { initMonitor, captureException } from '@/lib/monitor';

const CORES_SUBGRUPOS = [
  '#5B8FF9','#5AD8A6','#F4664A','#FAAD14','#9661BC',
  '#78D3F8','#F6BD16','#61DDAA','#F6903D','#008685',
  '#E8684A','#6DC8EC','#9867BC','#F6C3B7','#AAD461',
  '#BEDED1','#F1907B',
];

const TOP_N_SUBGRUPOS = 10;

const CORES_CLASSES = [
  '#F4664A','#F6903D','#FAAD14','#F6BD16','#AAD461',
  '#5AD8A6','#61DDAA','#008685','#78D3F8','#5B8FF9',
  '#9661BC','#9867BC','#E8684A','#6DC8EC','#61DDAA',
  '#F6C3B7','#BEDED1',
];

interface Lancamento {
  id?: number | string;
  tipo: string;
  valor: number;
  data?: string;
  descricao_complementar?: string;
  classe_id?: number | null;
  cartao_id?: string | null;
  quitado?: boolean;
  classe?: {
    id: number;
    descricao: string;
    subgrupo?: {
      id: number;
      nome: string;
      grupo?: { id: number; nome: string; tipo: string };
    };
  } | null;
  [key: string]: unknown;
}

interface DashboardData {
  totalDespesas: number;
  totalReceitas: number;
  saldo: number;
  totalQuitado: number;
  faturasCartao: number;
  percentComprometido: number;
  aVencer: number;
  despesasPorSubgrupo: Array<{ subgrupo: string; valor: number }>;
  despesasPorClasse: Array<{ classe: string; valor: number }>;
  receitasPorSubgrupo: Array<{ subgrupo: string; valor: number }>;
  statusQuitado: { despQuitado: number; despPendente: number; recQuitado: number; recPendente: number };
  fluxoMensal: Array<{ mes: string; receitas: number; despesas: number; saldo: number }>;
  lancamentos: Lancamento[];
}

type TooltipEntry = {
  value?: number;
  name?: string;
  payload?: Record<string, unknown>;
  color?: string;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [valoresVisiveis, setValoresVisiveis] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGrupos, setExpandedGrupos] = useState<Set<string>>(new Set());
  const [expandedSubgrupos, setExpandedSubgrupos] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    initMonitor();
    carregarDados();

    const supabase = createClient();
    const channel = supabase
      .channel('dashboard-lancamentos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lancamentos' }, () => {
        carregarDados();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const carregarDados = async () => {
    try {
      const supabase = createClient();

      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Buscar lançamentos com relações para a tabela hierárquica
      const { data: lancamentosRaw, error: errorLanc } = await supabase
        .from('lancamentos')
        .select(`
          *,
          classe:classes(
            id, descricao,
            subgrupo:subgrupos(
              id, nome,
              grupo:grupos(id, nome, tipo)
            )
          )
        `)
        .order('data', { ascending: false });
      if (errorLanc) throw errorLanc;

      const lancamentos: Lancamento[] = (lancamentosRaw || []).map((l: any) => ({
        ...l,
        tipo: String(l.tipo ?? '').trim().toLowerCase(),
        valor: Number(l.valor ?? 0) || 0,
        classe_id: l.classe_id === undefined || l.classe_id === null ? null : Number(l.classe_id) || null,
        cartao_id: l.cartao_id ?? null,
        quitado: Boolean(l.quitado),
      }));

      const despesas = lancamentos.filter(l => l.tipo === 'despesa');
      const receitas = lancamentos.filter(l => l.tipo === 'receita');

      const totalDespesas = despesas.reduce((sum, l) => sum + (l.valor || 0), 0);
      const totalReceitas = receitas.reduce((sum, l) => sum + (l.valor || 0), 0);
      const totalQuitado = lancamentos.filter(l => l.quitado).reduce((sum, l) => sum + (l.valor || 0), 0);
      const faturasCartao = despesas.filter(l => l.cartao_id).reduce((sum, l) => sum + (l.valor || 0), 0);
      const percentComprometido = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;
      const aVencer = lancamentos.filter(l => !l.quitado).reduce((sum, l) => sum + (l.valor || 0), 0);

      // Agregações por subgrupo (despesas e receitas)
      const despSubgrupoSoma = new Map<string, number>();
      const recSubgrupoSoma = new Map<string, number>();
      const classesSoma = new Map<string, number>();

      despesas.forEach((item) => {
        const subgrupoNome = (item.classe as any)?.subgrupo?.nome ?? 'Sem Subgrupo';
        const nomeClasse = (item.classe as any)?.descricao ?? 'Sem Classe';
        const valor = item.valor || 0;
        despSubgrupoSoma.set(subgrupoNome, (despSubgrupoSoma.get(subgrupoNome) || 0) + valor);
        classesSoma.set(nomeClasse, (classesSoma.get(nomeClasse) || 0) + valor);
      });

      receitas.forEach((item) => {
        const subgrupoNome = (item.classe as any)?.subgrupo?.nome ?? 'Sem Subgrupo';
        const valor = item.valor || 0;
        recSubgrupoSoma.set(subgrupoNome, (recSubgrupoSoma.get(subgrupoNome) || 0) + valor);
      });

      const despesasPorSubgrupo = Array.from(despSubgrupoSoma.entries()).map(([subgrupo, valor]) => ({ subgrupo, valor }));
      const receitasPorSubgrupo = Array.from(recSubgrupoSoma.entries()).map(([subgrupo, valor]) => ({ subgrupo, valor }));
      const despesasPorClasse = Array.from(classesSoma.entries()).map(([classe, valor]) => ({ classe, valor })).sort((a, b) => b.valor - a.valor);

      // Quitado vs Pendente
      const despQuitado = despesas.filter(l => l.quitado).reduce((s, l) => s + l.valor, 0);
      const despPendente = despesas.filter(l => !l.quitado).reduce((s, l) => s + l.valor, 0);
      const recQuitado = receitas.filter(l => l.quitado).reduce((s, l) => s + l.valor, 0);
      const recPendente = receitas.filter(l => !l.quitado).reduce((s, l) => s + l.valor, 0);

      // Fluxo mensal
      const mesMap = new Map<string, { receitas: number; despesas: number; dt: Date }>();
      lancamentos.forEach(l => {
        if (!l.data) return;
        const d = new Date(l.data);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!mesMap.has(key)) mesMap.set(key, { receitas: 0, despesas: 0, dt: d });
        const entry = mesMap.get(key)!;
        if (l.tipo === 'receita') entry.receitas += l.valor;
        else entry.despesas += l.valor;
      });
      const fluxoMensal = Array.from(mesMap.entries())
        .sort((a, b) => a[1].dt.getTime() - b[1].dt.getTime())
        .slice(-12)
        .map(([key, v]) => ({
          mes: new Date(v.dt).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          receitas: v.receitas,
          despesas: v.despesas,
          saldo: v.receitas - v.despesas,
        }));

      setData({
        totalDespesas, totalReceitas,
        saldo: totalReceitas - totalDespesas,
        totalQuitado, faturasCartao, percentComprometido, aVencer,
        despesasPorSubgrupo, despesasPorClasse, receitasPorSubgrupo,
        statusQuitado: { despQuitado, despPendente, recQuitado, recPendente },
        fluxoMensal,
        lancamentos,
      });
    } catch (error) {
      captureException(error);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    if (!valoresVisiveis) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // Hierarquia para tabela colapsável
  const hierarquiaFiltrada = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.toLowerCase();
    const grupos: Record<string, {
      tipo: string; total: number;
      subgrupos: Record<string, { total: number; itens: Lancamento[] }>;
    }> = {};

    data.lancamentos.forEach(l => {
      const grupoNome = (l.classe as any)?.subgrupo?.grupo?.nome ?? 'Sem Grupo';
      const subgrupoNome = (l.classe as any)?.subgrupo?.nome ?? 'Sem Subgrupo';
      const descricao = String(l.descricao_complementar ?? '').toLowerCase();
      const classeNome = String((l.classe as any)?.descricao ?? '').toLowerCase();

      if (q && !descricao.includes(q) && !classeNome.includes(q) && !subgrupoNome.toLowerCase().includes(q)) return;

      if (!grupos[grupoNome]) grupos[grupoNome] = { tipo: l.tipo, total: 0, subgrupos: {} };
      if (!grupos[grupoNome].subgrupos[subgrupoNome]) grupos[grupoNome].subgrupos[subgrupoNome] = { total: 0, itens: [] };

      grupos[grupoNome].subgrupos[subgrupoNome].itens.push(l);
      grupos[grupoNome].subgrupos[subgrupoNome].total += l.valor;
      grupos[grupoNome].total += l.valor;
    });

    return Object.entries(grupos);
  }, [data, searchQuery]);

  const toggleGrupo = (nome: string) => {
    setExpandedGrupos(prev => { const s = new Set(prev); s.has(nome) ? s.delete(nome) : s.add(nome); return s; });
  };
  const toggleSubgrupo = (nome: string) => {
    setExpandedSubgrupos(prev => { const s = new Set(prev); s.has(nome) ? s.delete(nome) : s.add(nome); return s; });
  };

  const prepararDadosSubgrupos = () => {
    if (!data) return [];
    const arr = [...data.despesasPorSubgrupo];
    arr.sort((a, b) => b.valor - a.valor);
    if (arr.length <= TOP_N_SUBGRUPOS) return arr;
    const top = arr.slice(0, TOP_N_SUBGRUPOS);
    const rest = arr.slice(TOP_N_SUBGRUPOS);
    const restSum = rest.reduce((s, it) => s + (it.valor || 0), 0);
    top.push({ subgrupo: 'Outros', valor: restSum });
    return top;
  };

  

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) => {
    if (active && payload && payload.length > 0) {
      const total = payload.reduce((sum: number, entry: TooltipEntry) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-bold mb-2">{String(payload[0].payload?.subgrupo ?? '')}</p>
          {payload.map((entry: TooltipEntry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatarMoeda(entry.value || 0)} ({(((entry.value || 0) / total) * 100).toFixed(1)}%)
            </p>
          ))}
          <p className="font-bold text-sm mt-2 pt-2 border-t">Total: {formatarMoeda(total)}</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipPizza = ({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) => {
    if (active && payload && payload.length > 0) {
      const entry = payload[0];
      const total = data?.totalDespesas || 0;
      const percentual = (((entry.value || 0) / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-bold">{entry.name}</p>
          <p style={{ color: String(entry.payload?.fill ?? '') }}>{formatarMoeda(entry.value || 0)} ({percentual}%)</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const dadosSubgrupos = prepararDadosSubgrupos();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Financeiro</h1>
          <button onClick={() => setValoresVisiveis(!valoresVisiveis)} className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition">
            {valoresVisiveis ? <EyeOff size={20} /> : <Eye size={20} />}
            {valoresVisiveis ? 'Ocultar' : 'Mostrar'} Valores
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: 'linear-gradient(135deg,#F4664A,#e05a40)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">💸 Total de Despesas</h3>
            <p className="text-3xl font-bold">{formatarMoeda(data?.totalDespesas || 0)}</p>
            <div className="mt-2 h-1.5 rounded-full bg-white bg-opacity-30"><div className="h-1.5 rounded-full bg-white" style={{ width: `${Math.min(data?.percentComprometido || 0, 100)}%` }} /></div>
          </div>
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: 'linear-gradient(135deg,#5AD8A6,#3dc48e)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">💰 Total de Receitas</h3>
            <p className="text-3xl font-bold">{formatarMoeda(data?.totalReceitas || 0)}</p>
            <div className="mt-2 h-1.5 rounded-full bg-white bg-opacity-30"><div className="h-1.5 rounded-full bg-white" style={{ width: '100%' }} /></div>
          </div>
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: (data?.saldo || 0) >= 0 ? 'linear-gradient(135deg,#5B8FF9,#3a72e8)' : 'linear-gradient(135deg,#F6903D,#e07a25)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">⚖️ Saldo</h3>
            <p className="text-3xl font-bold">{formatarMoeda(data?.saldo || 0)}</p>
            <div className="mt-2 h-1.5 rounded-full bg-white bg-opacity-30"><div className="h-1.5 rounded-full bg-white" style={{ width: `${Math.min(Math.abs(((data?.saldo || 0) / (data?.totalReceitas || 1)) * 100), 100)}%` }} /></div>
          </div>
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: 'linear-gradient(135deg,#9661BC,#7d4da8)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">✅ Total Quitado</h3>
            <p className="text-3xl font-bold">{formatarMoeda(data?.totalQuitado || 0)}</p>
            <div className="mt-2 h-1.5 rounded-full bg-white bg-opacity-30"><div className="h-1.5 rounded-full bg-white" style={{ width: `${Math.min(((data?.totalQuitado || 0) / ((data?.totalDespesas || 1) + (data?.totalReceitas || 1))) * 100, 100)}%` }} /></div>
          </div>
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: 'linear-gradient(135deg,#f97316,#ea6c10)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">💳 Faturas de Cartão</h3>
            <p className="text-3xl font-bold">{formatarMoeda(data?.faturasCartao || 0)}</p>
            <div className="mt-2 h-1.5 rounded-full bg-white bg-opacity-30"><div className="h-1.5 rounded-full bg-white" style={{ width: `${Math.min(((data?.faturasCartao || 0) / (data?.totalDespesas || 1)) * 100, 100)}%` }} /></div>
          </div>
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: 'linear-gradient(135deg,#78D3F8,#4bbfe8)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">📊 % Comprometida</h3>
            <p className="text-3xl font-bold">{valoresVisiveis ? `${(data?.percentComprometido || 0).toFixed(1)}%` : '••••'}</p>
            <div className="mt-2 h-2 rounded-full bg-white bg-opacity-30">
              <div className="h-2 rounded-full bg-white" style={{ width: `${Math.min(data?.percentComprometido || 0, 100)}%` }} />
            </div>
          </div>
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">⏰ A Vencer</h3>
            <p className="text-3xl font-bold">{formatarMoeda(data?.aVencer || 0)}</p>
            <p className="text-xs opacity-75 mt-1">lançamentos pendentes</p>
            <div className="mt-2 h-1.5 rounded-full bg-white bg-opacity-30"><div className="h-1.5 rounded-full bg-white" style={{ width: `${Math.min(((data?.aVencer || 0) / ((data?.totalDespesas || 1) + (data?.totalReceitas || 1))) * 100, 100)}%` }} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button onClick={() => router.push('/lancamentos')} className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex items-center gap-3 transition">
            <Plus size={24} />
            <span className="font-medium">Novo Lançamento</span>
          </button>
          <button onClick={() => router.push('/lancamentos/lista')} className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex items-center gap-3 transition">
            <List size={24} />
            <span className="font-medium">Ver Lançamentos</span>
          </button>
          <button onClick={() => router.push('/relatorios')} className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex items-center gap-3 transition">
            <BarChart3 size={24} />
            <span className="font-medium">Relatórios</span>
          </button>
          <button onClick={() => router.push('/configuracoes')} className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-lg flex items-center gap-3 transition">
            <Settings size={24} />
            <span className="font-medium">Configurações</span>
          </button>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Despesas por Subgrupo</h2>
            <div className="w-full" style={{ height: '400px', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosSubgrupos} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subgrupo" angle={-45} textAnchor="end" height={100} interval={0} />
                  <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString()}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor">
                    {dadosSubgrupos.map((entry: any, idx: number) => (
                      <Cell key={`cell-sub-${idx}`} fill={CORES_SUBGRUPOS[idx % CORES_SUBGRUPOS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h3 className="font-bold text-sm text-gray-700 mb-3">Legenda de Subgrupos:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dadosSubgrupos.map((item: any, idx: number) => {
                  const color = CORES_SUBGRUPOS[idx % CORES_SUBGRUPOS.length];
                  const percent = data?.totalDespesas ? ((item.valor / data.totalDespesas) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={item.subgrupo} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                        <span className="text-sm text-gray-700">{item.subgrupo}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-800">{formatarMoeda(item.valor)}</div>
                        <div className="text-xs text-gray-500">{percent}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Distribuição de Despesas por Classe</h2>
            <div className="w-full" style={{ height: '500px', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.despesasPorClasse || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: { name?: string; percent?: number }) => {
                      const name = props.name || '';
                      const percent = props.percent || 0;
                      return `${name} (${(percent * 100).toFixed(1)}%)`;
                    }}
                    outerRadius={150}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="valor"
                    nameKey="classe"
                  >
                    {data?.despesasPorClasse.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_CLASSES[index % CORES_CLASSES.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPizza />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h3 className="font-bold text-sm text-gray-700 mb-3">Detalhamento por Classe:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data?.despesasPorClasse.map((item, index) => {
                  const percentual = ((item.valor / (data?.totalDespesas || 1)) * 100).toFixed(1);
                  return (
                    <div key={item.classe} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: CORES_CLASSES[index % CORES_CLASSES.length] }} />
                        <span className="text-sm font-medium text-gray-700">{item.classe}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-800">{formatarMoeda(item.valor)}</div>
                        <div className="text-xs text-gray-500">{percentual}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Receitas por Subgrupo */}
          {(data?.receitasPorSubgrupo || []).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🟢 Receitas por Subgrupo</h2>
              <div className="w-full" style={{ height: '300px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.receitasPorSubgrupo || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={50}
                      dataKey="valor"
                      nameKey="subgrupo"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name} (${((percent || 0) * 100).toFixed(1)}%)`}
                      labelLine={false}
                    >
                      {(data?.receitasPorSubgrupo || []).map((_: unknown, i: number) => (
                        <Cell key={`rec-${i}`} fill={['#22c55e','#16a34a','#4ade80','#86efac','#bbf7d0','#166534'][i % 6]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatarMoeda(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Quitado vs Pendente */}
          {data?.statusQuitado && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">✅ Quitado vs Pendente</h2>
              <div className="w-full" style={{ height: '280px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { categoria: 'Despesas', Quitado: data.statusQuitado.despQuitado, Pendente: data.statusQuitado.despPendente },
                      { categoria: 'Receitas',  Quitado: data.statusQuitado.recQuitado,  Pendente: data.statusQuitado.recPendente },
                    ]}
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categoria" />
                    <YAxis tickFormatter={(v: number) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatarMoeda(v)} />
                    <Legend />
                    <Bar dataKey="Quitado" fill="#22c55e" radius={[4,4,0,0]} />
                    <Bar dataKey="Pendente" fill="#f97316" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Fluxo Mensal */}
          {(data?.fluxoMensal || []).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Fluxo Mensal (12 meses)</h2>
              <div className="w-full" style={{ height: '320px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data?.fluxoMensal || []} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(v: number) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatarMoeda(v)} />
                    <Legend />
                    <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4,4,0,0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4,4,0,0]} />
                    <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tabela hierárquica */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📋 Lançamentos por Grupo / Subgrupo</h2>
              <input
                type="text"
                placeholder="🔍 Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {hierarquiaFiltrada.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Nenhum lançamento encontrado.</p>
            ) : (
              <div className="space-y-2">
                {hierarquiaFiltrada.map(([grupoNome, grupoData]) => {
                  const gAberto = expandedGrupos.has(grupoNome);
                  return (
                    <div key={grupoNome} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleGrupo(grupoNome)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 transition text-left"
                      >
                        <div className="flex items-center gap-2">
                          {gAberto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span className="font-semibold text-gray-800">{grupoNome}</span>
                          <span className="text-xs text-gray-500 ml-1">({grupoData.tipo})</span>
                        </div>
                        <span className="text-sm font-bold text-gray-700">{formatarMoeda(grupoData.total)}</span>
                      </button>
                      {gAberto && (
                        <div className="divide-y">
                          {Object.entries(grupoData.subgrupos).map(([subNome, subData]) => {
                            const sAberto = expandedSubgrupos.has(subNome);
                            return (
                              <div key={subNome}>
                                <button
                                  onClick={() => toggleSubgrupo(subNome)}
                                  className="w-full flex items-center justify-between px-8 py-2 bg-gray-50 hover:bg-gray-100 transition text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    {sAberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <span className="text-sm font-medium text-gray-700">{subNome}</span>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-600">{formatarMoeda(subData.total)}</span>
                                </button>
                                {sAberto && (
                                  <table className="w-full text-xs">
                                    <thead><tr className="bg-gray-50 text-gray-500 uppercase">
                                      <th className="px-10 py-1 text-left">Descrição</th>
                                      <th className="px-2 py-1 text-left">Data</th>
                                      <th className="px-2 py-1 text-left">Forma Pag.</th>
                                      <th className="px-2 py-1 text-right">Valor</th>
                                      <th className="px-2 py-1 text-center">Status</th>
                                    </tr></thead>
                                    <tbody>
                                      {subData.itens.map((item: Lancamento) => (
                                        <tr key={item.id} className="border-t hover:bg-blue-50 transition">
                                          <td className="px-10 py-1.5 text-gray-700">{item.descricao}</td>
                                          <td className="px-2 py-1.5 text-gray-500">{item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-'}</td>
                                          <td className="px-2 py-1.5 text-gray-500">{item.forma_pagamento || '-'}</td>
                                          <td className="px-2 py-1.5 text-right font-medium text-gray-800">{formatarMoeda(item.valor)}</td>
                                          <td className="px-2 py-1.5 text-center">
                                            {item.quitado
                                              ? <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">✓</span>
                                              : <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs">⏳</span>}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}