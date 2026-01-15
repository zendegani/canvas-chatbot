import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

// Helper to create a mock form event with FormData that returns specified values
const createMockFormEvent = (email: string, password: string) => {
    const mockFormElement = document.createElement('form');
    const emailInput = document.createElement('input');
    emailInput.name = 'email';
    emailInput.value = email;
    const passwordInput = document.createElement('input');
    passwordInput.name = 'password';
    passwordInput.value = password;
    mockFormElement.appendChild(emailInput);
    mockFormElement.appendChild(passwordInput);

    return {
        preventDefault: vi.fn(),
        target: mockFormElement,
    } as unknown as React.FormEvent<HTMLFormElement>;
};

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('initial state', () => {
        it('returns default state when no localStorage data', () => {
            const { result } = renderHook(() => useAuth());

            expect(result.current.isLoggedIn).toBe(false);
            expect(result.current.isRegistered).toBe(false);
            expect(result.current.currentUser).toBe('');
            expect(result.current.view).toBe('landing');
        });

        it('hydrates state from localStorage', () => {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('isRegistered', 'true');
            localStorage.setItem('currentUser', 'test@example.com');

            const { result } = renderHook(() => useAuth());

            expect(result.current.isLoggedIn).toBe(true);
            expect(result.current.isRegistered).toBe(true);
            expect(result.current.currentUser).toBe('test@example.com');
            expect(result.current.view).toBe('canvas');
        });
    });

    describe('handleSignupSubmit', () => {
        it('creates user and logs in on successful signup', () => {
            const { result } = renderHook(() => useAuth());

            const mockEvent = createMockFormEvent('new@example.com', 'password123');

            act(() => {
                result.current.handleSignupSubmit(mockEvent);
            });

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(result.current.isLoggedIn).toBe(true);
            expect(result.current.currentUser).toBe('new@example.com');
            expect(result.current.view).toBe('canvas');
            expect(localStorage.getItem('currentUser')).toBe('new@example.com');
        });

        it('alerts and redirects to login if user already exists', () => {
            localStorage.setItem('registeredUsers', JSON.stringify({ 'existing@example.com': 'pass' }));
            const { result } = renderHook(() => useAuth());

            const mockEvent = createMockFormEvent('existing@example.com', 'newpass');

            act(() => {
                result.current.handleSignupSubmit(mockEvent);
            });

            expect(window.alert).toHaveBeenCalledWith('User already exists. Please login.');
            expect(result.current.view).toBe('login');
        });
    });

    describe('handleLoginSubmit', () => {
        it('logs in user with valid credentials', () => {
            localStorage.setItem('registeredUsers', JSON.stringify({ 'user@example.com': 'secret' }));
            const { result } = renderHook(() => useAuth());

            const mockEvent = createMockFormEvent('user@example.com', 'secret');

            act(() => {
                result.current.handleLoginSubmit(mockEvent);
            });

            expect(result.current.isLoggedIn).toBe(true);
            expect(result.current.currentUser).toBe('user@example.com');
            expect(result.current.view).toBe('canvas');
        });

        it('shows alert for invalid credentials', () => {
            localStorage.setItem('registeredUsers', JSON.stringify({ 'user@example.com': 'secret' }));
            const { result } = renderHook(() => useAuth());

            const mockEvent = createMockFormEvent('user@example.com', 'wrongpass');

            act(() => {
                result.current.handleLoginSubmit(mockEvent);
            });

            expect(window.alert).toHaveBeenCalledWith('Invalid email or password.');
            expect(result.current.isLoggedIn).toBe(false);
        });
    });

    describe('handleLogout', () => {
        it('clears user state and returns to landing', () => {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', 'user@example.com');

            const { result } = renderHook(() => useAuth());

            expect(result.current.isLoggedIn).toBe(true);

            act(() => {
                result.current.handleLogout();
            });

            expect(result.current.isLoggedIn).toBe(false);
            expect(result.current.currentUser).toBe('');
            expect(result.current.view).toBe('landing');
            expect(localStorage.getItem('isLoggedIn')).toBeNull();
            expect(localStorage.getItem('currentUser')).toBeNull();
        });
    });
});
