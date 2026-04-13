'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function NovoLancamentoPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    tipo: 'DESPESA',
    grupo_id: '',
    subgrupo_id: '',
    classe_id: ''
  });

  const [grupos, setGrupos] = useState<any[]>([]);
  const [subgrupos, setSubgrupos] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModalAjuda, setShowModalAjuda] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadGrupos() {
      console.log('Carregando grupos...');
      const { data, error } = await supabase.from('grupos').select('*').eq('ativo', true).order('codigo', { ascending: true });
      if (error) {
        console.error('Erro ao carregar grupos:', error);
      } else {
        console.log('Grupos carregados:', data);
        setGrupos(data || []);
      }
    }
    loadGrupos();
  }, []);

  useEffect(() => {
    async function loadSubgrupos() {
      if (!formData.grupo_id) {
        setSubgrupos([]);
        return;
      }
      console.log('Carregando subgrupos para grupo:', formData.grupo_id);
      const { data, error } = await supabase
        .from('subgrupos')
        .select('*')
        .eq('grupo_id', formData.grupo_id)
        .eq('ativo', true)
        .order('codigo');
      if (error) {
        console.error('Erro ao carregar subgrupos:', error);
      } else {
        console.log('Subgrupos carregados:', data);
        setSubgrupos(data || []);
      }
    }
    loadSubgrupos();
  }, [formData.grupo_id]);

  useEffect(() => {
    async function loadClasses() {
      if (!formData.subgrupo_id) {
        setClasses([]);
        return;
      }
      console.log('Carregando classes para subgrupo:', formData.subgrupo_id);
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('subgrupo_id', formData.subgrupo_id)
        .eq('ativo', true)
        .order('codigo');
      if (error) {
        console.error('Erro ao carregar classes:', error);
      } else {
        console.log('Classes carregadas:', data);
        setClasses(data || []);
      }
    }
    loadClasses();
  }, [formData.subgrupo_id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('lancamentos').insert({
        descricao_complementar: formData.descricao,
        valor: parseFloat(formData.valor),
        data: formData.data,
        tipo: formData.tipo,
        classe_id: formData.classe_id
      });

      if (error) throw error;

      setFeedback({ type: 'success', message: 'Lançamento criado com sucesso! Redirecionando...' });
      setTimeout(() => router.push('/lancamentos/lista'), 1500);
    } catch (error) {
      console.error('Erro completo:', error);
      setFeedback({ type: 'error', message: 'Erro ao criar lançamento: ' + (error as any).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">💰 Novo Lançamento</h1>
          <button
            onClick={() => setShowModalAjuda(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            title="Ajuda"
          >
            ❓ Ajuda
          </button>
        </div>
        {feedback && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-300 text-green-800'
              : 'bg-red-50 border border-red-300 text-red-800'
          }`}>
            {feedback.type === 'success' ? '✅ ' : '❌ '}{feedback.message}
            <button onClick={() => setFeedback(null)} className="float-right font-bold ml-4 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md p-6">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'DESPESA', grupo_id: '', subgrupo_id: '', classe_id: '' })}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                    formData.tipo === 'DESPESA'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  📉 Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'RECEITA', grupo_id: '', subgrupo_id: '', classe_id: '' })}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                    formData.tipo === 'RECEITA'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  📈 Receita
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/cartao-credito')}
                  className="flex-1 py-3 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  💳 Cartão de Crédito
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                required
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Conta de luz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.tipo === 'RECEITA' ? 'Data *' : 'Data de Vencimento *'}
              </label>
              <input
                type="date"
                required
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grupo * ({grupos.length} disponíveis)
              </label>
              <select
                required
                value={formData.grupo_id}
                onChange={(e) => setFormData({ ...formData, grupo_id: e.target.value, subgrupo_id: '', classe_id: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {grupos
                  .filter(g => g.tipo === formData.tipo)
                  .map(grupo => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.codigo} - {grupo.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subgrupo * ({subgrupos.length} disponíveis)
              </label>
              <select
                required
                value={formData.subgrupo_id}
                onChange={(e) => setFormData({ ...formData, subgrupo_id: e.target.value, classe_id: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!formData.grupo_id}
              >
                <option value="">Selecione...</option>
                {subgrupos.map(subgrupo => (
                  <option key={subgrupo.id} value={subgrupo.id}>
                    {subgrupo.codigo} - {subgrupo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classe * ({classes.length} disponíveis)
              </label>
              <select
                required
                value={formData.classe_id}
                onChange={(e) => setFormData({ ...formData, classe_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!formData.subgrupo_id}
              >
                <option value="">Selecione...</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.codigo} - {classe.descricao}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? 'Salvando...' : '✅ Salvar Lançamento'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Ajuda */}
      {showModalAjuda && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">📚 Guia - Novo Lançamento</h2>
              <button
                onClick={() => setShowModalAjuda(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <h3 className="text-xl font-bold text-blue-600 mb-3">🎯 Como Adicionar um Lançamento</h3>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600 min-w-fit">1.</span>
                    <p><strong>Escolha o Tipo:</strong> Selecione se é uma DESPESA ou RECEITA</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600 min-w-fit">2.</span>
                    <p><strong>Selecione a Categoria:</strong> Escolha o Grupo → Subgrupo → Classe para classificar o lançamento</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600 min-w-fit">3.</span>
                    <p><strong>Preencha os Dados:</strong> Data, Descrição (opcional) e Valor</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-600 min-w-fit">4.</span>
                    <p><strong>Confirme:</strong> Clique em "Adicionar Lançamento" para salvar</p>
                  </li>
                </ol>
              </section>

              <section>
                <h3 className="text-xl font-bold text-blue-600 mb-3">💡 Dicas</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• A data padrão é hoje, mas você pode alterar para qualquer data</li>
                  <li>• A descrição é opcional e útil para adicionar detalhes</li>
                  <li>• As categorias são definidas em Configurações</li>
                  <li>• Você pode visualizar todos os lançamentos em "Lançamentos → Lista"</li>
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