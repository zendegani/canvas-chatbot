import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme';
// Manual mode expires after 5 hours, after which we fall back to system.
const MANUAL_TTL_MS = 5 * 60 * 60 * 1000;

interface StoredTheme {
    mode: 'light' | 'dark';
    setAt: number;
}

function readStored(): StoredTheme | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // Legacy: plain 'light' / 'dark' string (no timestamp). Treat as just expired.
    if (raw === 'light' || raw === 'dark') {
        return { mode: raw, setAt: 0 };
    }
    try {
        const parsed = JSON.parse(raw);
        if ((parsed.mode === 'light' || parsed.mode === 'dark') && typeof parsed.setAt === 'number') {
            return parsed;
        }
    } catch {
        // fall through
    }
    return null;
}

function getSystemPrefersDark(): boolean {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveInitialMode(): ThemeMode {
    const stored = readStored();
    if (!stored) return 'system';
    if (Date.now() - stored.setAt > MANUAL_TTL_MS) return 'system';
    return stored.mode;
}

export function useTheme(): {
    mode: ThemeMode;
    isDark: boolean;
    cycleMode: () => void;
} {
    const [mode, setMode] = useState<ThemeMode>(resolveInitialMode);
    const [systemDark, setSystemDark] = useState<boolean>(getSystemPrefersDark);

    // Track system preference changes (only affects rendering when mode === 'system')
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    // Auto-revert to system after the TTL elapses, even mid-session.
    useEffect(() => {
        if (mode === 'system') {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }
        const stored: StoredTheme = { mode, setAt: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        const timer = window.setTimeout(() => setMode('system'), MANUAL_TTL_MS);
        return () => window.clearTimeout(timer);
    }, [mode]);

    // Apply the resolved theme to <html> for Tailwind's `dark:` selector.
    const isDark = mode === 'system' ? systemDark : mode === 'dark';
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    // Cycle: system → light → dark → system
    const cycleMode = useCallback(() => {
        setMode(prev => prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system');
    }, []);

    return { mode, isDark, cycleMode };
}
