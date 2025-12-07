'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus, Edit, Trash2, Search, ChevronDown } from 'lucide-react';
import { captureException } from '@/lib/monitor';

interface Grupo {
  id: number;
  codigo: number;
  nome: string;
  tipo: 'DESPESA' | 'RECEITA';
  ativo: boolean;
}

interface Subgrupo {
  id: number;
  grupo_id: number;
  codigo: number;
  nome: string;
  ativo: boolean;
}

interface Classe {
  id: number;
  subgrupo_id: number;
  codigo: string;
  descricao: string;
  palavras_chave: string[];
  ativo: boolean;
}

interface FormaPagamento {
  id: number;
  nome: string;
  ativo: boolean;
}

type ModalMode = 'create' | 'edit' | 'delete' | null;
type EntityType = 'grupo' | 'subgrupo' | 'classe' | 'formaPagamento';

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [subgrupos, setSubgrupos] = useState<Subgrupo[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);

  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null);
  const [selectedSubgrupoId, setSelectedSubgrupoId] = useState<number | null>(null);
  const [selectedClasseId, setSelectedClasseId] = useState<number | null>(null);

  const [filteredSubgrupos, setFilteredSubgrupos] = useState<Subgrupo[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Classe[]>([]);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [editingEntity, setEditingEntity] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [expandedGrupos, setExpandedGrupos] = useState<Set<number>>(new Set());
  const [showBannerAjuda, setShowBannerAjuda] = useState(true);
  const [showModalAjuda, setShowModalAjuda] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  // Auto-expandir grupos quando há busca ativa
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const gruposComResultados = grupos.filter(g => {
        const grupoMatch = g.nome.toLowerCase().includes(term) || g.codigo.toString().includes(term);
        const hasMatchingSubgrupo = subgrupos.some(s => 
          s.grupo_id === g.id && (s.nome.toLowerCase().includes(term) || s.codigo.toString().includes(term))
        );
        const hasMatchingClasse = classes.some(c => {
          const subgrupo = subgrupos.find(s => s.id === c.subgrupo_id);
          return subgrupo?.grupo_id === g.id && (c.descricao.toLowerCase().includes(term) || c.codigo.toLowerCase().includes(term));
        });
        return grupoMatch || hasMatchingSubgrupo || hasMatchingClasse;
      });
      setExpandedGrupos(new Set(gruposComResultados.map(g => g.id)));
    }
  }, [searchTerm, grupos, subgrupos, classes]);

  useEffect(() => {
    if (selectedGrupoId) {
      const filtered = subgrupos.filter(s => s.grupo_id === selectedGrupoId);
      setFilteredSubgrupos(filtered);
      setSelectedSubgrupoId(null);
      setFilteredClasses([]);
    } else {
      setFilteredSubgrupos([]);
      setFilteredClasses([]);
    }
  }, [selectedGrupoId, subgrupos]);

  useEffect(() => {
    if (selectedSubgrupoId) {
      const filtered = classes.filter(c => c.subgrupo_id === selectedSubgrupoId);
      setFilteredClasses(filtered);
      setSelectedClasseId(null);
    } else {
      setFilteredClasses([]);
    }
  }, [selectedSubgrupoId, classes]);

  const carregarDados = async () => {
    try {
      const supabase = createClient();

      const [{ data: gruposData }, { data: subgruposData }, { data: classesData }, { data: formasPagamentoData }] = await Promise.all([
        supabase.from('grupos').select('*').order('codigo'),
        supabase.from('subgrupos').select('*').order('codigo'),
        supabase.from('classes').select('*').order('codigo'),
        supabase.from('formas_pagamento').select('*').order('nome'),
      ]);

      setGrupos(gruposData || []);
      setSubgrupos(subgruposData || []);
      setClasses(classesData || []);
      setFormasPagamento(formasPagamentoData || []);
      console.log('Formas de Pagamento carregadas:', formasPagamentoData);
    } catch (error) {
      captureException(error);
      showNotification('error', 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const openModal = (mode: ModalMode, type: EntityType, entity?: any) => {
    setModalMode(mode);
    setEntityType(type);
    setEditingEntity(entity || null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEntityType(null);
    setEditingEntity(null);
  };

  const toggleGrupoExpansion = (grupoId: number) => {
    const newSet = new Set(expandedGrupos);
    if (newSet.has(grupoId)) {
      newSet.delete(grupoId);
    } else {
      newSet.add(grupoId);
    }
    setExpandedGrupos(newSet);
  };

  const handleSave = async (data: any) => {
    try {
      const supabase = createClient();
      
      if (modalMode === 'create') {
        if (entityType === 'grupo') {
          await supabase.from('grupos').insert(data);
        } else if (entityType === 'subgrupo') {
          await supabase.from('subgrupos').insert(data);
        } else if (entityType === 'classe') {
          await supabase.from('classes').insert(data);
        } else if (entityType === 'formaPagamento') {
          await supabase.from('formas_pagamento').insert(data);
        }
        showNotification('success', `${entityType} criado com sucesso!`);
      } else if (modalMode === 'edit') {
        if (entityType === 'grupo') {
          await supabase.from('grupos').update(data).eq('id', editingEntity.id);
        } else if (entityType === 'subgrupo') {
          await supabase.from('subgrupos').update(data).eq('id', editingEntity.id);
        } else if (entityType === 'classe') {
          await supabase.from('classes').update(data).eq('id', editingEntity.id);
        } else if (entityType === 'formaPagamento') {
          await supabase.from('formas_pagamento').update(data).eq('id', editingEntity.id);
        }
        showNotification('success', `${entityType} atualizado com sucesso!`);
      }

      await carregarDados();
      closeModal();
    } catch (error) {
      captureException(error);
      showNotification('error', 'Erro ao salvar');
    }
  };

  const handleDelete = async () => {
    if (!editingEntity) return;

    try {
      const supabase = createClient();

      if (entityType === 'grupo') {
        const { data: subgruposVinculados } = await supabase.from('subgrupos').select('id').eq('grupo_id', editingEntity.id);
        if (subgruposVinculados && subgruposVinculados.length > 0) {
          showNotification('error', 'Não é possível excluir um grupo com subgrupos vinculados');
          return;
        }
        await supabase.from('grupos').delete().eq('id', editingEntity.id);
      } else if (entityType === 'subgrupo') {
        const { data: classesVinculadas } = await supabase.from('classes').select('id').eq('subgrupo_id', editingEntity.id);
        if (classesVinculadas && classesVinculadas.length > 0) {
          showNotification('error', 'Não é possível excluir um subgrupo com classes vinculadas');
          return;
        }
        await supabase.from('subgrupos').delete().eq('id', editingEntity.id);
      } else if (entityType === 'classe') {
        await supabase.from('classes').delete().eq('id', editingEntity.id);
      } else if (entityType === 'formaPagamento') {
        await supabase.from('formas_pagamento').delete().eq('id', editingEntity.id);
      }

      showNotification('success', `${entityType} excluído com sucesso!`);
      await carregarDados();
      closeModal();
    } catch (error) {
      captureException(error);
      showNotification('error', 'Erro ao excluir');
    }
  };

  const getFilteredGrupos = () => {
    const term = searchTerm.toLowerCase();
    if (!searchTerm) return grupos;
    
    // Filtra grupos que correspondem à busca ou que têm subgrupos/classes que correspondem
    return grupos.filter(g => {
      const grupoMatch = g.nome.toLowerCase().includes(term) || g.codigo.toString().includes(term);
      const hasMatchingSubgrupo = subgrupos.some(s => 
        s.grupo_id === g.id && (s.nome.toLowerCase().includes(term) || s.codigo.toString().includes(term))
      );
      const hasMatchingClasse = classes.some(c => {
        const subgrupo = subgrupos.find(s => s.id === c.subgrupo_id);
        return subgrupo?.grupo_id === g.id && (c.descricao.toLowerCase().includes(term) || c.codigo.toLowerCase().includes(term));
      });
      
      return grupoMatch || hasMatchingSubgrupo || hasMatchingClasse;
    });
  };

  const getFilteredSubgruposByGrupo = (grupoId: number) => {
    const term = searchTerm.toLowerCase();
    const subs = subgrupos.filter(s => s.grupo_id === grupoId);
    if (!searchTerm) return subs;
    
    // Filtra subgrupos que correspondem à busca ou que têm classes que correspondem
    return subs.filter(s => {
      const subgrupoMatch = s.nome.toLowerCase().includes(term) || s.codigo.toString().includes(term);
      const hasMatchingClasse = classes.some(c => 
        c.subgrupo_id === s.id && (c.descricao.toLowerCase().includes(term) || c.codigo.toLowerCase().includes(term))
      );
      
      return subgrupoMatch || hasMatchingClasse;
    });
  };

  const getFilteredClassesBySubgrupo = (subgrupoId: number) => {
    const term = searchTerm.toLowerCase();
    const cls = classes.filter(c => c.subgrupo_id === subgrupoId);
    if (!searchTerm) return cls;
    return cls.filter(c => c.descricao.toLowerCase().includes(term) || c.codigo.toLowerCase().includes(term));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Configurações - Hierarquia</h1>
          <div className="flex gap-3">
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
          </div>
        </div>

        {notification && (
          <div className={`mb-4 p-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        {/* Banner de Ajuda Expansível */}
        {showBannerAjuda && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="text-blue-500 text-2xl">💡</div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 mb-2">Bem-vindo às Configurações!</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    Aqui você gerencia a estrutura hierárquica do seu sistema financeiro: <strong>Grupos → Subgrupos → Classes</strong>
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 ml-4">
                    <li>• Use a <strong>Seleção Hierárquica</strong> para criar e editar itens</li>
                    <li>• A <strong>Visualização em Árvore</strong> mostra toda a estrutura</li>
                    <li>• Gerencie <strong>Formas de Pagamento</strong> na seção abaixo</li>
                    <li>• Clique em <strong>❓ Ajuda</strong> para mais informações</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setShowBannerAjuda(false)}
                className="text-blue-500 hover:text-blue-700 text-xl font-bold ml-4"
                title="Fechar"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seção Dropdowns Cascata */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Seleção Hierárquica</h2>
              <div className="group relative">
                <span className="text-blue-500 cursor-help text-lg">ⓘ</span>
                <div className="invisible group-hover:visible absolute left-0 top-6 bg-gray-800 text-white text-sm rounded-lg p-3 w-64 z-10 shadow-lg">
                  <p className="font-semibold mb-1">Como usar:</p>
                  <p className="text-xs leading-relaxed">
                    Selecione um item nos dropdowns para editá-lo ou excluí-lo. 
                    Use o botão <span className="text-blue-300">+</span> para criar novos itens na hierarquia.
                  </p>
                </div>
              </div>
            </div>

            {/* Dicas Importantes */}
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500 mb-4">
              <h3 className="text-sm font-bold text-yellow-800 mb-2">💡 Dicas Importantes</h3>
              <ul className="space-y-1 text-xs text-yellow-800">
                <li>• Planeje bem sua hierarquia antes de criar muitos lançamentos</li>
                <li>• Use códigos numéricos crescentes para facilitar a organização</li>
                <li>• Desative itens em vez de excluí-los para manter histórico</li>
                <li>• Grupos devem ser DESPESA ou RECEITA</li>
                <li>• Classes podem ter palavras-chave para facilitar buscas</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                    value={selectedGrupoId || ''}
                    onChange={(e) => setSelectedGrupoId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Selecione um grupo</option>
                    {getFilteredGrupos().map(g => (
                      <option key={g.id} value={g.id}>{g.codigo} - {g.nome}</option>
                    ))}
                  </select>
                  <button onClick={() => openModal('create', 'grupo')} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                    <Plus size={20} />
                  </button>
                  {selectedGrupoId && (
                    <>
                      <button onClick={() => openModal('edit', 'grupo', grupos.find(g => g.id === selectedGrupoId))} className="bg-yellow-600 text-white p-2 rounded hover:bg-yellow-700">
                        <Edit size={20} />
                      </button>
                      <button onClick={() => openModal('delete', 'grupo', grupos.find(g => g.id === selectedGrupoId))} className="bg-red-600 text-white p-2 rounded hover:bg-red-700">
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subgrupo</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                    value={selectedSubgrupoId || ''}
                    onChange={(e) => setSelectedSubgrupoId(e.target.value ? Number(e.target.value) : null)}
                    disabled={!selectedGrupoId}
                  >
                    <option value="">{selectedGrupoId ? 'Selecione um subgrupo' : 'Primeiro selecione um grupo'}</option>
                    {filteredSubgrupos.map(s => (
                      <option key={s.id} value={s.id}>{s.codigo} - {s.nome}{!s.ativo ? ' (inativo)' : ''}</option>
                    ))}
                  </select>
                  {selectedGrupoId && (
                    <button onClick={() => openModal('create', 'subgrupo', { grupo_id: selectedGrupoId })} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                      <Plus size={20} />
                    </button>
                  )}
                  {selectedSubgrupoId && (
                    <>
                      <button onClick={() => openModal('edit', 'subgrupo', subgrupos.find(s => s.id === selectedSubgrupoId))} className="bg-yellow-600 text-white p-2 rounded hover:bg-yellow-700">
                        <Edit size={20} />
                      </button>
                      <button onClick={() => openModal('delete', 'subgrupo', subgrupos.find(s => s.id === selectedSubgrupoId))} className="bg-red-600 text-white p-2 rounded hover:bg-red-700">
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                    value={selectedClasseId || ''}
                    onChange={(e) => setSelectedClasseId(e.target.value ? Number(e.target.value) : null)}
                    disabled={!selectedSubgrupoId}
                  >
                    <option value="">{selectedSubgrupoId ? 'Selecione uma classe' : 'Primeiro selecione um subgrupo'}</option>
                    {filteredClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.codigo} - {c.descricao}{!c.ativo ? ' (inativo)' : ''}</option>
                    ))}
                  </select>
                  {selectedSubgrupoId && (
                    <button onClick={() => openModal('create', 'classe', { subgrupo_id: selectedSubgrupoId })} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                      <Plus size={20} />
                    </button>
                  )}
                  {selectedClasseId && (
                    <>
                      <button onClick={() => openModal('edit', 'classe', classes.find(c => c.id === selectedClasseId))} className="bg-yellow-600 text-white p-2 rounded hover:bg-yellow-700">
                        <Edit size={20} />
                      </button>
                      <button onClick={() => openModal('delete', 'classe', classes.find(c => c.id === selectedClasseId))} className="bg-red-600 text-white p-2 rounded hover:bg-red-700">
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seção Visualização em Árvore */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Visualização Hierárquica</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded pl-10 pr-3 py-2 w-64"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {getFilteredGrupos().map(grupo => (
                <div key={grupo.id} className="mb-2">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded hover:bg-blue-100 cursor-pointer" onClick={() => toggleGrupoExpansion(grupo.id)}>
                    {expandedGrupos.has(grupo.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className={`font-medium ${!grupo.ativo ? 'text-red-600' : ''}`}>
                      {grupo.codigo} - {grupo.nome}{!grupo.ativo ? ' (inativo)' : ''}
                    </span>
                  </div>

                  {expandedGrupos.has(grupo.id) && (
                    <div className="ml-6 mt-1">
                      {getFilteredSubgruposByGrupo(grupo.id).map(subgrupo => (
                        <div key={subgrupo.id} className="mb-1">
                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded hover:bg-green-100">
                            <ChevronRight size={14} />
                            <span className={`text-sm ${!subgrupo.ativo ? 'text-red-600' : ''}`}>
                              {subgrupo.codigo} - {subgrupo.nome}{!subgrupo.ativo ? ' (inativo)' : ''}
                            </span>
                          </div>
                          <div className="ml-6 mt-1">
                            {getFilteredClassesBySubgrupo(subgrupo.id).map(classe => (
                              <div key={classe.id} className={`p-1 text-sm hover:bg-gray-100 rounded ${!classe.ativo ? 'text-red-600' : 'text-gray-700'}`}>
                                • {classe.codigo} - {classe.descricao}{!classe.ativo ? ' (inativo)' : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Seção Formas de Pagamento */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            💳 Formas de Pagamento ({formasPagamento.length})
          </h2>

          <div className="space-y-4">
            {/* Lista de formas de pagamento */}
            <div className="space-y-2">
              {formasPagamento.length > 0 ? (
                formasPagamento.map(forma => (
                  <div key={forma.id} className="flex gap-2 items-center">
                    <div className={`flex-1 border border-gray-300 rounded px-3 py-2 ${!forma.ativo ? 'bg-red-50 text-red-600' : 'bg-white'}`}>
                      {forma.nome}{!forma.ativo ? ' (inativo)' : ''}
                    </div>
                    <button 
                      onClick={() => openModal('edit', 'formaPagamento', forma)} 
                      className="bg-yellow-600 text-white p-2 rounded hover:bg-yellow-700"
                      title="Editar"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => openModal('delete', 'formaPagamento', forma)} 
                      className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                      title="Excluir"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">Nenhuma forma de pagamento cadastrada. Clique no botão abaixo para adicionar.</p>
              )}
            </div>

            {/* Botão adicionar */}
            <div className="flex gap-2">
              <button 
                onClick={() => openModal('create', 'formaPagamento')} 
                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                title="Adicionar"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        {modalMode && entityType && (
          <EntityModal
            mode={modalMode}
            type={entityType}
            entity={editingEntity}
            grupos={grupos}
            subgrupos={subgrupos}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={closeModal}
          />
        )}

        {/* Modal de Ajuda */}
        {showModalAjuda && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">📚 Guia de Configurações</h2>
                <button
                  onClick={() => setShowModalAjuda(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Visão Geral */}
                <section>
                  <h3 className="text-xl font-bold text-blue-600 mb-3">🎯 Visão Geral</h3>
                  <p className="text-gray-700 mb-2">
                    A página de Configurações permite organizar seus lançamentos financeiros em uma estrutura hierárquica de 3 níveis que pode ser organizado da forma que preferir:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="font-mono text-sm">
                      <strong className="text-blue-600">Grupo</strong> → <strong className="text-green-600">Subgrupo</strong> → <strong className="text-purple-600">Classe</strong>
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Exemplo1: <span className="text-blue-600">DESPESAS</span> → <span className="text-green-600">IMÓVEL</span> → <span className="text-purple-600">Energia Elétrica</span>
                    <p/>Exemplo2: <span className="text-blue-600">DESPESAS COM FILHOS</span> → <span className="text-green-600">CARLOS EDU</span> → <span className="text-purple-600">Faculdade</span>
                    </p>
                  </div>
                </section>

                {/* Seleção Hierárquica */}
                <section>
                  <h3 className="text-xl font-bold text-blue-600 mb-3">🔧 Seleção Hierárquica</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="text-2xl">➕</span>
                      <div>
                        <p className="font-semibold">Criar Novo Item</p>
                        <p className="text-sm text-gray-600">Clique no botão <span className="text-blue-500">+</span> ao lado do dropdown para criar um novo grupo, subgrupo ou classe.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-2xl">✏️</span>
                      <div>
                        <p className="font-semibold">Editar Item</p>
                        <p className="text-sm text-gray-600">Selecione um item no dropdown e clique no botão amarelo <span className="text-yellow-600">✏️</span> para editá-lo.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-2xl">🗑️</span>
                      <div>
                        <p className="font-semibold">Excluir Item</p>
                        <p className="text-sm text-gray-600">Selecione um item e clique no botão vermelho <span className="text-red-600">🗑️</span>. Não é possível excluir itens com dependências.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Visualização em Árvore */}
                <section>
                  <h3 className="text-xl font-bold text-blue-600 mb-3">🌳 Visualização em Árvore</h3>
                  <p className="text-gray-700 mb-3">
                    A visualização em árvore mostra toda a estrutura hierárquica de forma visual:
                  </p>
                  <ul className="space-y-2 ml-4 mb-4">
                    <li className="flex gap-2">
                      <span>▶️</span>
                      <p className="text-sm text-gray-700">Clique nas setas para expandir/recolher grupos</p>
                    </li>
                    <li className="flex gap-2">
                      <span>🔍</span>
                      <p className="text-sm text-gray-700">Use a busca para filtrar itens por nome ou código</p>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-600">⚠️</span>
                      <p className="text-sm text-gray-700">Itens inativos aparecem em <span className="text-red-600">vermelho</span> com "(inativo)"</p>
                    </li>
                  </ul>
                  
                  {/* Exemplo Visual */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Exemplo de Estrutura:</p>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                        <span>▼</span>
                        <span className="font-medium">1 - DESPESAS</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <span>▶</span>
                          <span className="text-sm">10 - IMÓVEL</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          <div className="p-1 text-gray-700">• ELET - Energia Elétrica</div>
                          <div className="p-1 text-gray-700">• AGUA - Água</div>
                          <div className="p-1 text-gray-700">• ALUG - Aluguel</div>
                        </div>
                      </div>
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <span>▶</span>
                          <span className="text-sm">20 - PESSOAL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Formas de Pagamento */}
                <section>
                  <h3 className="text-xl font-bold text-blue-600 mb-3">💳 Formas de Pagamento</h3>
                  <p className="text-gray-700 mb-2">
                    Gerencie as formas de pagamento disponíveis no sistema:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex gap-2">
                      <span>✅</span>
                      <p className="text-sm text-gray-700">Adicione formas como: Dinheiro, PIX, Cartão, etc.</p>
                    </li>
                    <li className="flex gap-2">
                      <span>🔄</span>
                      <p className="text-sm text-gray-700">Ative/Desative formas sem excluí-las</p>
                    </li>
                    <li className="flex gap-2">
                      <span>📝</span>
                      <p className="text-sm text-gray-700">Edite nomes quando necessário</p>
                    </li>
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
    </div>
  );
}

interface EntityModalProps {
  mode: ModalMode;
  type: EntityType;
  entity: any;
  grupos: Grupo[];
  subgrupos: Subgrupo[];
  onSave: (data: any) => void;
  onDelete: () => void;
  onClose: () => void;
}

function EntityModal({ mode, type, entity, grupos, subgrupos, onSave, onDelete, onClose }: EntityModalProps) {
  const [formData, setFormData] = useState<any>(entity || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (type === 'grupo') {
      if (!formData.nome?.trim()) newErrors.nome = 'Nome é obrigatório';
      if (!formData.codigo) newErrors.codigo = 'Código é obrigatório';
      if (!formData.tipo) newErrors.tipo = 'Tipo é obrigatório';
    } else if (type === 'subgrupo') {
      if (!formData.nome?.trim()) newErrors.nome = 'Nome é obrigatório';
      if (!formData.codigo) newErrors.codigo = 'Código é obrigatório';
      if (!formData.grupo_id) newErrors.grupo_id = 'Grupo é obrigatório';
    } else if (type === 'classe') {
      if (!formData.descricao?.trim()) newErrors.descricao = 'Descrição é obrigatória';
      if (!formData.codigo?.trim()) newErrors.codigo = 'Código é obrigatório';
      if (!formData.subgrupo_id) newErrors.subgrupo_id = 'Subgrupo é obrigatório';
    } else if (type === 'formaPagamento') {
      if (!formData.nome?.trim()) newErrors.nome = 'Nome é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ ...formData, ativo: formData.ativo !== false });
  };

  if (mode === 'delete') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar Exclusão</h3>
          <p className="text-gray-600 mb-6">
            Tem certeza que deseja excluir este {type}? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
            <button onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Excluir</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {mode === 'create' ? 'Criar' : 'Editar'} {type}
        </h3>

        <div className="space-y-4">
          {type === 'grupo' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                <input
                  type="number"
                  value={formData.codigo || ''}
                  onChange={(e) => setFormData({ ...formData, codigo: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {errors.codigo && <span className="text-red-600 text-sm">{errors.codigo}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {errors.nome && <span className="text-red-600 text-sm">{errors.nome}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={formData.tipo || ''}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Selecione</option>
                  <option value="DESPESA">DESPESA</option>
                  <option value="RECEITA">RECEITA</option>
                </select>
                {errors.tipo && <span className="text-red-600 text-sm">{errors.tipo}</span>}
              </div>
            </>
          )}

          {type === 'subgrupo' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo *</label>
                <select
                  value={formData.grupo_id || ''}
                  onChange={(e) => setFormData({ ...formData, grupo_id: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Selecione um grupo</option>
                  {grupos.filter(g => g.ativo).map(g => (
                    <option key={g.id} value={g.id}>{g.codigo} - {g.nome}</option>
                  ))}
                </select>
                {errors.grupo_id && <span className="text-red-600 text-sm">{errors.grupo_id}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                <input
                  type="number"
                  value={formData.codigo || ''}
                  onChange={(e) => setFormData({ ...formData, codigo: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {errors.codigo && <span className="text-red-600 text-sm">{errors.codigo}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {errors.nome && <span className="text-red-600 text-sm">{errors.nome}</span>}
              </div>
            </>
          )}

          {type === 'classe' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subgrupo *</label>
                <select
                  value={formData.subgrupo_id || ''}
                  onChange={(e) => setFormData({ ...formData, subgrupo_id: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Selecione um subgrupo</option>
                  {subgrupos.filter(s => s.ativo).map(s => (
                    <option key={s.id} value={s.id}>{s.codigo} - {s.nome}</option>
                  ))}
                </select>
                {errors.subgrupo_id && <span className="text-red-600 text-sm">{errors.subgrupo_id}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                <input
                  type="text"
                  value={formData.codigo || ''}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {errors.codigo && <span className="text-red-600 text-sm">{errors.codigo}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {errors.descricao && <span className="text-red-600 text-sm">{errors.descricao}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave (separadas por vírgula)</label>
                <input
                  type="text"
                  value={formData.palavras_chave?.join(', ') || ''}
                  onChange={(e) => setFormData({ ...formData, palavras_chave: e.target.value.split(',').map(p => p.trim()) })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </>
          )}

          {type === 'formaPagamento' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Ex: Dinheiro, PIX, Cartão..."
                />
                {errors.nome && <span className="text-red-600 text-sm">{errors.nome}</span>}
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.ativo !== false}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Ativo</label>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
        </div>
      </div>
    </div>
  );
}
