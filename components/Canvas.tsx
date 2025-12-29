
import React, { useRef, useState } from 'react';
import { Sparkles, MessageSquare, Plus, Settings, Trash2, LogOut } from 'lucide-react';
import { ChatNode, OpenRouterModel } from '../types';
import { Node } from './Node';
import { ConnectionLine } from './ConnectionLine';

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
}

const NODE_WIDTH = 384;
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
    isMobile
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
        <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col relative selection:bg-blue-500/30">
            <div
                ref={canvasRef}
                className="absolute inset-0 grid-bg cursor-grab active:cursor-grabbing select-none"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                style={{ backgroundPosition: `${panOffset.x}px ${panOffset.y}px` }}
            >
                <div className="relative w-full h-full pointer-events-none" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
                    {nodes.map(node => {
                        if (!node.parentId) return null;
                        const parent = nodes.find(n => n.id === node.parentId);
                        if (!parent) return null;
                        return <ConnectionLine key={`${parent.id}-${node.id}`} startX={parent.x + NODE_WIDTH} startY={parent.y + NODE_HEIGHT / 4} endX={node.x} endY={node.y + NODE_HEIGHT / 4} />;
                    })}
                    {nodes.map(node => (
                        <div key={node.id} className="pointer-events-auto">
                            <Node
                                node={node}
                                models={models}
                                onDelete={deleteNode}
                                onBranch={handleBranch}
                                onSendMessage={handleSendMessage}
                                onUpdateModel={(id, m) => setNodes(prev => prev.map(n => n.id === id ? { ...n, model: m } : n))}
                                onDragStart={handleNodeDragStart}
                                isMobile={isMobile}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative z-50 pointer-events-none w-full h-full flex flex-col p-6">
                <div className="flex items-center justify-between w-full pointer-events-auto bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-3 px-5 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 font-bold cursor-pointer" onClick={onGoHome}>
                            <div className="p-1 bg-blue-600 rounded-md"><Sparkles size={16} /></div>
                            <span>Canvas AI</span>
                        </div>
                        <div className="h-4 w-px bg-zinc-700"></div>
                        <div className="text-xs font-bold opacity-50 uppercase tracking-widest text-[10px]">{nodes.length}/10 Nodes</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onOpenSettings} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold">
                            <Settings size={18} /> <span className="hidden sm:inline">Settings</span>
                        </button>
                        <button onClick={onClearData} className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl text-xs font-bold transition-colors">
                            <Trash2 size={18} /> <span className="hidden sm:inline">Clear</span>
                        </button>
                        <button onClick={onLogout} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><LogOut size={18} /></button>
                    </div>
                </div>

                {nodes.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="p-12 bg-zinc-900 border border-zinc-700 rounded-[50px] text-center max-w-sm pointer-events-auto shadow-2xl scale-in">
                            <div className="p-5 bg-blue-600 inline-block rounded-3xl mb-8 shadow-2xl shadow-blue-600/30 animate-bounce"><MessageSquare size={40} /></div>
                            <h3 className="text-2xl font-black mb-4">Your canvas is empty</h3>
                            <p className="opacity-50 mb-10 font-medium">Create a root node to start your first orchestration.</p>
                            <button onClick={onAddInitialNode} className="w-full py-4 bg-white text-zinc-950 rounded-2xl font-black text-lg hover:bg-zinc-200 transition-all active:scale-95">Create Node</button>
                        </div>
                    </div>
                )}

                <div className="mt-auto flex justify-between items-end pointer-events-auto">
                    <div className="p-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-xl flex items-center gap-4">
                        <div className="flex gap-3 text-xs font-bold text-zinc-400">
                            <span className="px-3 py-1.5 bg-zinc-800 rounded-xl border border-zinc-700">Drag headers to Move</span>
                            <span className="px-3 py-1.5 bg-zinc-800 rounded-xl border border-zinc-700">Snap Branches with +</span>
                        </div>
                    </div>
                    {!isMobile && (
                        <button onClick={onAddInitialNode} className="p-6 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/30 hover:scale-110 active:scale-95 transition-all animate-fade-in"><Plus size={32} /></button>
                    )}
                </div>
            </div>
        </div>
    );
};
