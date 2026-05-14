import React, { useRef, useState } from 'react';
import { MessageSquare, Plus, Sun, Moon } from 'lucide-react';
import { ChatNode, ChatSession, LLMModel } from '../types';
import { Node } from './Node';
import { ConnectionLine } from './ConnectionLine';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface CanvasProps {
    nodes: ChatNode[];
    models: LLMModel[];
    setNodes: React.Dispatch<React.SetStateAction<ChatNode[]>>;
    onAddInitialNode: () => void;
    onClearData: () => void;
    onLogout: () => void;
    onOpenSettings: () => void;
    onGoHome: () => void;
    handleBranch: (parentId: string, direction?: 'right' | 'bottom') => void;
    handleSendMessage: (nodeId: string, text: string) => void;
    handleCompareMessage: (nodeId: string, text: string, models: string[]) => void;
    handleMergeDuel: (parentId: string) => void;
    updateNodeSize: (id: string, width: number, height: number) => void;
    isMobile: boolean;
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    currentUser: string;
    sessions: Omit<ChatSession, 'nodes'>[];
    activeSessionId: string | null;
    onCreateSession: () => void;
    onLoadSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    hasTavilyKey: boolean;
    onToggleSearch: (id: string) => void;
    onStopMessage: (id: string) => void;
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
    handleCompareMessage,
    handleMergeDuel,
    updateNodeSize,
    isMobile,
    isDarkMode,
    setIsDarkMode,
    currentUser,
    sessions,
    activeSessionId,
    onCreateSession,
    onLoadSession,
    onDeleteSession,
    hasTavilyKey,
    onToggleSearch,
    onStopMessage,
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [draggedNode, setDraggedNode] = useState<{ id: string; startX: number; startY: number; mouseX: number; mouseY: number } | null>(null);
    const [resizingNode, setResizingNode] = useState<{ id: string; startW: number; startH: number; mouseX: number; mouseY: number } | null>(null);

    // Reset pan when switching sessions
    React.useEffect(() => {
        setPanOffset({ x: 0, y: 0 });
    }, [activeSessionId]);

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
        } else if (resizingNode) {
            const dx = e.clientX - resizingNode.mouseX;
            const dy = e.clientY - resizingNode.mouseY;
            const newW = Math.max(320, resizingNode.startW + dx);
            const newH = Math.max(200, resizingNode.startH + dy);
            setNodes(prev => prev.map(n =>
                n.id === resizingNode.id ? { ...n, width: newW, height: newH, userResized: true } : n
            ));
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
        setResizingNode(null);
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

    const handleNodeResizeStart = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const node = nodes.find(n => n.id === id);
        if (!node) return;
        setResizingNode({
            id,
            startW: node.width || NODE_WIDTH,
            startH: node.height || NODE_HEIGHT,
            mouseX: e.clientX,
            mouseY: e.clientY,
        });
    };

    const deleteNode = (id: string) => {
        setNodes(prev => prev.filter(n => n.id !== id));
    };

    return (
        <TooltipProvider>
            <SidebarProvider defaultOpen={true}>
                <AppSidebar
                    currentUser={currentUser}
                    onGoHome={onGoHome}
                    onOpenSettings={onOpenSettings}
                    onClearData={onClearData}
                    onLogout={onLogout}
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onCreateSession={onCreateSession}
                    onLoadSession={onLoadSession}
                    onDeleteSession={onDeleteSession}
                />
                <SidebarInset className="overflow-hidden h-screen">
                    <div className="h-full w-full overflow-hidden bg-background flex flex-col relative selection:bg-primary/20 text-foreground">
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

                                {(() => {
                                    const getConnectionPoints = (source: ChatNode, target: ChatNode) => {
                                        const sourceW = source.width || NODE_WIDTH;
                                        const sourceH = source.height || NODE_HEIGHT;
                                        const targetW = target.width || NODE_WIDTH;
                                        const targetH = target.height || NODE_HEIGHT;

                                        const anchors = {
                                            source: {
                                                right: { x: source.x + sourceW, y: source.y + sourceH / 2 },
                                                left: { x: source.x, y: source.y + sourceH / 2 },
                                                top: { x: source.x + sourceW / 2, y: source.y },
                                                bottom: { x: source.x + sourceW / 2, y: source.y + sourceH },
                                            },
                                            target: {
                                                right: { x: target.x + targetW, y: target.y + targetH / 2 },
                                                left: { x: target.x, y: target.y + targetH / 2 },
                                                top: { x: target.x + targetW / 2, y: target.y },
                                                bottom: { x: target.x + targetW / 2, y: target.y + targetH },
                                            }
                                        };

                                        if (target.y >= source.y + sourceH) {
                                            return {
                                                startX: anchors.source.bottom.x,
                                                startY: anchors.source.bottom.y,
                                                endX: anchors.target.top.x,
                                                endY: anchors.target.top.y,
                                                orientation: 'vertical' as const,
                                            };
                                        }

                                        let minDistance = Infinity;
                                        let bestConnection = {
                                            startX: 0, startY: 0, endX: 0, endY: 0, orientation: 'horizontal' as 'horizontal' | 'vertical'
                                        };

                                        const combinations = [
                                            { s: 'right', t: 'left', o: 'horizontal' },
                                            { s: 'left', t: 'right', o: 'horizontal' },
                                            { s: 'bottom', t: 'top', o: 'vertical' },
                                            { s: 'top', t: 'bottom', o: 'vertical' }
                                        ];

                                        for (const combo of combinations) {
                                            const start = anchors.source[combo.s as keyof typeof anchors.source];
                                            const end = anchors.target[combo.t as keyof typeof anchors.target];
                                            const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));

                                            if (dist < minDistance) {
                                                minDistance = dist;
                                                bestConnection = {
                                                    startX: start.x,
                                                    startY: start.y,
                                                    endX: end.x,
                                                    endY: end.y,
                                                    orientation: combo.o as 'horizontal' | 'vertical'
                                                };
                                            }
                                        }
                                        return bestConnection;
                                    };

                                    const lines: React.ReactNode[] = [];

                                    nodes.forEach(node => {
                                        // Merge nodes: draw lines from each merge parent
                                        if (node.mergeParentIds && node.mergeParentIds.length > 0) {
                                            node.mergeParentIds.forEach(mpId => {
                                                const mp = nodes.find(n => n.id === mpId);
                                                if (!mp) return;
                                                const pts = getConnectionPoints(mp, node);
                                                lines.push(
                                                    <ConnectionLine
                                                        key={`merge-${mpId}-${node.id}`}
                                                        startX={pts.startX}
                                                        startY={pts.startY}
                                                        endX={pts.endX}
                                                        endY={pts.endY}
                                                        orientation={pts.orientation}
                                                    />
                                                );
                                            });
                                            return;
                                        }

                                        // Regular parent connection
                                        if (!node.parentId) return;
                                        const parent = nodes.find(n => n.id === node.parentId);
                                        if (!parent) return;
                                        const pts = getConnectionPoints(parent, node);
                                        lines.push(
                                            <ConnectionLine
                                                key={`${parent.id}-${node.id}`}
                                                startX={pts.startX}
                                                startY={pts.startY}
                                                endX={pts.endX}
                                                endY={pts.endY}
                                                orientation={pts.orientation}
                                            />
                                        );
                                    });

                                    return lines;
                                })()}
                                {nodes.map(node => {
                                    const childNodes = nodes.filter(n => n.parentId === node.id);
                                    const hasChildren = childNodes.length > 0;
                                    const siblingCount = node.parentId
                                        ? nodes.filter(n => n.parentId === node.parentId).length
                                        : 0;
                                    // Show merge button if this node has 2+ children and none of them already have a merge child
                                    const hasMergeChild = nodes.some(n => n.mergeParentIds && n.mergeParentIds.some(id => childNodes.some(c => c.id === id)));
                                    const canMerge = childNodes.length >= 2 && !hasMergeChild;
                                    return (
                                        <div key={node.id} className="pointer-events-auto">
                                            <Node
                                                node={node}
                                                models={models}
                                                hasChildren={hasChildren}
                                                onDelete={deleteNode}
                                                onBranch={handleBranch}
                                                onSendMessage={handleSendMessage}
                                                onCompareMessage={handleCompareMessage}
                                                onMergeDuel={handleMergeDuel}
                                                canMerge={canMerge}
                                                onUpdateModel={(id, m) => setNodes(prev => prev.map(n => n.id === id ? { ...n, model: m } : n))}
                                                onDragStart={handleNodeDragStart}
                                                onResizeStart={handleNodeResizeStart}
                                                isMobile={isMobile}
                                                onResize={updateNodeSize}
                                                siblingCount={siblingCount}
                                                onToggleSearch={onToggleSearch}
                                                hasTavilyKey={hasTavilyKey}
                                                onStopMessage={onStopMessage}
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
                                    <SidebarTrigger className="-ml-1" />
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
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
};
