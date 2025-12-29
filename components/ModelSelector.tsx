
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { OpenRouterModel } from '../types';

interface ModelSelectorProps {
  models: OpenRouterModel[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  isLoading: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onSelect, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredModels = useMemo(() => {
    return models.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [models, searchTerm]);

  const activeModelName = useMemo(() => {
    const model = models.find(m => m.id === selectedModel);
    return model ? model.name : selectedModel;
  }, [models, selectedModel]);

  if (isLoading) {
    return <div className="animate-pulse bg-zinc-800 h-8 w-32 rounded-lg"></div>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-xs font-medium transition-colors border border-zinc-700/50"
      >
        <span className="truncate max-w-[120px]">{activeModelName}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-2 border-b border-zinc-700 bg-zinc-900/50 sticky top-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {filteredModels.length === 0 ? (
                <div className="p-3 text-center text-zinc-500 text-xs italic">No models found</div>
              ) : (
                filteredModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelect(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors hover:bg-zinc-800 ${selectedModel === model.id ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-300'}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{model.name}</span>
                      <span className="text-[10px] text-zinc-500 truncate">{model.id}</span>
                    </div>
                    {selectedModel === model.id && <Check size={14} />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
