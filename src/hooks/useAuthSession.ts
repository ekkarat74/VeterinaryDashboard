import { useCallback, useEffect, useRef, useState } from 'react';
import { getTokenExpirationTime, isTokenExpired } from '../utils/tokenUtils';

const AUTH_STORAGE_KEY = 'vet_user';

interface AuthenticatedUser {
    token: string;
    [key: string]: unknown;
}

interface UseAuthSessionOptions<T extends AuthenticatedUser> {
    user: T | null;
    setUser: (user: T | null) => void;
    setLoginOpen: (isOpen: boolean) => void;
    onForbidden?: () => void;
}

const readStoredUser = <T extends AuthenticatedUser>(): T | null => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedUser) return null;
    return JSON.parse(storedUser) as T;
};

const useAuthSession = <T extends AuthenticatedUser>({
    user,
    setUser,
    setLoginOpen,
    onForbidden
}: UseAuthSessionOptions<T>) => {
    const [isLoginRequired, setIsLoginRequired] = useState(false);
    const userRef = useRef<T | null>(user);
    const onForbiddenRef = useRef(onForbidden);
    const lastForbiddenAtRef = useRef(0);

    userRef.current = user;
    onForbiddenRef.current = onForbidden;

    const requireLogin = useCallback(() => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
        setIsLoginRequired(true);
        setLoginOpen(true);
    }, [setUser, setLoginOpen]);

    const login = useCallback((userData: T) => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
        setIsLoginRequired(false);
        setLoginOpen(false);
    }, [setUser, setLoginOpen]);

    const logout = useCallback(() => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
        setIsLoginRequired(false);
        setLoginOpen(false);
    }, [setUser, setLoginOpen]);

    const getCurrentToken = useCallback(() => {
        try {
            return readStoredUser<T>()?.token || userRef.current?.token || '';
        } catch (error) {
            console.error('Error parsing token', error);
            return userRef.current?.token || '';
        }
    }, []);

    useEffect(() => {
        try {
            const storedUser = readStoredUser<T>();
            if (!storedUser) return;

            if (!storedUser.token || isTokenExpired(storedUser.token)) {
                requireLogin();
                return;
            }

            setUser(storedUser);
        } catch (error) {
            console.error('Error restoring session', error);
            requireLogin();
        }
    }, [setUser, requireLogin]);

    useEffect(() => {
        const token = user?.token;
        if (!token) return;

        const expirationTime = getTokenExpirationTime(token);
        if (expirationTime === null) return;

        let timeoutId: number | undefined;
        let isActive = true;

        const checkExpiration = () => {
            if (!isActive) return;

            const remainingTime = expirationTime - Date.now();
            if (remainingTime <= 0) {
                requireLogin();
                return;
            }

            if (timeoutId !== undefined) window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(checkExpiration, Math.min(remainingTime, 2_147_483_647));
        };

        const checkWhenVisible = () => {
            if (document.visibilityState === 'visible') checkExpiration();
        };

        checkExpiration();
        window.addEventListener('focus', checkExpiration);
        document.addEventListener('visibilitychange', checkWhenVisible);

        return () => {
            isActive = false;
            if (timeoutId !== undefined) window.clearTimeout(timeoutId);
            window.removeEventListener('focus', checkExpiration);
            document.removeEventListener('visibilitychange', checkWhenVisible);
        };
    }, [user?.token, requireLogin]);

    useEffect(() => {
        const originalFetch = window.fetch;

        const interceptedFetch: typeof window.fetch = async (...args) => {
            const response = await originalFetch.apply(window, args);
            const input = args[0];
            const requestUrl = typeof input === 'string'
                ? input
                : input instanceof URL
                    ? input.href
                    : input.url;

            let pathname = '';
            try {
                pathname = new URL(requestUrl, window.location.origin).pathname;
            } catch {
                return response;
            }

            const isApiRequest = pathname.startsWith('/api/');
            const isLoginRequest = pathname === '/api/login';
            if (!isApiRequest || isLoginRequest) return response;

            let hasSession = Boolean(userRef.current?.token);
            if (!hasSession) {
                try {
                    hasSession = Boolean(readStoredUser<T>()?.token);
                } catch {
                    hasSession = false;
                }
            }

            if (!hasSession) return response;

            if (response.status === 401) {
                requireLogin();
            } else if (response.status === 403) {
                const now = Date.now();
                if (now - lastForbiddenAtRef.current > 1000) {
                    lastForbiddenAtRef.current = now;
                    onForbiddenRef.current?.();
                }
            }

            return response;
        };

        window.fetch = interceptedFetch;
        return () => {
            if (window.fetch === interceptedFetch) window.fetch = originalFetch;
        };
    }, [requireLogin]);

    return {
        getCurrentToken,
        isLoginRequired,
        login,
        logout,
        requireLogin
    };
};

export default useAuthSession;
