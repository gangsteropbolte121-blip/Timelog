import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Folder, Link as LinkIcon, Plus, ExternalLink, Search, Figma, Layout, Trash2, Edit2, Check } from 'lucide-react';
import { Project, ResourceCategory, ResourceLink } from '../types';

interface ProjectHubTabProps {
  projects: Project[];
  updateProject: (project: Project) => void;
  activeProjectId: string | null;
}

export const ProjectHubTab: React.FC<ProjectHubTabProps> = ({ projects, updateProject, activeProjectId }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || (projects.length > 0 ? projects[0].id : ''));
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'category' | 'link' | 'figma' | null;
    categoryId?: string;
  }>({ isOpen: false, type: null });
  const [inputValue1, setInputValue1] = useState('');
  const [inputValue2, setInputValue2] = useState('');
  
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editLinkName, setEditLinkName] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  
  const activeProject = projects.find(p => p.id === selectedProjectId);

  const getEmbedUrl = (shareUrl?: string) => {
    if (!shareUrl) return "";
    if (shareUrl.includes("figma.com/embed")) return shareUrl;
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(shareUrl)}`;
  };

  const handleUpdateFigmaUrl = (url: string) => {
    if (!activeProject) return;
    updateProject({ ...activeProject, figmaUrl: url });
  };

  const openCategoryModal = () => {
    setInputValue1('');
    setModalState({ isOpen: true, type: 'category' });
  };

  const openLinkModal = (categoryId: string) => {
    setInputValue1('');
    setInputValue2('');
    setModalState({ isOpen: true, type: 'link', categoryId });
  };

  const openFigmaModal = () => {
    setInputValue1(activeProject?.figmaUrl || '');
    setModalState({ isOpen: true, type: 'figma' });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null });
  };

  const handleModalSubmit = () => {
    if (!activeProject) return;

    if (modalState.type === 'category') {
      if (!inputValue1.trim()) return;
      const newCategory: ResourceCategory = {
        id: `cat_${Date.now()}`,
        name: inputValue1.trim(),
        links: []
      };
      updateProject({
        ...activeProject,
        resources: [...(activeProject.resources || []), newCategory]
      });
    } else if (modalState.type === 'link' && modalState.categoryId) {
      if (!inputValue1.trim() || !inputValue2.trim()) return;
      
      let url = inputValue2.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const newLink: ResourceLink = {
        id: `link_${Date.now()}`,
        name: inputValue1.trim(),
        url
      };
      const updatedResources = (activeProject.resources || []).map(cat => {
        if (cat.id === modalState.categoryId) {
          return { ...cat, links: [...cat.links, newLink] };
        }
        return cat;
      });
      updateProject({ ...activeProject, resources: updatedResources });
    } else if (modalState.type === 'figma') {
      handleUpdateFigmaUrl(inputValue1.trim());
    }

    closeModal();
  };

  const startEditingCategory = (category: ResourceCategory) => {
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
  };

  const saveEditCategory = (category: ResourceCategory) => {
    if (!editCategoryName.trim() || !activeProject) return;
    const updatedResources = (activeProject.resources || []).map(c => {
      if (c.id === category.id) {
        return { ...c, name: editCategoryName.trim() };
      }
      return c;
    });
    updateProject({ ...activeProject, resources: updatedResources });
    setEditingCategoryId(null);
  };

  const startEditingLink = (link: ResourceLink) => {
    setEditingLinkId(link.id);
    setEditLinkName(link.name);
    setEditLinkUrl(link.url);
  };

  const saveEditLink = (categoryId: string, linkId: string) => {
    if (!editLinkName.trim() || !editLinkUrl.trim() || !activeProject) return;
    
    let url = editLinkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const updatedResources = (activeProject.resources || []).map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          links: c.links.map(l => l.id === linkId ? { ...l, name: editLinkName.trim(), url } : l)
        };
      }
      return c;
    });
    updateProject({ ...activeProject, resources: updatedResources });
    setEditingLinkId(null);
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Layout className="text-gray-300 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Projects Found</h2>
        <p className="text-gray-500 max-w-sm">Add projects in the Settings menu to start using the Project Hub.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col md:flex-row h-[calc(100vh-12rem)] gap-4 pb-24"
    >
      {/* Left Sidebar: Asset Tree */}
      <div className="w-full md:w-1/3 flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 space-y-4">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeProject?.resources?.map(category => (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between group">
                <div className="flex items-center space-x-2 text-gray-900 font-semibold flex-1 mr-2">
                  <Folder size={16} className="text-indigo-500 shrink-0" />
                  {editingCategoryId === category.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={e => setEditCategoryName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEditCategory(category)}
                        className="p-1 text-emerald-600 hover:text-emerald-700"
                        title="Save"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className="truncate">{category.name}</span>
                  )}
                </div>
                <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center space-x-1 transition-opacity shrink-0">
                  <button 
                    onClick={() => openLinkModal(category.id)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                    title="Add Link"
                  >
                    <Plus size={16} />
                  </button>
                  {editingCategoryId !== category.id && (
                    <button 
                      onClick={() => startEditingCategory(category)}
                      className="p-1 text-gray-400 hover:text-indigo-600"
                      title="Edit Category"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if(window.confirm('Delete this category and all its links?')) {
                        updateProject({
                          ...activeProject,
                          resources: activeProject.resources?.filter(c => c.id !== category.id)
                        });
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete Category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="pl-6 space-y-1">
                {category.links.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())).map(link => (
                  <div key={link.id} className="flex items-center justify-between group/link py-1.5">
                    {editingLinkId === link.id ? (
                      <div className="flex-1 flex flex-col space-y-1 mr-2">
                        <input
                          type="text"
                          value={editLinkName}
                          onChange={e => setEditLinkName(e.target.value)}
                          placeholder="Link Name"
                          className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          autoFocus
                        />
                        <input
                          type="url"
                          value={editLinkUrl}
                          onChange={e => setEditLinkUrl(e.target.value)}
                          placeholder="URL"
                          className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    ) : (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-indigo-600 flex-1 min-w-0"
                      >
                        <LinkIcon size={14} className="text-gray-400 group-hover/link:text-indigo-500 shrink-0" />
                        <span className="truncate">{link.name}</span>
                        <ExternalLink size={12} className="opacity-0 group-hover/link:opacity-100 shrink-0" />
                      </a>
                    )}
                    
                    <div className="opacity-100 md:opacity-0 md:group-hover/link:opacity-100 flex items-center space-x-1 shrink-0 ml-2">
                      {editingLinkId === link.id ? (
                        <button
                          onClick={() => saveEditLink(category.id, link.id)}
                          className="p-1 text-emerald-600 hover:text-emerald-700"
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditingLink(link)}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                          title="Edit Link"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if(window.confirm('Delete this link?')) {
                            const updatedResources = activeProject.resources?.map(c => {
                              if (c.id === category.id) {
                                return { ...c, links: c.links.filter(l => l.id !== link.id) };
                              }
                              return c;
                            });
                            updateProject({ ...activeProject, resources: updatedResources });
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete Link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {category.links.length === 0 && (
                  <p className="text-xs text-gray-400 italic py-1">No links added</p>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={openCategoryModal}
            className="w-full py-3 flex items-center justify-center space-x-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Right Main: Figma Canvas */}
      <div className="w-full md:w-2/3 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <Figma size={20} className="text-[#F24E1E]" />
            <h3 className="font-semibold text-gray-900">Figma Canvas</h3>
          </div>
          <div className="flex items-center space-x-3">
            {activeProject?.figmaUrl && (
              <button
                onClick={() => {
                  const iframe = document.querySelector('iframe');
                  if (iframe && iframe.requestFullscreen) {
                    iframe.requestFullscreen();
                  }
                }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg"
              >
                Expand Canvas
              </button>
            )}
            <button
              onClick={openFigmaModal}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              {activeProject?.figmaUrl ? 'Update Link' : 'Add Figma Link'}
            </button>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-50 relative">
          {activeProject?.figmaUrl ? (
            <iframe
              src={getEmbedUrl(activeProject.figmaUrl)}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
              <Figma size={48} className="mb-4 opacity-50" />
              <p className="font-medium text-gray-900 mb-2">No Figma file linked</p>
              <p className="text-sm">Click "Add Figma Link" to embed your design canvas here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {modalState.isOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {modalState.type === 'category' && 'Add Category'}
                {modalState.type === 'link' && 'Add Link'}
                {modalState.type === 'figma' && 'Update Figma Link'}
              </h3>
              
              <div className="space-y-4">
                {modalState.type === 'figma' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Figma Share URL</label>
                    <input
                      type="text"
                      value={inputValue1}
                      onChange={(e) => setInputValue1(e.target.value)}
                      placeholder="https://www.figma.com/..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      autoFocus
                    />
                    <p className="text-xs text-amber-600 mt-2">
                      <strong>Important:</strong> Set your Figma file to "Anyone with the link can view" to prevent login loops in the embed.
                    </p>
                  </div>
                )}
                {modalState.type !== 'figma' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {modalState.type === 'category' && 'Category Name'}
                      {modalState.type === 'link' && 'Link Name'}
                    </label>
                    <input
                      type="text"
                      value={inputValue1}
                      onChange={(e) => setInputValue1(e.target.value)}
                      placeholder={
                        modalState.type === 'category' ? 'e.g., Design, Docs' :
                        'e.g., Project Brief'
                      }
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      autoFocus
                    />
                  </div>
                )}

                {modalState.type === 'link' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <input
                      type="text"
                      value={inputValue2}
                      onChange={(e) => setInputValue2(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </motion.div>
  );
};
