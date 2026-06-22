export const getTokenExpirationTime = (token: string): number | null => {
    try {
        const payloadPart = token.split('.')[1];
        if (!payloadPart) return null;

        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        const bytes = Uint8Array.from(atob(padded), char => char.charCodeAt(0));
        const payload = JSON.parse(new TextDecoder().decode(bytes));

        return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch (error) {
        console.error('Unable to read token expiration', error);
        return null;
    }
};

export const isTokenExpired = (token: string, now = Date.now()): boolean => {
    const expirationTime = getTokenExpirationTime(token);
    return expirationTime !== null && expirationTime <= now;
};
