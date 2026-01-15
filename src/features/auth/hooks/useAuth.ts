import { useState, useEffect } from 'react';
import { ViewState } from '../types';

interface UseAuthReturn {
    isLoggedIn: boolean;
    isRegistered: boolean;
    currentUser: string;
    view: ViewState;
    setView: (view: ViewState) => void;
    handleSignupSubmit: (e: React.FormEvent) => void;
    handleLoginSubmit: (e: React.FormEvent) => void;
    handleLogout: () => void;
    setCurrentUser: (user: string) => void;
    setIsLoggedIn: (loggedIn: boolean) => void;
    setIsRegistered: (registered: boolean) => void;
}

export const useAuth = (): UseAuthReturn => {
    const [view, setView] = useState<ViewState>(() => {
        return localStorage.getItem('isLoggedIn') === 'true' ? 'canvas' : 'landing';
    });
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(localStorage.getItem('isLoggedIn') === 'true');
    const [isRegistered, setIsRegistered] = useState<boolean>(localStorage.getItem('isRegistered') === 'true');
    const [currentUser, setCurrentUser] = useState<string>(localStorage.getItem('currentUser') || '');

    const handleSignupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) return;

        const users = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
        if (users[email]) {
            alert('User already exists. Please login.');
            setView('login');
            return;
        }

        users[email] = password;
        localStorage.setItem('registeredUsers', JSON.stringify(users));

        // Auto login
        localStorage.setItem('currentUser', email);
        setCurrentUser(email);
        localStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);
        setView('canvas');
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const users = JSON.parse(localStorage.getItem('registeredUsers') || '{}');

        if (users[email] && users[email] === password) {
            localStorage.setItem('currentUser', email);
            setCurrentUser(email);
            localStorage.setItem('isLoggedIn', 'true');
            setIsLoggedIn(true);
            setView('canvas');
        } else {
            alert('Invalid email or password.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        setCurrentUser('');
        setIsLoggedIn(false);
        setView('landing');
    };

    return {
        isLoggedIn,
        isRegistered,
        currentUser,
        view,
        setView,
        handleSignupSubmit,
        handleLoginSubmit,
        handleLogout,
        setCurrentUser,
        setIsLoggedIn,
        setIsRegistered
    };
};
