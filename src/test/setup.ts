import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000',
    },
    writable: true,
});

// Mock window.alert
window.alert = vi.fn();

// Mock window.confirm
window.confirm = vi.fn(() => true);

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
});

// Global fetch mock utility
export const mockFetch = (response: unknown, ok = true, status = 200) => {
    global.fetch = vi.fn().mockResolvedValue({
        ok,
        status,
        statusText: ok ? 'OK' : 'Error',
        json: () => Promise.resolve(response),
    });
};

export const mockFetchError = (errorMessage: string) => {
    global.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));
};
