import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { X, Plus, Minus, Send, Link as LinkIcon, Loader2, BrainCircuit } from 'lucide-react';
import { ChatNode, LLMModel } from '../types';
import { ModelSelector } from '../../settings/components/ModelSelector';
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
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  models: LLMModel[];
  onDelete: (id: string) => void;
  onBranch: (id: string, direction: 'right' | 'bottom') => void;
  onSendMessage: (id: string, text: string) => void;
  onCompareMessage: (id: string, text: string, models: string[]) => void;
  onMergeDuel: (parentId: string) => void;
  canMerge: boolean;
  onUpdateModel: (id: string, model: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  isMobile: boolean;
  hasChildren: boolean;
  onResize: (id: string, width: number, height: number) => void;
  siblingCount?: number;
}

export const Node: React.FC<NodeProps> = ({
  node,
  models,
  onDelete,
  onBranch,
  onSendMessage,
  onCompareMessage,
  onMergeDuel,
  canMerge,
  onUpdateModel,
  onDragStart,
  isMobile,
  hasChildren,
  onResize,
  siblingCount = 0,
}) => {
  const [inputText, setInputText] = useState('');
  const [extraModels, setExtraModels] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (cardRef.current) {
      const { offsetWidth, offsetHeight } = cardRef.current;
      onResize(node.id, offsetWidth, offsetHeight);
    }
  }, [node.messages, node.isThinking, hasChildren]); // Re-measure when content changes

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [node.messages, node.isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || node.isThinking) return;
    if (extraModels.length > 0) {
      onCompareMessage(node.id, inputText, [node.model, ...extraModels]);
      setExtraModels([]);
    } else {
      onSendMessage(node.id, inputText);
    }
    setInputText('');
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        "absolute flex flex-col shadow-2xl border-primary/20 hover:border-primary/50 py-0 gap-0",
        siblingCount >= 3
          ? "w-80 md:w-[480px]"
          : extraModels.length >= 2
            ? "w-80 md:w-[680px]"
            : "w-80 md:w-[576px]"
      )}
      style={{
        left: node.x,
        top: node.y,
        zIndex: 10,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' // Slightly softer shadow than before
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b cursor-grab active:cursor-grabbing bg-muted/30 rounded-t-xl"
        onMouseDown={(e) => onDragStart(node.id, e)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-sm shrink-0" />
          <ModelSelector
            models={models}
            selectedModel={node.model}
            onSelect={(m) => onUpdateModel(node.id, m)}
            isLoading={models.length === 0}
            compact={extraModels.length >= 2}
          />
          {extraModels.map((m, i) => (
            <ModelSelector
              key={i}
              models={models}
              selectedModel={m}
              onSelect={(val) => setExtraModels(prev => prev.map((v, j) => j === i ? val : v))}
              isLoading={models.length === 0}
              compact={extraModels.length >= 2}
            />
          ))}
          {extraModels.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExtraModels(prev => prev.slice(0, -1))}
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              title="Remove last comparison model"
            >
              <Minus size={14} />
            </Button>
          )}
          {extraModels.length < 2 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExtraModels(prev => [...prev, models[0]?.id || 'google/gemini-pro'])}
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
              title="Add model to compare"
            >
              <Plus size={14} />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canMerge && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMergeDuel(node.id)}
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Merge & summarize duel responses"
            >
              <img src="/merge-arrow-icon.png" alt="Merge" className="h-4 w-4 dark:invert opacity-60" />
            </Button>
          )}
          {!hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(node.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Delete this node"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 max-h-72 overflow-y-auto p-4 space-y-4 text-sm bg-card/50"
      >
        {(() => {
          const visibleMessages = node.messages.slice(node.startIndex || 0);
          if (visibleMessages.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic py-8">
                <BrainCircuit size={32} className="mb-2 opacity-20" />
                <span>{node.startIndex ? 'Continue the conversation...' : 'Start a conversation...'}</span>
              </div>
            );
          }
          return visibleMessages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={cn(
                "max-w-[95%] px-3 py-2 rounded-xl text-sm shadow-sm",
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-none'
                  : 'bg-muted/50 border rounded-tl-none'
              )}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <ErrorBoundary>
                    <div className="prose prose-invert prose-xs max-w-none dark:prose-invert">
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
                                className="rounded-md !my-0"
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code {...props} className={cn("bg-muted px-1 py-0.5 rounded font-mono text-xs", className)}>
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
            <div className="bg-muted/50 px-3 py-2 rounded-xl rounded-tl-none border">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Branching Buttons */}
      {!isMobile && (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onBranch(node.id, 'right')}
            title="Branch from right"
            className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full shadow-md z-20 bg-background hover:bg-primary hover:text-primary-foreground border-primary/20"
          >
            <Plus size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onBranch(node.id, 'bottom')}
            title="Branch from bottom"
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full shadow-md z-20 bg-background hover:bg-primary hover:text-primary-foreground border-primary/20"
          >
            <Plus size={14} />
          </Button>
        </>
      )}

      {/* Input */}
      <div className="p-3 border-t bg-muted/30 rounded-b-xl">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled
            className="h-9 w-9 text-muted-foreground shrink-0"
            title="Attach file (Not implemented yet)"
          >
            <LinkIcon size={18} />
          </Button>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={node.isThinking}
            placeholder="Ask anything..."
            className="flex-1 bg-background"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputText.trim() || node.isThinking}
            className="h-9 w-9 shrink-0 shadow-sm"
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </Card>
  );
};
