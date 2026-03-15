/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react';
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
} from 'recharts';
import { Eye, EyeOff, Plus, List, BarChart3, Settings } from 'lucide-react';
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
  classe_id?: number | null;
  cartao_id?: string | null;
  quitado?: boolean;
  [key: string]: unknown;
}

interface DashboardData {
  totalDespesas: number;
  totalReceitas: number;
  saldo: number;
  totalQuitado: number;
  faturasCartao: number;
  percentComprometido: number;
  despesasPorSubgrupo: Array<{ subgrupo: string; valor: number }>;
  despesasPorClasse: Array<{ classe: string; valor: number }>;
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
  const router = useRouter();

  useEffect(() => {
    initMonitor();
    carregarDados();
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

      // Buscar todos os lançamentos
      const { data: lancamentosAll, error: errorLanc } = await supabase.from('lancamentos').select('*');
      if (errorLanc) throw errorLanc;

      const lancamentos: Lancamento[] = (lancamentosAll || []).map((l: Record<string, unknown>) => {
        const raw = l as Record<string, unknown>;
        const tipo = String(raw['tipo'] ?? '').trim().toLowerCase();
        const valor = Number(raw['valor'] ?? 0) || 0;
        const rawClasseId = raw['classe_id'];
        const classe_id = rawClasseId === undefined || rawClasseId === null ? null : Number(rawClasseId as any) || null;
        const cartao_id = raw['cartao_id'] as string | null ?? null;
        const quitado = Boolean(raw['quitado']);
        return ({ ...raw, tipo, valor, classe_id, cartao_id, quitado } as unknown) as Lancamento;
      });

      const despesas = lancamentos.filter(l => l.tipo === 'despesa');
      const receitas = lancamentos.filter(l => l.tipo === 'receita');

      const totalDespesas = despesas.reduce((sum: number, l: Lancamento) => sum + (l.valor || 0), 0);
      const totalReceitas = receitas.reduce((sum: number, l: Lancamento) => sum + (l.valor || 0), 0);

      // Buscar classes, subgrupos e grupos
      const { data: todasClasses, error: errorClasses } = await supabase.from('classes').select('*');
      if (errorClasses) throw errorClasses;

      const { data: todosSubgrupos } = await supabase.from('subgrupos').select('*');
      const { data: todosGrupos } = await supabase.from('grupos').select('*');

      const classesById = new Map<number, any>();
      (todasClasses || []).forEach((c: any) => classesById.set(Number(c.id), c));

      const subgruposById = new Map<number, any>();
      (todosSubgrupos || []).forEach((s: any) => subgruposById.set(Number(s.id), s));

      const gruposById = new Map<number, any>();
      (todosGrupos || []).forEach((g: any) => gruposById.set(Number(g.id), g));

      // Agregar por subgrupo e por classe
      const subgruposSoma = new Map<string, number>();
      const classesSoma = new Map<string, number>();

      despesas.forEach((item: Lancamento) => {
        const classe = classesById.get(Number(item.classe_id || 0));
        if (!classe) return;

        const subgrupoObj = subgruposById.get(Number(classe.subgrupo_id || 0));
        const subgrupoNome = subgrupoObj ? String(subgrupoObj.nome ?? subgrupoObj.codigo ?? '') : ('Subgrupo ' + String(classe.subgrupo_id || ''));

        const valor = Number(item.valor) || 0;

        subgruposSoma.set(subgrupoNome, (subgruposSoma.get(subgrupoNome) || 0) + valor);

        const nomeClasse = String(classe.descricao ?? classe.codigo ?? ('Classe ' + String(classe.id)));
        classesSoma.set(nomeClasse, (classesSoma.get(nomeClasse) || 0) + valor);
      });

      const despesasPorSubgrupo = Array.from(subgruposSoma.entries()).map(([subgrupo, valor]) => ({ subgrupo, valor }));
      const despesasPorClasse = Array.from(classesSoma.entries()).map(([classe, valor]) => ({ classe, valor })).sort((a, b) => b.valor - a.valor);

      const totalQuitado = lancamentos.filter(l => l.quitado).reduce((sum, l) => sum + (l.valor || 0), 0);
      const faturasCartao = despesas.filter(l => l.cartao_id).reduce((sum, l) => sum + (l.valor || 0), 0);
      const percentComprometido = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;

      setData({ totalDespesas, totalReceitas, saldo: totalReceitas - totalDespesas, totalQuitado, faturasCartao, percentComprometido, despesasPorSubgrupo, despesasPorClasse });
    } catch (error) {
      captureException(error);
      // manter loading false e evitar crash
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    if (!valoresVisiveis) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: 'linear-gradient(135deg,#F4664A,#e05a40)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">💸 Total de Despesas</h3>
            <p className="text-3xl font-bold">{formatarMoeda(data?.totalDespesas || 0)}</p>
          </div>
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: 'linear-gradient(135deg,#5AD8A6,#3dc48e)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">💰 Total de Receitas</h3>
            <p className="text-3xl font-bold">{formatarMoeda(data?.totalReceitas || 0)}</p>
          </div>
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: (data?.saldo || 0) >= 0 ? 'linear-gradient(135deg,#5B8FF9,#3a72e8)' : 'linear-gradient(135deg,#F6903D,#e07a25)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">⚖️ Saldo</h3>
            <p className="text-3xl font-bold">{formatarMoeda(data?.saldo || 0)}</p>
          </div>
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: 'linear-gradient(135deg,#9661BC,#7d4da8)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">✅ Total Quitado</h3>
            <p className="text-3xl font-bold">{formatarMoeda(data?.totalQuitado || 0)}</p>
          </div>
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: 'linear-gradient(135deg,#5B8FF9,#3a72e8)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">💳 Faturas de Cartão</h3>
            <p className="text-3xl font-bold">{formatarMoeda(data?.faturasCartao || 0)}</p>
          </div>
          <div className="p-6 rounded-xl shadow-md text-white" style={{ background: 'linear-gradient(135deg,#78D3F8,#4bbfe8)' }}>
            <h3 className="text-sm font-medium opacity-90 mb-2">📊 % Comprometida</h3>
            <p className="text-3xl font-bold">{valoresVisiveis ? `${(data?.percentComprometido || 0).toFixed(1)}%` : '••••'}</p>
            <div className="mt-2 h-2 rounded-full bg-white bg-opacity-30">
              <div className="h-2 rounded-full bg-white" style={{ width: `${Math.min(data?.percentComprometido || 0, 100)}%` }} />
            </div>
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
        </div>
      </div>
    </div>
  );
}