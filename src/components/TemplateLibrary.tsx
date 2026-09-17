import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Check, 
  Copy, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  Search, 
  ChevronRight, 
  ChevronDown,
  Info,
  Sliders
} from 'lucide-react';
import { SearchTemplate } from '../types';
import { DEFAULT_SEARCH_TEMPLATES } from '../data/searchTemplates';

interface TemplateLibraryProps {
  templates: SearchTemplate[];
  activeTemplateId: string | null;
  onSelectTemplate: (templateId: string | null) => void;
  onSaveTemplates: (templates: SearchTemplate[]) => void;
  uiLang: string;
  theme?: 'dark' | 'light';
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates,
  activeTemplateId,
  onSelectTemplate,
  onSaveTemplates,
  uiLang,
  theme = 'dark'
}) => {
  const isZh = uiLang === 'zh' || uiLang === 'mix';
  const isLight = theme === 'light';

  const [searchKw, setSearchKw] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // Edit / Create Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('自定义');
  const [formDescription, setFormDescription] = useState('');
  const [formFramework, setFormFramework] = useState('');
  const [formConstraintPrompt, setFormConstraintPrompt] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formError, setFormError] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return ['all', ...Array.from(set)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
      if (!matchCat) return false;
      if (!searchKw.trim()) return true;
      const kw = searchKw.toLowerCase().trim();
      return (
        t.name.toLowerCase().includes(kw) ||
        t.description.toLowerCase().includes(kw) ||
        t.framework.toLowerCase().includes(kw) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(kw)))
      );
    });
  }, [templates, selectedCategory, searchKw]);

  const openCreateForm = () => {
    setEditingTemplateId(null);
    setFormName('');
    setFormCategory('自定义');
    setFormDescription('');
    setFormFramework('(核心主题) AND (限制约束) AND (限定字段)');
    setFormConstraintPrompt('要求将检索意图清晰解构为核心主题与限制条件，内部使用 OR 展开同义词，各要素间强制使用 AND 组配。');
    setFormTags('自定义, 框架');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (t: SearchTemplate) => {
    setEditingTemplateId(t.id);
    setFormName(t.name);
    setFormCategory(t.category || '自定义');
    setFormDescription(t.description || '');
    setFormFramework(t.framework || '');
    setFormConstraintPrompt(t.constraintPrompt || '');
    setFormTags(t.tags ? t.tags.join(', ') : '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleDuplicate = (t: SearchTemplate) => {
    const newTemplate: SearchTemplate = {
      ...t,
      id: `custom-${Date.now()}`,
      name: `${t.name} (${isZh ? '副本' : 'Copy'})`,
      isPreset: false,
      category: t.category || '自定义'
    };
    const updated = [newTemplate, ...templates];
    onSaveTemplates(updated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(isZh ? '确定要删除该检索式模板吗？' : 'Are you sure you want to delete this search template?')) {
      const updated = templates.filter(t => t.id !== id);
      onSaveTemplates(updated);
      if (activeTemplateId === id) {
        onSelectTemplate(null);
      }
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError(isZh ? '请输入模板名称' : 'Please provide a template name');
      return;
    }
    if (!formFramework.trim()) {
      setFormError(isZh ? '请输入检索式框架结构' : 'Please provide a framework structure');
      return;
    }
    if (!formConstraintPrompt.trim()) {
      setFormError(isZh ? '请输入大模型约束提示词' : 'Please provide LLM constraint instructions');
      return;
    }

    const tagsArray = formTags
      .split(/[,，]/)
      .map(s => s.trim())
      .filter(Boolean);

    if (editingTemplateId) {
      // Update existing
      const updated = templates.map(t => {
        if (t.id === editingTemplateId) {
          return {
            ...t,
            name: formName.trim(),
            category: formCategory.trim(),
            description: formDescription.trim(),
            framework: formFramework.trim(),
            constraintPrompt: formConstraintPrompt.trim(),
            tags: tagsArray
          };
        }
        return t;
      });
      onSaveTemplates(updated);
    } else {
      // Create new
      const newTemplate: SearchTemplate = {
        id: `template-${Date.now()}`,
        name: formName.trim(),
        category: formCategory.trim() || '自定义',
        description: formDescription.trim(),
        framework: formFramework.trim(),
        constraintPrompt: formConstraintPrompt.trim(),
        isPreset: false,
        tags: tagsArray
      };
      onSaveTemplates([newTemplate, ...templates]);
      onSelectTemplate(newTemplate.id);
    }

    setIsFormOpen(false);
  };

  const handleResetPresets = () => {
    if (window.confirm(isZh ? '确定要恢复全部系统默认预设模板吗？（自定义创建的模板将予以保留）' : 'Restore all system default templates? (Custom templates will be preserved)')) {
      const customTemplates = templates.filter(t => !t.isPreset && !DEFAULT_SEARCH_TEMPLATES.some(dp => dp.id === t.id));
      const merged = [...DEFAULT_SEARCH_TEMPLATES, ...customTemplates];
      onSaveTemplates(merged);
    }
  };

  const activeTemplate = templates.find(t => t.id === activeTemplateId);

  return (
    <div className="flex flex-col gap-5">
      {/* Overview & Information Card */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isLight 
          ? 'bg-blue-50/80 border-blue-200 text-slate-800' 
          : 'bg-cyan-950/30 border-cyan-500/20 text-cyan-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-cyan-500/20 text-cyan-300'}`}>
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold tracking-wider uppercase">
                {isZh ? '检索式模板库 (Boolean Frameworks)' : 'Search Formula Template Library'}
              </h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                isLight ? 'bg-blue-200/70 text-blue-800' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                {templates.length} {isZh ? '个框架' : 'templates'}
              </span>
            </div>
            <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isZh
                ? '预设或自定义学术检索的布尔逻辑分面（如“主题 + 限制 + 字段”或“PICO”）。激活后将在生成时作为全局上下文约束注入大模型提示词，指导逻辑严格组配。'
                : 'Define standard Boolean logic frameworks (e.g., Topic + Constraint + Field or PICO). The active framework is passed as an architectural constraint to the LLM during generation.'
              }
            </p>
          </div>
        </div>

        {/* Global Active Status Banner */}
        <div className={`px-3 py-2 rounded-xl border shrink-0 text-right self-stretch sm:self-auto flex flex-col justify-center ${
          activeTemplate 
            ? (isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300')
            : (isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-white/5 text-slate-400')
        }`}>
          <div className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 justify-end">
            <span className={`w-2 h-2 rounded-full ${activeTemplate ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            {isZh ? '当前生效约束' : 'Current Active Constraint'}:
          </div>
          <div className="text-xs font-bold truncate max-w-[220px]">
            {activeTemplate ? activeTemplate.name : (isZh ? '标准智能组配 (无特定模板)' : 'Standard / Default')}
          </div>
          {activeTemplate && (
            <button
              type="button"
              onClick={() => onSelectTemplate(null)}
              className="text-[10px] text-cyan-400 hover:underline mt-0.5 text-right cursor-pointer"
            >
              {isZh ? '取消指定 (恢复默认)' : 'Clear (Use Default)'}
            </button>
          )}
        </div>
      </div>

      {/* Action Bar & Search / Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-1 ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-black/40 border-white/10 text-cyan-100'
          }`}>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchKw}
              onChange={e => setSearchKw(e.target.value)}
              placeholder={isZh ? '搜索模板名称、框架、关键词...' : 'Search templates by keyword...'}
              className="w-full bg-transparent text-xs focus:outline-none placeholder:text-slate-500 font-sans"
            />
            {searchKw && (
              <button 
                onClick={() => setSearchKw('')} 
                className="text-slate-400 hover:text-slate-200 text-xs px-1"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? (isLight ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm')
                    : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' : 'bg-slate-800/40 text-slate-400 border-white/5 hover:bg-white/5')
                }`}
              >
                {cat === 'all' ? (isZh ? '全部' : 'All') : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateForm}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            <Plus size={14} />
            <span>{isZh ? '新建模板' : 'New Template'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetPresets}
            title={isZh ? '恢复系统默认模板' : 'Restore Default Presets'}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' : 'bg-slate-800/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="flex flex-col gap-3.5 pr-1">
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <BookOpen size={36} className="mb-2 opacity-40" />
            <p className="text-xs uppercase tracking-wider font-mono">
              {isZh ? '未找到符合条件的检索式模板' : 'No matching templates found'}
            </p>
          </div>
        ) : (
          filteredTemplates.map(item => {
            const isActive = item.id === activeTemplateId;
            const isExpanded = expandedTemplateId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all relative ${
                  isActive
                    ? (isLight 
                        ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-300 shadow-md' 
                        : 'bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30')
                    : (isLight 
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm' 
                        : 'bg-black/30 border-white/5 hover:border-white/10 hover:bg-white/[0.02]')
                }`}
              >
                {/* Top Row: Title, Category, Badges, Action Buttons */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h5 className={`text-sm font-bold tracking-tight ${
                        isLight ? 'text-slate-900' : 'text-slate-100'
                      }`}>
                        {item.name}
                      </h5>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        item.isPreset
                          ? (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20')
                          : (isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/10 text-purple-300 border border-purple-500/20')
                      }`}>
                        {item.category || (item.isPreset ? (isZh ? '系统预设' : 'Preset') : (isZh ? '自定义' : 'Custom'))}
                      </span>

                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Check size={12} />
                          {isZh ? '当前生效' : 'Active'}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs line-clamp-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {item.description}
                    </p>
                  </div>

                  {/* Top Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectTemplate(isActive ? null : item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : (isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:border-cyan-500/30')
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check size={12} />
                          <span>{isZh ? '已激活' : 'Active'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} className="text-cyan-400" />
                          <span>{isZh ? '设为当前' : 'Set Active'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(item)}
                      title={isZh ? '复制此模板' : 'Duplicate template'}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5'
                      }`}
                    >
                      <Copy size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      title={isZh ? '编辑' : 'Edit'}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5'
                      }`}
                    >
                      <Edit3 size={13} />
                    </button>

                    {!item.isPreset && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        title={isZh ? '删除' : 'Delete'}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer text-rose-400 hover:bg-rose-500/10 border-rose-500/20`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Framework Visual Box */}
                <div className={`mt-3 p-2.5 rounded-lg font-mono text-xs border ${
                  isLight 
                    ? 'bg-slate-100 border-slate-200 text-slate-800' 
                    : 'bg-black/50 border-white/5 text-cyan-300/90'
                }`}>
                  <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Sliders size={11} className="text-cyan-400" />
                    <span>{isZh ? '框架逻辑结构 (Framework Formula)' : 'Formula Framework'}:</span>
                  </div>
                  <div className="break-all select-all font-semibold">
                    {item.framework}
                  </div>
                </div>

                {/* Collapsible Prompt Constraint Details */}
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => setExpandedTemplateId(isExpanded ? null : item.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span>{isZh ? '查看大模型约束指令 (LLM Prompt Directive)' : 'View LLM Directive'}</span>
                  </button>

                  {isExpanded && (
                    <div className={`mt-2 p-3 rounded-lg text-xs leading-relaxed border font-mono whitespace-pre-wrap ${
                      isLight 
                        ? 'bg-amber-50/70 border-amber-200 text-amber-950' 
                        : 'bg-slate-900/90 border-cyan-500/20 text-slate-300'
                    }`}>
                      <div className="text-[10px] text-amber-500 font-bold mb-1 flex items-center gap-1">
                        <Info size={12} />
                        {isZh ? '生成时将注入以下上下文约束：' : 'Injected context constraint during LLM generation:'}
                      </div>
                      {item.constraintPrompt}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {item.tags.map(tag => (
                      <span 
                        key={tag} 
                        className={`text-[9px] px-2 py-0.5 rounded-full font-mono ${
                          isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/5 text-slate-400 border border-white/5'
                        }`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dialog for Create/Edit Template */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <h4 className="text-base font-bold flex items-center gap-2">
                <Layers size={18} className="text-cyan-400" />
                {editingTemplateId 
                  ? (isZh ? '编辑检索式模板' : 'Edit Search Template')
                  : (isZh ? '新建自定义检索式模板' : 'New Search Template')
                }
              </h4>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-base"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveForm} className="flex flex-col gap-3.5 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {isZh ? '模板名称 *' : 'Template Name *'}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder={isZh ? '例如：主题 + 限制 + 字段' : 'e.g. Topic + Constraint + Field'}
                  className={`w-full px-3 py-2 text-xs rounded-lg border font-sans focus:outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-900' 
                      : 'bg-black/50 border-white/10 focus:border-cyan-500 text-white'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    {isZh ? '分类类别' : 'Category'}
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    placeholder={isZh ? '例如：通用学术 / 循证医学 / 自定义' : 'e.g., General / Medical / Custom'}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-sans focus:outline-none ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-900' 
                        : 'bg-black/50 border-white/10 focus:border-cyan-500 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    {isZh ? '标签 (逗号分隔)' : 'Tags (Comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    placeholder={isZh ? '例如：分面, 精确, 查新' : 'e.g. facets, precision, patents'}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-sans focus:outline-none ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-900' 
                        : 'bg-black/50 border-white/10 focus:border-cyan-500 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {isZh ? '适用场景与描述' : 'Description & Use Case'}
                </label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder={isZh ? '简要说明该模板在何种学术研究或查新场景下使用...' : 'Describe when and why to use this template...'}
                  className={`w-full px-3 py-2 text-xs rounded-lg border font-sans focus:outline-none resize-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-900' 
                      : 'bg-black/50 border-white/10 focus:border-cyan-500 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {isZh ? '布尔检索式框架示意 (Framework Structure) *' : 'Boolean Framework Structure *'}
                </label>
                <input
                  type="text"
                  value={formFramework}
                  onChange={e => setFormFramework(e.target.value)}
                  placeholder={isZh ? '例如：(核心主题 OR 同义词) AND (限制约束) AND (限定字段代码)' : 'e.g., (Topic) AND (Constraint) AND (Field)'}
                  className={`w-full px-3 py-2 text-xs rounded-lg border font-mono focus:outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-900' 
                      : 'bg-black/50 border-white/10 focus:border-cyan-500 text-cyan-300'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {isZh ? '传递给大模型的约束指令 (Constraint Prompt for LLM) *' : 'LLM Constraint Prompt *'}
                </label>
                <textarea
                  value={formConstraintPrompt}
                  onChange={e => setFormConstraintPrompt(e.target.value)}
                  rows={4}
                  placeholder={isZh ? '指导大模型如何将用户的自然语言需求拆分为具体的逻辑要素，要素内部如何扩展，要素之间如何使用 AND/OR/NOT 进行严密组配...' : 'Provide precise directives to guide how the LLM extracts concepts and groups Boolean facets...'}
                  className={`w-full px-3 py-2 text-xs rounded-lg border font-mono focus:outline-none leading-relaxed ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-900' 
                      : 'bg-black/50 border-white/10 focus:border-cyan-500 text-white'
                  }`}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  {isZh ? '保存模板' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
