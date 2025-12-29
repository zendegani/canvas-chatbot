import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Send, Link as LinkIcon, Loader2, BrainCircuit } from 'lucide-react';
import { ChatNode, OpenRouterModel } from '../types';
import { ModelSelector } from './ModelSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface NodeProps {
  node: ChatNode;
  models: OpenRouterModel[];
  onDelete: (id: string) => void;
  onBranch: (id: string) => void;
  onSendMessage: (id: string, text: string) => void;
  onUpdateModel: (id: string, model: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  isMobile: boolean;
}

export const Node: React.FC<NodeProps> = ({
  node,
  models,
  onDelete,
  onBranch,
  onSendMessage,
  onUpdateModel,
  onDragStart,
  isMobile
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [node.messages, node.isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || node.isThinking) return;
    onSendMessage(node.id, inputText);
    setInputText('');
  };

  return (
    <div
      className="absolute w-80 md:w-96 flex flex-col bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-2xl transition-all hover:border-zinc-500/50"
      style={{
        left: node.x,
        top: node.y,
        zIndex: 10,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-zinc-800 cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => onDragStart(node.id, e)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <ModelSelector
            models={models}
            selectedModel={node.model}
            onSelect={(m) => onUpdateModel(node.id, m)}
            isLoading={models.length === 0}
          />
        </div>
        <button
          onClick={() => onDelete(node.id)}
          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 max-h-72 overflow-y-auto p-4 space-y-4 text-sm"
      >
        {node.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 italic py-8">
            <BrainCircuit size={32} className="mb-2 opacity-20" />
            <span>Start a conversation...</span>
          </div>
        )}
        {node.messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[95%] px-3 py-2 rounded-xl ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700/50'
              }`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return match ? (
                        <SyntaxHighlighter
                          {...props}
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code {...props} className={className}>
                          {children}
                        </code>
                      )
                    }
                  }}
                  className="prose prose-invert prose-xs max-w-none"
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {node.isThinking && (
          <div className="flex items-start">
            <div className="bg-zinc-800/50 px-3 py-2 rounded-xl rounded-tl-none border border-zinc-700/30">
              <Loader2 size={16} className="animate-spin text-zinc-500" />
            </div>
          </div>
        )}
      </div>

      {/* Branching Buttons */}
      {!isMobile && (
        <>
          <button
            onClick={() => onBranch(node.id)}
            title="Branch from right"
            className="absolute -right-4 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 shadow-lg z-20"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onBranch(node.id)}
            title="Branch from bottom"
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 p-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 shadow-lg z-20"
          >
            <Plus size={14} />
          </button>
        </>
      )}

      {/* Input */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 rounded-b-2xl">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Attach file (Not implemented yet)"
          >
            <LinkIcon size={18} />
          </button>
          <input
            type="text"
            placeholder="Ask anything..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={node.isThinking}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || node.isThinking}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
