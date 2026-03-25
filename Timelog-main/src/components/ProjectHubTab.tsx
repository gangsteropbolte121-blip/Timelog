import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Folder, Link as LinkIcon, Plus, ExternalLink, Search, Figma, Layout, Trash2, Edit2, Check, ChevronDown } from 'lucide-react';
import { Project, ResourceCategory, ResourceLink } from '../types';

interface ProjectHubTabProps {
  projects: Project[];
  updateProject: (project: Project) => void;
  activeProjectId: string | null;
}

export const ProjectHubTab: React.FC<ProjectHubTabProps> = ({ projects, updateProject, activeProjectId }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || (projects.length > 0 ? projects[0].id : ''));
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'category' | 'link' | 'figma' | null; categoryId?: string }>({ isOpen: false, type: null });
  const [inputValue1, setInputValue1] = useState('');
  const [inputValue2, setInputValue2] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editLinkName, setEditLinkName] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const getEmbedUrl = (shareUrl?: string) => {
    if (!shareUrl) return '';
    if (shareUrl.includes('figma.com/embed')) return shareUrl;
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(shareUrl)}`;
  };

  const openCategoryModal = () => { setInputValue1(''); setModalState({ isOpen: true, type: 'category' }); };
  const openLinkModal = (categoryId: string) => { setInputValue1(''); setInputValue2(''); setModalState({ isOpen: true, type: 'link', categoryId }); };
  const openFigmaModal = () => { setInputValue1(activeProject?.figmaUrl || ''); setModalState({ isOpen: true, type: 'figma' }); };
  const closeModal = () => setModalState({ isOpen: false, type: null });

  const handleModalSubmit = () => {
    if (!activeProject) return;
    if (modalState.type === 'category') {
      if (!inputValue1.trim()) return;
      updateProject({ ...activeProject, resources: [...(activeProject.resources || []), { id: `cat_${Date.now()}`, name: inputValue1.trim(), links: [] }] });
    } else if (modalState.type === 'link' && modalState.categoryId) {
      if (!inputValue1.trim() || !inputValue2.trim()) return;
      let url = inputValue2.trim();
      if (!url.startsWith('http')) url = 'https://' + url;
      const updatedResources = (activeProject.resources || []).map(cat =>
        cat.id === modalState.categoryId ? { ...cat, links: [...cat.links, { id: `link_${Date.now()}`, name: inputValue1.trim(), url }] } : cat
      );
      updateProject({ ...activeProject, resources: updatedResources });
    } else if (modalState.type === 'figma') {
      updateProject({ ...activeProject, figmaUrl: inputValue1.trim() });
    }
    closeModal();
  };

  const saveEditCategory = (category: ResourceCategory) => {
    if (!editCategoryName.trim() || !activeProject) return;
    updateProject({ ...activeProject, resources: (activeProject.resources || []).map(c => c.id === category.id ? { ...c, name: editCategoryName.trim() } : c) });
    setEditingCategoryId(null);
  };

  const saveEditLink = (categoryId: string, linkId: string) => {
    if (!editLinkName.trim() || !editLinkUrl.trim() || !activeProject) return;
    let url = editLinkUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    updateProject({
      ...activeProject,
      resources: (activeProject.resources || []).map(c =>
        c.id === categoryId ? { ...c, links: c.links.map(l => l.id === linkId ? { ...l, name: editLinkName.trim(), url } : l) } : c
      )
    });
    setEditingLinkId(null);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--color-surface-low)' }}>
          <Layout size={28} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>No Projects Yet</h2>
        <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>Add projects in Settings to start using the Project Hub.</p>
      </div>
    );
  }

  const renderCategories = () => {
    if (!activeProject?.resources?.length) {
      return (
        <div className="text-center py-8">
          <Folder size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No categories yet. Add one below.</p>
        </div>
      );
    }

    return activeProject.resources.map(category => {
      const isExpanded = expandedCategories.has(category.id);
      const filteredLinks = category.links.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return (
        <div key={category.id} className="space-y-1">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-1 flex-1 min-w-0 mr-2">
              <button onClick={() => toggleCategory(category.id)} className="p-0.5 hover:bg-[var(--color-surface-low)] rounded transition-colors">
                <ChevronDown size={12} style={{ color: 'var(--color-text-muted)', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
              </button>
              <Folder size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              {editingCategoryId === category.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    autoFocus value={editCategoryName} onChange={e => setEditCategoryName(e.target.value)}
                    className="flex-1 px-2 py-1 rounded text-xs focus:outline-none"
                    style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                  <button onClick={() => saveEditCategory(category)} style={{ color: 'var(--color-success)' }}><Check size={13} /></button>
                </div>
              ) : (
                <span className="text-xs font-bold uppercase tracking-wider truncate" style={{ color: 'var(--color-text-secondary)' }}>{category.name}</span>
              )}
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>({category.links.length})</span>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => openLinkModal(category.id)} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }} title="Add Link"><Plus size={12} /></button>
              {editingCategoryId !== category.id && (
                <button onClick={() => { setEditingCategoryId(category.id); setEditCategoryName(category.name); }} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }}><Edit2 size={12} /></button>
              )}
              <button onClick={() => { if (window.confirm('Delete this category?')) updateProject({ ...activeProject!, resources: activeProject!.resources?.filter(c => c.id !== category.id) }); }} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }}><Trash2 size={12} /></button>
            </div>
          </div>

          {isExpanded && (
            <div className="pl-4 relative">
              <div className="absolute left-2 top-0 bottom-0 w-px" style={{ background: 'var(--color-border-solid)' }} />
              <div className="space-y-0.5">
                {filteredLinks.map(link => (
                  <div key={link.id} className="flex items-center justify-between group/link py-1 px-2 rounded-lg hover:bg-[var(--color-surface-low)] transition-colors">
                    {editingLinkId === link.id ? (
                      <div className="flex-1 flex flex-col gap-1 mr-2">
                        <input value={editLinkName} onChange={e => setEditLinkName(e.target.value)} className="w-full px-2 py-1 rounded text-xs focus:outline-none" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                        <input value={editLinkUrl} onChange={e => setEditLinkUrl(e.target.value)} className="w-full px-2 py-1 rounded text-xs focus:outline-none" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                      </div>
                    ) : (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 min-w-0 text-xs hover:underline underline-offset-2" style={{ color: 'var(--color-text-secondary)' }}>
                        <LinkIcon size={11} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                        <span className="truncate">{link.name}</span>
                        <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-60 shrink-0" />
                      </a>
                    )}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0 ml-1">
                      {editingLinkId === link.id ? (
                        <button onClick={() => saveEditLink(category.id, link.id)} style={{ color: 'var(--color-success)' }}><Check size={11} /></button>
                      ) : (
                        <button onClick={() => { setEditingLinkId(link.id); setEditLinkName(link.name); setEditLinkUrl(link.url); }} style={{ color: 'var(--color-text-muted)' }}><Edit2 size={11} /></button>
                      )}
                      <button onClick={() => { if (window.confirm('Delete this link?')) updateProject({ ...activeProject!, resources: activeProject!.resources?.map(c => c.id === category.id ? { ...c, links: c.links.filter(l => l.id !== link.id) } : c) }); }} style={{ color: 'var(--color-text-muted)' }}><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
                {filteredLinks.length === 0 && <p className="text-xs italic pl-4" style={{ color: 'var(--color-text-muted)' }}>No links found</p>}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-24">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>Project Hub</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Resources, links, and design assets.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-16rem)]">

        {/* LEFT: Resource tree */}
        <div className="w-full md:w-72 flex flex-col tl-card overflow-hidden shrink-0">

          {/* Project selector + search */}
          <div className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl text-sm font-semibold appearance-none tl-select focus:outline-none"
                style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search links…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              />
            </div>
          </div>

          {/* Category tree */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {renderCategories()}

            <button onClick={openCategoryModal} className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl transition-all" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
              <Plus size={14} /> Add Category
            </button>
          </div>
        </div>

        {/* RIGHT: Figma canvas or resource summary */}
        <div className="flex-1 tl-card flex flex-col overflow-hidden min-h-[400px]">
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-low)' }}>
            <div className="flex items-center gap-2">
              <Figma size={18} className="text-[#F24E1E]" />
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Figma Canvas</span>
            </div>
            <button onClick={openFigmaModal} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all" style={{ color: 'var(--color-accent)', background: 'var(--color-accent-muted)' }}>
              {activeProject?.figmaUrl ? 'Update Link' : 'Add Figma Link'}
            </button>
          </div>

          <div className="flex-1 relative" style={{ background: 'var(--color-surface-low)' }}>
            {activeProject?.figmaUrl ? (
              <iframe src={getEmbedUrl(activeProject.figmaUrl)} className="absolute inset-0 w-full h-full border-0" allowFullScreen />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--color-surface)' }}>
                  <Figma size={28} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>No Figma file linked</p>
                <p className="text-xs max-w-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Paste a Figma share link to embed your design canvas here. Make sure the file is set to "Anyone with the link can view".
                </p>
                <motion.button 
                  onClick={openFigmaModal} 
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg tl-btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Add Figma Link
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalState.isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm p-6" style={{ background: 'var(--color-surface)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              {modalState.type === 'category' ? 'Add Category' : modalState.type === 'link' ? 'Add Link' : 'Update Figma Link'}
            </h3>
            <div className="space-y-3">
              {modalState.type === 'figma' ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Figma Share URL</label>
                  <input type="text" value={inputValue1} onChange={e => setInputValue1(e.target.value)} placeholder="https://www.figma.com/..." autoFocus className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--color-warn)' }}>File must be set to "Anyone with link can view"</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>{modalState.type === 'category' ? 'Name' : 'Link Name'}</label>
                    <input type="text" value={inputValue1} onChange={e => setInputValue1(e.target.value)} placeholder={modalState.type === 'category' ? 'e.g., Design, Docs' : 'e.g., Project Brief'} autoFocus className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                  </div>
                  {modalState.type === 'link' && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>URL</label>
                      <input type="url" value={inputValue2} onChange={e => setInputValue2(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)' }}>Cancel</button>
              <button onClick={handleModalSubmit} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white tl-btn-primary">Save</button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </motion.div>
  );
};
