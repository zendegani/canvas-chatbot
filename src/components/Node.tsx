import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Send, Link as LinkIcon, Loader2, BrainCircuit } from 'lucide-react';
import { ChatNode, OpenRouterModel } from '../types';
import { ModelSelector } from './ModelSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { ErrorBoundary } from './ErrorBoundary';

SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('css', css);

interface NodeProps {
  node: ChatNode;
  models: OpenRouterModel[];
  onDelete: (id: string) => void;
  onBranch: (id: string) => void;
  onSendMessage: (id: string, text: string) => void;
  onUpdateModel: (id: string, model: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  isMobile: boolean;
  hasChildren: boolean;
}

export const Node: React.FC<NodeProps> = ({
  node,
  models,
  onDelete,
  onBranch,
  onSendMessage,
  onUpdateModel,
  onDragStart,
  isMobile,
  hasChildren
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
      className="absolute w-80 md:w-96 flex flex-col bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-primary)] rounded-2xl shadow-2xl transition-all hover:border-claude-accent/50 text-[var(--text-primary)]"
      style={{
        left: node.x,
        top: node.y,
        zIndex: 10,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-[var(--border-primary)] cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => onDragStart(node.id, e)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-claude-accent animate-pulse" />
          <ModelSelector
            models={models}
            selectedModel={node.model}
            onSelect={(m) => onUpdateModel(node.id, m)}
            isLoading={models.length === 0}
          />
        </div>
        {!hasChildren && (
          <button
            onClick={() => onDelete(node.id)}
            className="p-1.5 hover:bg-[var(--bg-primary)] rounded-lg text-[var(--text-secondary)] hover:text-red-500 transition-colors"
            title="Delete this node"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 max-h-72 overflow-y-auto p-4 space-y-4 text-sm"
      >
        {(() => {
          const visibleMessages = node.messages.slice(node.startIndex || 0);
          if (visibleMessages.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 italic py-8">
                <BrainCircuit size={32} className="mb-2 opacity-20" />
                <span>{node.startIndex ? 'Continue the conversation...' : 'Start a conversation...'}</span>
              </div>
            );
          }
          return visibleMessages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[95%] px-3 py-2 rounded-xl ${msg.role === 'user'
                ? 'bg-claude-accent text-white rounded-tr-none'
                : 'bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border-primary)]'
                }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <ErrorBoundary>
                    <div className="prose prose-invert prose-xs max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code({ node, className, children, style, ref, ...props }) {
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
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </ErrorBoundary>
                )}
              </div>
            </div>
          ));
        })()}
        {node.isThinking && (
          <div className="flex items-start">
            <div className="bg-[var(--bg-primary)] px-3 py-2 rounded-xl rounded-tl-none border border-[var(--border-primary)]">
              <Loader2 size={16} className="animate-spin text-[var(--text-secondary)]" />
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
      <div className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/30 rounded-b-2xl">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
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
            className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-claude-accent/50 disabled:opacity-50 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || node.isThinking}
            className="p-2 bg-claude-accent hover:opacity-90 text-white rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:hover:bg-claude-accent"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
