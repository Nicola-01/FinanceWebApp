import {jwtDecode} from 'jwt-decode';

/**
 * Interface representing the structure of your JWT payload.
 * Adjust the fields based on your backend implementation.
 */
export interface DecodedToken {
    sub: string;    // Usually the username or email
    userId: string; // Custom field for the database ID
    role: string;   // User role (e.g., 'admin', 'user')
    exp: number;    // Expiration timestamp
    iat: number;    // Issued at timestamp
}

/**
 * Retrieves the raw token from storage
 */
export const getToken = (): string | null => {
    return localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
};

/**
 * Decodes the token and returns the full payload
 */
export const getDecodedToken = (): DecodedToken | null => {
    const token = getToken();
    if (!token) return null;

    try {
        return jwtDecode<DecodedToken>(token);
    } catch (error) {
        console.error("Invalid token format", error);
        return null;
    }
};

/**
 *
 */
export const isTokenValid = (): boolean => {
    const decoded = getDecodedToken();
    if (!decoded) return false;

    const currentTime = Date.now() / 1000; // Convert to seconds
    return decoded.exp > currentTime;
};

/**
 * Specific helper to get user info in one go
 */
export const getUserAuth = () => {
    const decoded = getDecodedToken();
    if (!decoded) return null;

    return {
        username: decoded.sub,
        userId: decoded.userId,
        role: decoded.role,
        isExpired: decoded.exp * 1000 < Date.now()
    };
};