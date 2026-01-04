import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCanvas } from './useCanvas';
import { mockFetch } from '../test/setup';

// Mock the openRouterService module
vi.mock('../services/openRouterService', () => ({
    fetchModels: vi.fn().mockResolvedValue([
        { id: 'google/gemini-pro', name: 'Gemini Pro', context_length: 32000, pricing: { prompt: '0', completion: '0' } },
    ]),
    chatCompletion: vi.fn().mockResolvedValue('Mocked response'),
}));

describe('useCanvas', () => {
    const testUser = 'test@example.com';

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

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
            expect(result.current.nodes[0].model).toBe('google/gemini-pro');
        });
    });

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

    describe('node persistence', () => {
        it('saves nodes to localStorage for current user', async () => {
            const { result } = renderHook(() => useCanvas(testUser));

            act(() => {
                result.current.addInitialNode();
            });

            await waitFor(() => {
                const savedNodes = localStorage.getItem(`canvasNodes_${testUser}`);
                expect(savedNodes).not.toBeNull();
                const parsed = JSON.parse(savedNodes!);
                expect(parsed).toHaveLength(1);
            });
        });

        it('loads nodes from localStorage for user', async () => {
            const existingNodes = [
                { id: 'node1', parentId: null, x: 100, y: 100, model: 'gpt-4', messages: [] },
            ];
            localStorage.setItem(`canvasNodes_${testUser}`, JSON.stringify(existingNodes));

            const { result } = renderHook(() => useCanvas(testUser));

            await waitFor(() => {
                expect(result.current.nodes).toHaveLength(1);
                expect(result.current.nodes[0].id).toBe('node1');
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
    });

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
});
