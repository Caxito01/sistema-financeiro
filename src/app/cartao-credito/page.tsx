'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  ativo: boolean;
}

interface OFXTransacao {
  dtposted: string;
  trnamt: string;
  name: string;
  memo: string;
  fitid: string;
  selecionado: boolean;
  parcela?: string;
}

const BANDEIRAS: Record<string, string> = {
  visa: '💳 Visa',
  mastercard: '💳 Mastercard',
  amex: '💳 American Express',
  elo: '💳 Elo',
  hipercard: '💳 Hipercard',
  outro: '💳 Outro',
};

const BANDEIRA_CORES: Record<string, string> = {
  visa: 'from-blue-600 to-blue-800',
  mastercard: 'from-red-600 to-orange-500',
  amex: 'from-green-600 to-green-800',
  elo: 'from-yellow-500 to-yellow-700',
  hipercard: 'from-red-700 to-red-900',
  outro: 'from-gray-600 to-gray-800',
};

export default function CartaoCreditoPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Cartao | null>(null);
  const [form, setForm] = useState({ nome: '', bandeira: 'visa', limite: '', dia_fechamento: '1', dia_vencimento: '10' });

  // OFX
  const [ofxTransacoes, setOfxTransacoes] = useState<OFXTransacao[]>([]);
  const [ofxTexto, setOfxTexto] = useState('');
  const [cartaoSelecionadoOfx, setCartaoSelecionadoOfx] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error'; message: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  let _tid = 0;

  function addToast(type: 'success' | 'error', message: string) {
    const id = ++_tid;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  useEffect(() => { loadCartoes(); }, []);

  async function loadCartoes() {
    setLoading(true);
    const { data } = await supabase.from('cartoes').select('*').order('nome');
    if (data) setCartoes(data);
    setLoading(false);
  }

  function abrirNovo() {
    setEditando(null);
    setForm({ nome: '', bandeira: 'visa', limite: '', dia_fechamento: '1', dia_vencimento: '10' });
    setShowModal(true);
  }

  function abrirEditar(c: Cartao) {
    setEditando(c);
    setForm({ nome: c.nome, bandeira: c.bandeira, limite: String(c.limite), dia_fechamento: String(c.dia_fechamento), dia_vencimento: String(c.dia_vencimento) });
    setShowModal(true);
  }

  async function salvar() {
    const payload = {
      nome: form.nome.trim(),
      bandeira: form.bandeira,
      limite: parseFloat(form.limite) || 0,
      dia_fechamento: parseInt(form.dia_fechamento),
      dia_vencimento: parseInt(form.dia_vencimento),
      ativo: true,
    };
    if (!payload.nome) { addToast('error', 'Nome obrigatório'); return; }

    if (editando) {
      const { error } = await supabase.from('cartoes').update(payload).eq('id', editando.id);
      if (error) { addToast('error', 'Erro: ' + error.message); return; }
      addToast('success', 'Cartão atualizado!');
    } else {
      const { error } = await supabase.from('cartoes').insert(payload);
      if (error) { addToast('error', 'Erro: ' + error.message); return; }
      addToast('success', 'Cartão criado!');
    }
    setShowModal(false);
    loadCartoes();
  }

  async function toggleAtivo(c: Cartao) {
    await supabase.from('cartoes').update({ ativo: !c.ativo }).eq('id', c.id);
    loadCartoes();
  }

  async function deletar(id: string) {
    if (!window.confirm('Deletar cartão?')) return;
    const { error } = await supabase.from('cartoes').delete().eq('id', id);
    if (error) { addToast('error', 'Erro: ' + error.message); return; }
    addToast('success', 'Cartão removido.');
    loadCartoes();
  }

  // ---- OFX parsing ----
  function parseOFX(texto: string): OFXTransacao[] {
    const transacoes: OFXTransacao[] = [];
    const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;
    while ((match = regex.exec(texto)) !== null) {
      const bloco = match[1];
      const get = (tag: string) => {
        const m = new RegExp(`<${tag}>([^<\n\r]+)`, 'i').exec(bloco);
        return m ? m[1].trim() : '';
      };
      const name = get('NAME') || get('MEMO');
      const memo = get('MEMO');
      const trnamt = get('TRNAMT');
      const dtposted = get('DTPOSTED');
      const fitid = get('FITID');
      if (!trnamt || parseFloat(trnamt) >= 0) continue; // só débitos (valores negativos)
      // Detecta parcela ex: "1/12" ou "01/12"
      const parcelaMatch = /(\d+)\/(\d+)/.exec(name + ' ' + memo);
      transacoes.push({
        dtposted,
        trnamt,
        name,
        memo,
        fitid,
        selecionado: true,
        parcela: parcelaMatch ? parcelaMatch[0] : undefined,
      });
    }
    return transacoes;
  }

  function handleOFXTexto(txt: string) {
    setOfxTexto(txt);
    const parsed = parseOFX(txt);
    setOfxTransacoes(parsed);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => handleOFXTexto((ev.target?.result as string) || '');
    reader.readAsText(file, 'latin1');
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => handleOFXTexto((ev.target?.result as string) || '');
    reader.readAsText(file, 'latin1');
  }

  function formatarData(dtposted: string) {
    if (!dtposted || dtposted.length < 8) return dtposted;
    return `${dtposted.slice(6, 8)}/${dtposted.slice(4, 6)}/${dtposted.slice(0, 4)}`;
  }

  function isoData(dtposted: string) {
    if (!dtposted || dtposted.length < 8) return new Date().toISOString().slice(0, 10);
    return `${dtposted.slice(0, 4)}-${dtposted.slice(4, 6)}-${dtposted.slice(6, 8)}`;
  }

  async function importarSelecionadas() {
    const selecionadas = ofxTransacoes.filter(t => t.selecionado);
    if (!selecionadas.length) { addToast('error', 'Nenhuma transação selecionada'); return; }

    let ok = 0, erros = 0;
    for (const t of selecionadas) {
      const valor = Math.abs(parseFloat(t.trnamt));
      const { error } = await supabase.from('lancamentos').insert({
        descricao_complementar: t.name + (t.parcela ? ` (${t.parcela})` : ''),
        valor,
        data: isoData(t.dtposted),
        tipo: 'DESPESA',
        quitado: false,
        ...(cartaoSelecionadoOfx ? { cartao_id: cartaoSelecionadoOfx } : {}),
      });
      if (error) erros++; else ok++;
    }
    addToast(erros === 0 ? 'success' : 'error', `${ok} importadas${erros > 0 ? `, ${erros} erros` : ''}`);
    if (ok > 0) setOfxTransacoes([]);
  }

  const totalLimite = cartoes.filter(c => c.ativo).reduce((s, c) => s + (c.limite || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {t.type === 'success' ? '✅' : '❌'} {t.message}
          </div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">💳 Cartões de Crédito</h1>
          <div className="flex gap-3">
            <button onClick={() => router.push('/dashboard')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">← Voltar</button>
            <button onClick={abrirNovo} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">+ Novo Cartão</button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <p className="text-xs text-gray-500 mb-1">Total de Cartões</p>
            <p className="text-2xl font-bold text-gray-800">{cartoes.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
            <p className="text-xs text-gray-500 mb-1">Cartões Ativos</p>
            <p className="text-2xl font-bold text-gray-800">{cartoes.filter(c => c.ativo).length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
            <p className="text-xs text-gray-500 mb-1">Limite Total</p>
            <p className="text-2xl font-bold text-gray-800">R$ {totalLimite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Grid de cartões */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : cartoes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhum cartão cadastrado. Clique em "+ Novo Cartão".</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {cartoes.map(c => (
              <div key={c.id} className={`rounded-xl shadow-md overflow-hidden ${!c.ativo ? 'opacity-50' : ''}`}>
                <div className={`bg-gradient-to-br ${BANDEIRA_CORES[c.bandeira] || BANDEIRA_CORES.outro} p-5 text-white`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium opacity-80">{BANDEIRAS[c.bandeira] || BANDEIRAS.outro}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.ativo ? 'bg-green-400 text-green-900' : 'bg-gray-400 text-gray-900'}`}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
                  </div>
                  <p className="text-lg font-bold mb-1">{c.nome}</p>
                  <p className="text-sm opacity-70">Limite: R$ {(c.limite || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500 space-x-3">
                    <span>Fecha: dia {c.dia_fechamento}</span>
                    <span>Vence: dia {c.dia_vencimento}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleAtivo(c)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600" title={c.ativo ? 'Desativar' : 'Ativar'}>{c.ativo ? '⏸' : '▶'}</button>
                    <button onClick={() => abrirEditar(c)} className="text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600">✏️</button>
                    <button onClick={() => deletar(c.id)} className="text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600">🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* OFX Import */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📂 Importar OFX</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cartão (opcional)</label>
            <select value={cartaoSelecionadoOfx} onChange={e => setCartaoSelecionadoOfx(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full max-w-xs">
              <option value="">— sem cartão —</option>
              {cartoes.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
          >
            <p className="text-gray-500 text-sm">📁 Arraste o arquivo <strong>.OFX</strong> aqui ou <span className="text-blue-600 underline">clique para selecionar</span></p>
            <input ref={fileInputRef} type="file" accept=".ofx,.OFX" className="hidden" onChange={handleFileSelect} />
          </div>

          <div className="mt-3">
            <label className="block text-xs text-gray-500 mb-1">Ou cole o conteúdo OFX:</label>
            <textarea
              rows={4}
              value={ofxTexto}
              onChange={e => handleOFXTexto(e.target.value)}
              placeholder="<OFX>..."
              className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Transações parseadas */}
          {ofxTransacoes.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">{ofxTransacoes.length} transações encontradas</h3>
                <div className="flex gap-2">
                  <button onClick={() => setOfxTransacoes(t => t.map(x => ({ ...x, selecionado: true })))} className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Sel. todos</button>
                  <button onClick={() => setOfxTransacoes(t => t.map(x => ({ ...x, selecionado: false })))} className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Dessel. todos</button>
                  <button onClick={importarSelecionadas} className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 font-semibold">✅ Importar selecionadas</button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 w-8"><input type="checkbox" checked={ofxTransacoes.every(t => t.selecionado)} onChange={e => setOfxTransacoes(t => t.map(x => ({ ...x, selecionado: e.target.checked })))} /></th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Data</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Descrição</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Valor</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">Parcela</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ofxTransacoes.map((t, i) => (
                      <tr key={t.fitid + i} className={`${t.selecionado ? '' : 'opacity-40'} hover:bg-gray-50 transition`}>
                        <td className="px-3 py-2"><input type="checkbox" checked={t.selecionado} onChange={e => setOfxTransacoes(prev => prev.map((x, j) => j === i ? { ...x, selecionado: e.target.checked } : x))} /></td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatarData(t.dtposted)}</td>
                        <td className="px-3 py-2 text-gray-800 max-w-xs truncate" title={t.name}>{t.name}</td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">R$ {Math.abs(parseFloat(t.trnamt)).toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">{t.parcela ? <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">{t.parcela}</span> : <span className="text-gray-300">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">{editando ? 'Editar Cartão' : 'Novo Cartão'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cartão *</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Ex: Nubank" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bandeira</label>
                <select value={form.bandeira} onChange={e => setForm({ ...form, bandeira: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  {Object.entries(BANDEIRAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite (R$)</label>
                <input type="number" step="0.01" value={form.limite} onChange={e => setForm({ ...form, limite: e.target.value })} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0.00" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia Fechamento</label>
                  <input type="number" min="1" max="31" value={form.dia_fechamento} onChange={e => setForm({ ...form, dia_fechamento: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia Vencimento</label>
                  <input type="number" min="1" max="31" value={form.dia_vencimento} onChange={e => setForm({ ...form, dia_vencimento: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">Cancelar</button>
              <button onClick={salvar} className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
