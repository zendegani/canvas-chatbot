import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

const FIVE_HOURS = 5 * 60 * 60 * 1000;

function mockMatchMedia(prefersDark: boolean) {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation(() => ({
            matches: prefersDark,
            addEventListener: (_t: string, cb: (e: MediaQueryListEvent) => void) => listeners.push(cb),
            removeEventListener: (_t: string, cb: (e: MediaQueryListEvent) => void) => {
                const i = listeners.indexOf(cb);
                if (i >= 0) listeners.splice(i, 1);
            },
        })),
    });
    return {
        emit(matches: boolean) {
            listeners.forEach(cb => cb({ matches } as MediaQueryListEvent));
        },
    };
}

describe('useTheme', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('defaults to system mode when nothing is stored', () => {
        mockMatchMedia(true);
        const { result } = renderHook(() => useTheme());
        expect(result.current.mode).toBe('system');
        expect(result.current.isDark).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('resolves isDark from the system preference in system mode', () => {
        mockMatchMedia(false);
        const { result } = renderHook(() => useTheme());
        expect(result.current.mode).toBe('system');
        expect(result.current.isDark).toBe(false);
    });

    it('cycles system → light → dark → system', () => {
        mockMatchMedia(true);
        const { result } = renderHook(() => useTheme());
        expect(result.current.mode).toBe('system');

        act(() => result.current.cycleMode());
        expect(result.current.mode).toBe('light');
        expect(result.current.isDark).toBe(false);

        act(() => result.current.cycleMode());
        expect(result.current.mode).toBe('dark');
        expect(result.current.isDark).toBe(true);

        act(() => result.current.cycleMode());
        expect(result.current.mode).toBe('system');
    });

    it('persists manual choices with a timestamp', () => {
        mockMatchMedia(true);
        const { result } = renderHook(() => useTheme());
        act(() => result.current.cycleMode());      // → light
        const raw = localStorage.getItem('theme');
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw!);
        expect(parsed.mode).toBe('light');
        expect(typeof parsed.setAt).toBe('number');
    });

    it('clears storage when reverting to system', () => {
        mockMatchMedia(true);
        const { result } = renderHook(() => useTheme());
        act(() => result.current.cycleMode());      // → light
        act(() => result.current.cycleMode());      // → dark
        act(() => result.current.cycleMode());      // → system
        expect(localStorage.getItem('theme')).toBeNull();
    });

    it('treats a stored manual choice older than 5h as system on init', () => {
        mockMatchMedia(false);
        localStorage.setItem('theme', JSON.stringify({ mode: 'dark', setAt: Date.now() - FIVE_HOURS - 1000 }));
        const { result } = renderHook(() => useTheme());
        expect(result.current.mode).toBe('system');
        expect(result.current.isDark).toBe(false);
    });

    it('honours a stored manual choice that is still within TTL', () => {
        mockMatchMedia(false);
        localStorage.setItem('theme', JSON.stringify({ mode: 'dark', setAt: Date.now() - 60_000 }));
        const { result } = renderHook(() => useTheme());
        expect(result.current.mode).toBe('dark');
        expect(result.current.isDark).toBe(true);
    });

    it('migrates the legacy plain-string storage as expired', () => {
        mockMatchMedia(false);
        localStorage.setItem('theme', 'dark');
        const { result } = renderHook(() => useTheme());
        expect(result.current.mode).toBe('system');
    });

    it('auto-reverts to system after the TTL elapses mid-session', () => {
        mockMatchMedia(false);
        const { result } = renderHook(() => useTheme());
        act(() => result.current.cycleMode());      // → light
        expect(result.current.mode).toBe('light');

        act(() => { vi.advanceTimersByTime(FIVE_HOURS + 1); });
        expect(result.current.mode).toBe('system');
    });

    it('responds to system preference changes while in system mode', () => {
        const mql = mockMatchMedia(false);
        const { result } = renderHook(() => useTheme());
        expect(result.current.isDark).toBe(false);

        act(() => mql.emit(true));
        expect(result.current.isDark).toBe(true);
    });
});
