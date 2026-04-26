import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCanvas } from './useCanvas';
import { mockFetch } from '../../../test/setup';
import { PROVIDERS } from '../services/providers';

// Mock the chatService module
const mockChatCompletion = vi.fn().mockResolvedValue('Mocked response');
vi.mock('../services/chatService', () => ({
    fetchModels: vi.fn().mockResolvedValue([
        { id: 'google/gemma-3-27b-it:free', name: 'Google: Gemma 3 27B' },
    ]),
    chatCompletion: (...args: unknown[]) => {
        const onChunk = args[4] as ((text: string) => void) | undefined;
        return mockChatCompletion(...args).then((text: string) => {
            onChunk?.(text);
            return text;
        });
    },
}));

describe('useCanvas', () => {
    const testUser = 'test@example.com';
    const defaultProvider = PROVIDERS.openrouter;
    const apiStorageKey = `apiKey_openrouter_${testUser}`;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockChatCompletion.mockResolvedValue('Mocked response');
    });

    // ---------- addInitialNode ----------

    describe('addInitialNode', () => {
        it('creates node at initial position', async () => {
            const { result } = renderHook(() => useCanvas(testUser));

            await waitFor(() => {
                expect(result.current.nodes).toHaveLength(0);
            });

            act(() => {
                result.current.addInitialNode();
            });

            expect(result.current.nodes).toHaveLength(1);
            expect(result.current.nodes[0].x).toBe(224);
            expect(result.current.nodes[0].y).toBe(184);
            expect(result.current.nodes[0].parentId).toBeNull();
            expect(result.current.nodes[0].messages).toEqual([]);
            expect(result.current.nodes[0].model).toBe(defaultProvider.defaultModel.id);
        });

        it('creates a new session when current session has nodes', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.addInitialNode());
            const firstSessionId = result.current.activeSessionId;
            expect(result.current.sessions).toHaveLength(1);

            // Adding another initial node should create a second session
            act(() => result.current.addInitialNode());

            expect(result.current.sessions).toHaveLength(2);
            expect(result.current.activeSessionId).not.toBe(firstSessionId);
            expect(result.current.nodes).toHaveLength(1);
        });
    });

    // ---------- handleBranch ----------

    describe('handleBranch', () => {
        it('creates child node from parent', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.models).toHaveLength(1));

            act(() => {
                result.current.addInitialNode();
            });

            const parentId = result.current.nodes[0].id;

            act(() => {
                result.current.handleBranch(parentId);
            });

            expect(result.current.nodes).toHaveLength(2);
            const childNode = result.current.nodes[1];
            expect(childNode.parentId).toBe(parentId);
            expect(childNode.x).toBe(850); // parent.x + 576 + 50
            expect(childNode.model).toBe(result.current.nodes[0].model);
        });

        it('creates child node below parent when direction is bottom', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.models).toHaveLength(1));

            act(() => result.current.addInitialNode());
            const parentId = result.current.nodes[0].id;

            act(() => result.current.handleBranch(parentId, 'bottom'));

            expect(result.current.nodes).toHaveLength(2);
            const child = result.current.nodes[1];
            expect(child.parentId).toBe(parentId);
            // bottom: newX = parent.x + 50, newY = parent.y + 400 + 50
            expect(child.x).toBe(result.current.nodes[0].x + 50);
            expect(child.y).toBe(result.current.nodes[0].y + 400 + 50);
        });

        it('copies parent messages to child', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.models).toHaveLength(1));

            act(() => result.current.addInitialNode());
            const parentId = result.current.nodes[0].id;

            // Manually add messages to parent
            act(() => {
                result.current.setNodes(prev =>
                    prev.map(n =>
                        n.id === parentId
                            ? { ...n, messages: [{ role: 'user' as const, content: 'Hello' }] }
                            : n
                    )
                );
            });

            act(() => result.current.handleBranch(parentId));

            const child = result.current.nodes[1];
            expect(child.messages).toEqual([{ role: 'user', content: 'Hello' }]);
            expect(child.startIndex).toBe(1);
        });

        it('respects maximum of 10 nodes', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.models).toHaveLength(1));

            act(() => {
                result.current.addInitialNode();
            });

            const parentId = result.current.nodes[0].id;

            // Create 9 more nodes (total 10)
            for (let i = 0; i < 9; i++) {
                act(() => {
                    result.current.handleBranch(parentId);
                });
            }

            expect(result.current.nodes).toHaveLength(10);

            // Try to add 11th node
            act(() => {
                result.current.handleBranch(parentId);
            });

            expect(result.current.nodes).toHaveLength(10);
            expect(window.alert).toHaveBeenCalledWith('Maximum of 10 nodes reached.');
        });

        it('does nothing when parent not found', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.models).toHaveLength(1));

            act(() => {
                result.current.addInitialNode();
            });

            act(() => {
                result.current.handleBranch('non-existent-id');
            });

            expect(result.current.nodes).toHaveLength(1);
        });
    });

    // ---------- Session management ----------

    describe('session management', () => {
        it('createSession adds a new session and switches to it', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.createSession());

            expect(result.current.sessions).toHaveLength(1);
            expect(result.current.activeSessionId).toBe(result.current.sessions[0].id);
            expect(result.current.nodes).toHaveLength(1); // initial node
        });

        it('createSession caps at MAX_SESSIONS (50) and evicts oldest', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            // Create 50 sessions
            for (let i = 0; i < 50; i++) {
                act(() => result.current.createSession());
            }
            expect(result.current.sessions).toHaveLength(50);

            const oldestId = result.current.sessions[49].id;

            // 51st should evict the oldest
            act(() => result.current.createSession());
            expect(result.current.sessions).toHaveLength(50);

            const ids = result.current.sessions.map(s => s.id);
            expect(ids).not.toContain(oldestId);
        });

        it('loadSession switches to the specified session', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.createSession());
            const firstId = result.current.activeSessionId!;

            act(() => result.current.createSession());
            const secondId = result.current.activeSessionId!;
            expect(secondId).not.toBe(firstId);

            act(() => result.current.loadSession(firstId));
            expect(result.current.activeSessionId).toBe(firstId);
        });

        it('loadSession does nothing when loading the already-active session', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.createSession());
            const currentId = result.current.activeSessionId!;

            act(() => result.current.loadSession(currentId));
            expect(result.current.activeSessionId).toBe(currentId);
        });

        it('deleteSession removes session and switches to next', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.createSession());
            const firstId = result.current.activeSessionId!;

            act(() => result.current.createSession());
            const secondId = result.current.activeSessionId!;

            // Delete the active (second) session — should switch to first
            act(() => result.current.deleteSession(secondId));
            expect(result.current.sessions).toHaveLength(1);
            expect(result.current.activeSessionId).toBe(firstId);
        });

        it('deleteSession clears everything when last session is deleted', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.createSession());
            const onlyId = result.current.activeSessionId!;

            act(() => result.current.deleteSession(onlyId));

            expect(result.current.sessions).toHaveLength(0);
            expect(result.current.activeSessionId).toBeNull();
            expect(result.current.nodes).toHaveLength(0);
        });

        it('deleteSession of non-active session does not change active', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.createSession());
            const firstId = result.current.activeSessionId!;

            act(() => result.current.createSession());
            const secondId = result.current.activeSessionId!;

            // Delete the first (non-active) session
            act(() => result.current.deleteSession(firstId));

            expect(result.current.sessions).toHaveLength(1);
            expect(result.current.activeSessionId).toBe(secondId);
        });
    });

    // ---------- handleSendMessage ----------

    describe('handleSendMessage', () => {
        it('prompts for API key if not set', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.addInitialNode());
            const nodeId = result.current.nodes[0].id;

            await act(async () => {
                await result.current.handleSendMessage(nodeId, 'Hello');
            });

            expect(window.alert).toHaveBeenCalledWith(
                `Please set your ${defaultProvider.name} API Key in Settings first.`
            );
            expect(result.current.isSettingsOpen).toBe(true);
        });

        it('appends user message and assistant reply', async () => {
            localStorage.setItem(apiStorageKey, 'test-key');
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.addInitialNode());
            const nodeId = result.current.nodes[0].id;

            await act(async () => {
                await result.current.handleSendMessage(nodeId, 'Hello');
            });

            const node = result.current.nodes.find(n => n.id === nodeId)!;
            expect(node.messages).toHaveLength(2);
            expect(node.messages[0]).toEqual({ role: 'user', content: 'Hello' });
            expect(node.messages[1]).toEqual({ role: 'assistant', content: 'Mocked response' });
            expect(node.isThinking).toBe(false);
        });

        it('handles API error gracefully', async () => {
            localStorage.setItem(apiStorageKey, 'test-key');
            mockChatCompletion.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.addInitialNode());
            const nodeId = result.current.nodes[0].id;

            await act(async () => {
                await result.current.handleSendMessage(nodeId, 'Hello');
            });

            expect(window.alert).toHaveBeenCalledWith('Error: Network error');
            const node = result.current.nodes.find(n => n.id === nodeId)!;
            expect(node.isThinking).toBe(false);
            // User message remains, no assistant message added
            expect(node.messages).toHaveLength(1);
            expect(node.messages[0].role).toBe('user');
        });
    });

    // ---------- handleCompareMessage ----------

    describe('handleCompareMessage', () => {
        it('prompts for API key if not set', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.addInitialNode());
            const nodeId = result.current.nodes[0].id;

            await act(async () => {
                await result.current.handleCompareMessage(
                    nodeId, 'Compare this', ['model-a', 'model-b']
                );
            });

            expect(window.alert).toHaveBeenCalledWith(
                `Please set your ${defaultProvider.name} API Key in Settings first.`
            );
        });

        it('creates two child nodes with responses from different models', async () => {
            localStorage.setItem(apiStorageKey, 'test-key');
            mockChatCompletion
                .mockResolvedValueOnce('Reply from A')
                .mockResolvedValueOnce('Reply from B');

            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.addInitialNode());
            const parentId = result.current.nodes[0].id;

            await act(async () => {
                await result.current.handleCompareMessage(
                    parentId, 'Compare this', ['model-a', 'model-b']
                );
            });

            // Parent + 2 children = 3 nodes
            expect(result.current.nodes).toHaveLength(3);

            const children = result.current.nodes.filter(n => n.parentId === parentId);
            expect(children).toHaveLength(2);
            expect(children[0].model).toBe('model-a');
            expect(children[1].model).toBe('model-b');

            // Both children got their responses
            const childA = children[0];
            const childB = children[1];
            expect(childA.messages[childA.messages.length - 1].content).toBe('Reply from A');
            expect(childB.messages[childB.messages.length - 1].content).toBe('Reply from B');
            expect(childA.isThinking).toBe(false);
            expect(childB.isThinking).toBe(false);
        });

        it('blocks compare when it would exceed 10 nodes', async () => {
            localStorage.setItem(apiStorageKey, 'test-key');
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.addInitialNode());
            const parentId = result.current.nodes[0].id;

            // Add 8 more nodes (total 9)
            for (let i = 0; i < 8; i++) {
                act(() => result.current.handleBranch(parentId));
            }
            expect(result.current.nodes).toHaveLength(9);

            // Compare would add 2 nodes (9 + 2 = 11 > 10)
            await act(async () => {
                await result.current.handleCompareMessage(
                    parentId, 'Compare', ['model-a', 'model-b']
                );
            });

            expect(window.alert).toHaveBeenCalledWith(
                'Not enough room — maximum of 10 nodes reached.'
            );
            expect(result.current.nodes).toHaveLength(9);
        });

        it('handles API error in one child gracefully', async () => {
            localStorage.setItem(apiStorageKey, 'test-key');
            mockChatCompletion
                .mockResolvedValueOnce('Reply from A')
                .mockRejectedValueOnce(new Error('Model B failed'));

            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.addInitialNode());
            const parentId = result.current.nodes[0].id;

            await act(async () => {
                await result.current.handleCompareMessage(
                    parentId, 'Compare', ['model-a', 'model-b']
                );
            });

            const children = result.current.nodes.filter(n => n.parentId === parentId);
            expect(children).toHaveLength(2);

            // Child A succeeded
            const childA = children[0];
            expect(childA.messages[childA.messages.length - 1].content).toBe('Reply from A');
            expect(childA.isThinking).toBe(false);

            // Child B got an error message
            const childB = children[1];
            expect(childB.messages[childB.messages.length - 1].content).toBe('Error: Model B failed');
            expect(childB.isThinking).toBe(false);
        });
    });

    // ---------- updateNodeSize ----------

    describe('updateNodeSize', () => {
        it('updates width and height of a specific node', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.addInitialNode());
            const nodeId = result.current.nodes[0].id;

            act(() => result.current.updateNodeSize(nodeId, 800, 600));

            const node = result.current.nodes.find(n => n.id === nodeId)!;
            expect(node.width).toBe(800);
            expect(node.height).toBe(600);
        });
    });

    // ---------- Persistence ----------

    describe('node persistence', () => {
        it('saves nodes to localStorage as a session', async () => {
            const { result } = renderHook(() => useCanvas(testUser));

            act(() => {
                result.current.addInitialNode();
            });

            await waitFor(() => {
                const sessionIndex = localStorage.getItem(`canvasSessions_${testUser}`);
                expect(sessionIndex).not.toBeNull();
                const sessions = JSON.parse(sessionIndex!);
                expect(sessions).toHaveLength(1);
                // Check session data was saved
                const sessionData = localStorage.getItem(`canvasSession_${testUser}_${sessions[0].id}`);
                expect(sessionData).not.toBeNull();
                const parsed = JSON.parse(sessionData!);
                expect(parsed.nodes).toHaveLength(1);
            });
        });

        it('migrates legacy canvasNodes into a session', async () => {
            const existingNodes = [
                { id: 'node1', parentId: null, x: 100, y: 100, model: 'gpt-4', messages: [] },
            ];
            localStorage.setItem(`canvasNodes_${testUser}`, JSON.stringify(existingNodes));

            const { result } = renderHook(() => useCanvas(testUser));

            await waitFor(() => {
                expect(result.current.nodes).toHaveLength(1);
                expect(result.current.nodes[0].id).toBe('node1');
                // Legacy key should be removed after migration
                expect(localStorage.getItem(`canvasNodes_${testUser}`)).toBeNull();
                // Session index should exist
                const sessionIndex = localStorage.getItem(`canvasSessions_${testUser}`);
                expect(sessionIndex).not.toBeNull();
            });
        });

        it('derives session title from first user message', async () => {
            const existingNodes = [
                {
                    id: 'node1', parentId: null, x: 100, y: 100, model: 'gpt-4',
                    messages: [{ role: 'user', content: 'What is the meaning of life?' }],
                },
            ];
            localStorage.setItem(`canvasNodes_${testUser}`, JSON.stringify(existingNodes));

            const { result } = renderHook(() => useCanvas(testUser));

            await waitFor(() => {
                expect(result.current.sessions).toHaveLength(1);
                expect(result.current.sessions[0].title).toBe('What is the meaning of life?');
            });
        });

        it('truncates long titles with ellipsis', async () => {
            const longMessage = 'This is a very long user message that should be truncated at exactly thirty characters';
            const existingNodes = [
                {
                    id: 'node1', parentId: null, x: 0, y: 0, model: 'gpt-4',
                    messages: [{ role: 'user', content: longMessage }],
                },
            ];
            localStorage.setItem(`canvasNodes_${testUser}`, JSON.stringify(existingNodes));

            const { result } = renderHook(() => useCanvas(testUser));

            await waitFor(() => {
                expect(result.current.sessions[0].title.length).toBeLessThanOrEqual(31); // 30 + ellipsis
                expect(result.current.sessions[0].title).toContain('…');
            });
        });

        it('clears nodes when user changes to empty', async () => {
            const { result, rerender } = renderHook(
                ({ user }) => useCanvas(user),
                { initialProps: { user: testUser } }
            );

            act(() => {
                result.current.addInitialNode();
            });

            expect(result.current.nodes).toHaveLength(1);

            rerender({ user: '' });

            await waitFor(() => {
                expect(result.current.nodes).toHaveLength(0);
            });
        });

        it('restores active session on re-mount', async () => {
            // Mount, create session with a node, unmount
            const { result, unmount } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.createSession());
            const sessionId = result.current.activeSessionId;
            expect(sessionId).not.toBeNull();
            unmount();

            // Re-mount — should restore
            const { result: result2 } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result2.current.hasLoaded).toBe(true));
            expect(result2.current.activeSessionId).toBe(sessionId);
            expect(result2.current.nodes).toHaveLength(1);
        });
    });

    // ---------- clearData ----------

    describe('clearData', () => {
        it('clears all sessions and resets state', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.createSession());
            act(() => result.current.createSession());
            expect(result.current.sessions).toHaveLength(2);

            const mockSetView = vi.fn();
            act(() => result.current.clearData(mockSetView));

            expect(result.current.sessions).toHaveLength(0);
            expect(result.current.nodes).toHaveLength(0);
            expect(result.current.activeSessionId).toBeNull();
            expect(mockSetView).toHaveBeenCalledWith('landing');
        });

        it('does not clear when user cancels confirm dialog', async () => {
            vi.mocked(window.confirm).mockReturnValueOnce(false);

            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.createSession());
            expect(result.current.sessions).toHaveLength(1);

            const mockSetView = vi.fn();
            act(() => result.current.clearData(mockSetView));

            // Nothing should have changed
            expect(result.current.sessions).toHaveLength(1);
            expect(mockSetView).not.toHaveBeenCalled();
        });
    });

    // ---------- settings modal ----------

    describe('settings modal', () => {
        it('toggles settings modal state', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.models).toHaveLength(1));

            expect(result.current.isSettingsOpen).toBe(false);

            act(() => {
                result.current.setIsSettingsOpen(true);
            });

            expect(result.current.isSettingsOpen).toBe(true);
        });
    });

    // ---------- models ----------

    describe('models', () => {
        it('clears models when user is empty', async () => {
            const { result, rerender } = renderHook(
                ({ user }) => useCanvas(user),
                { initialProps: { user: testUser } }
            );

            await waitFor(() => expect(result.current.models).toHaveLength(1));

            rerender({ user: '' });

            await waitFor(() => expect(result.current.models).toHaveLength(0));
        });
    });

    // ---------- provider management ----------

    describe('provider management', () => {
        it('defaults to openrouter provider', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            expect(result.current.selectedProvider).toBe('openrouter');
        });

        it('persists selected provider to localStorage', async () => {
            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            act(() => result.current.setSelectedProvider('google'));

            expect(result.current.selectedProvider).toBe('google');
            expect(localStorage.getItem(`selectedProvider_${testUser}`)).toBe('google');
        });

        it('restores selected provider on re-mount', async () => {
            localStorage.setItem(`selectedProvider_${testUser}`, 'openai');

            const { result } = renderHook(() => useCanvas(testUser));
            await waitFor(() => expect(result.current.hasLoaded).toBe(true));

            expect(result.current.selectedProvider).toBe('openai');
        });
    });
});
