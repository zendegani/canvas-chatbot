import React, { useRef, useState } from 'react';
import { Sparkles, MessageSquare, Plus, Settings, Trash2, LogOut, Sun, Moon } from 'lucide-react';
import { ChatNode, OpenRouterModel } from '../types';
import { Node } from './Node';
import { ConnectionLine } from './ConnectionLine';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface CanvasProps {
    nodes: ChatNode[];
    models: OpenRouterModel[];
    setNodes: React.Dispatch<React.SetStateAction<ChatNode[]>>;
    onAddInitialNode: () => void;
    onClearData: () => void;
    onLogout: () => void;
    onOpenSettings: () => void;
    onGoHome: () => void;
    handleBranch: (parentId: string) => void;
    handleSendMessage: (nodeId: string, text: string) => void;
    isMobile: boolean;
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
}

const NODE_WIDTH = 576;
const NODE_HEIGHT = 400;

export const Canvas: React.FC<CanvasProps> = ({
    nodes,
    models,
    setNodes,
    onAddInitialNode,
    onClearData,
    onLogout,
    onOpenSettings,
    onGoHome,
    handleBranch,
    handleSendMessage,
    isMobile,
    isDarkMode,
    setIsDarkMode
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [draggedNode, setDraggedNode] = useState<{ id: string; startX: number; startY: number; mouseX: number; mouseY: number } | null>(null);

    const onMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0 && e.button !== 1) return;
        if (e.target === canvasRef.current) {
            setIsPanning(true);
        }
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPanOffset(prev => ({
                x: prev.x + e.movementX,
                y: prev.y + e.movementY
            }));
        } else if (draggedNode) {
            const dx = e.clientX - draggedNode.mouseX;
            const dy = e.clientY - draggedNode.mouseY;
            setNodes(prev => prev.map(n =>
                n.id === draggedNode.id
                    ? { ...n, x: draggedNode.startX + dx, y: draggedNode.startY + dy }
                    : n
            ));
        }
    };

    const onMouseUp = () => {
        setIsPanning(false);
        setDraggedNode(null);
    };

    const handleNodeDragStart = (id: string, e: React.MouseEvent) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;
        setDraggedNode({
            id,
            startX: node.x,
            startY: node.y,
            mouseX: e.clientX,
            mouseY: e.clientY
        });
    };

    const deleteNode = (id: string) => {
        setNodes(prev => prev.filter(n => n.id !== id));
    };

    return (
        <TooltipProvider>
            <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-background flex flex-col relative selection:bg-primary/20 text-foreground">
                <div
                    ref={canvasRef}
                    className="absolute inset-0 grid-bg cursor-grab active:cursor-grabbing select-none"
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                    style={{ backgroundPosition: `${panOffset.x}px ${panOffset.y}px` }}
                >
                    {/* Global Defs */}
                    <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
                        <defs>
                            <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#C15F3C" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#C15F3C" stopOpacity="0.6" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <div className="relative w-full h-full pointer-events-none" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
                        {nodes.map(node => {
                            if (!node.parentId) return null;
                            const parent = nodes.find(n => n.id === node.parentId);
                            if (!parent) return null;
                            return <ConnectionLine key={`${parent.id}-${node.id}`} startX={parent.x + NODE_WIDTH} startY={parent.y + NODE_HEIGHT / 4} endX={node.x} endY={node.y + NODE_HEIGHT / 4} />;
                        })}
                        {nodes.map(node => {
                            const hasChildren = nodes.some(n => n.parentId === node.id);
                            return (
                                <div key={node.id} className="pointer-events-auto">
                                    <Node
                                        node={node}
                                        models={models}
                                        hasChildren={hasChildren}
                                        onDelete={deleteNode}
                                        onBranch={handleBranch}
                                        onSendMessage={handleSendMessage}
                                        onUpdateModel={(id, m) => setNodes(prev => prev.map(n => n.id === id ? { ...n, model: m } : n))}
                                        onDragStart={handleNodeDragStart}
                                        isMobile={isMobile}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative z-50 pointer-events-none w-full h-full flex flex-col p-6">
                    {/* Toolbar */}
                    <div className="flex flex-row items-center justify-between w-full pointer-events-auto bg-card/80 backdrop-blur-md rounded-2xl p-2 px-4 shadow-sm border shrink-0">
                        <div className="flex items-center gap-4">
                            <div
                                className="flex items-center gap-2 font-bold cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={onGoHome}
                            >
                                <div className="p-1.5 bg-primary rounded-md shadow-sm">
                                    <Sparkles size={16} className="text-primary-foreground" />
                                </div>
                                <span className="hidden sm:inline">Canvas AI</span>
                            </div>
                            <Separator orientation="vertical" className="h-6" />
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{nodes.length}/10 Nodes</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsDarkMode(!isDarkMode)}
                                        className="rounded-xl h-9 w-9"
                                    >
                                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Switch to {isDarkMode ? 'light' : 'dark'} mode</TooltipContent>
                            </Tooltip>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onOpenSettings}
                                className="rounded-xl gap-2 font-semibold h-9"
                            >
                                <Settings size={18} /> <span className="hidden sm:inline">Settings</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearData}
                                className="rounded-xl gap-2 font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
                            >
                                <Trash2 size={18} /> <span className="hidden sm:inline">Clear</span>
                            </Button>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onLogout}
                                        className="rounded-xl h-9 w-9"
                                    >
                                        <LogOut size={18} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Logout</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Empty State */}
                    {nodes.length === 0 && (
                        <div className="flex-1 flex items-center justify-center pointer-events-none">
                            <Card className="p-12 text-center max-w-xl pointer-events-auto shadow-2xl scale-in border-border/60 bg-card/95 backdrop-blur">
                                <div className="p-5 bg-primary/10 inline-block rounded-3xl mb-8 animate-bounce text-primary">
                                    <MessageSquare size={40} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 tracking-tight">Your canvas is empty</h3>
                                <p className="text-muted-foreground mb-10 font-medium">Create a root node to start your first orchestration.</p>
                                <Button
                                    onClick={onAddInitialNode}
                                    size="lg"
                                    className="w-full text-lg font-bold h-14 rounded-xl shadow-lg shadow-primary/20"
                                >
                                    Create Node
                                </Button>
                            </Card>
                        </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="mt-auto flex justify-between items-end pointer-events-auto">
                        <Card className="px-4 py-3 bg-background/80 backdrop-blur-md border rounded-2xl shadow-sm flex items-center gap-4">
                            <div className="flex gap-3 text-xs font-bold text-muted-foreground">
                                <span className="px-2 py-1 bg-muted/50 rounded-md border border-border/50">Drag headers to Move</span>
                                <span className="px-2 py-1 bg-muted/50 rounded-md border border-border/50">Snap Branches with +</span>
                            </div>
                        </Card>
                        {!isMobile && (
                            <Button
                                onClick={onAddInitialNode}
                                size="icon"
                                className="h-14 w-14 rounded-full shadow-2xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
                            >
                                <Plus size={28} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};
