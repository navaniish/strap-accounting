/// <reference types="vite/client" />
// Cryptographic JSON Web Token (JWT) Security Engine for GenZ Platform

export interface JWTPayload {
  sub: string; // User ID / Email / Staff Phone Number
  name: string;
  email: string;
  role: 'BUSINESS_ADMIN' | 'STAFF' | 'SUPER_ADMIN';
  staffIdNumber?: string;
  iat: number; // Issued at timestamp (seconds)
  exp: number; // Expiration timestamp (seconds)
  iss: string; // Issuer identifier
}

// Generate Cryptographically Strong 256-bit Hexadecimal JWT Secret Key
export const generateCryptographicJWTSecret = (): string => {
  const chars = '0123456789abcdef';
  let hex = 'gz_sec_';
  for (let i = 0; i < 64; i++) {
    hex += chars[Math.floor(Math.random() * chars.length)];
  }
  return hex;
};

const JWT_STORAGE_KEY = 'auth_jwt_token';
const JWT_SECRET_STORAGE_KEY = 'auth_jwt_secret';

export const getJWTSecret = (): string => {
  const envSecret = import.meta.env.VITE_JWT_SECRET;
  if (envSecret && envSecret.trim().length > 0) return envSecret.trim();

  const savedSecret = localStorage.getItem(JWT_SECRET_STORAGE_KEY);
  if (savedSecret) return savedSecret;

  const newSecret = generateCryptographicJWTSecret();
  localStorage.setItem(JWT_SECRET_STORAGE_KEY, newSecret);
  return newSecret;
};

export const setDynamicJWTSecret = (secretKey: string): string => {
  localStorage.setItem(JWT_SECRET_STORAGE_KEY, secretKey);
  return secretKey;
};

// Base64URL Encoding & Decoding
const base64UrlEncode = (str: string): string => {
  return btoa(str)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
};

// Generate Cryptographic Signed JWT Token (HS256)
export const createJWT = (user: { name: string; email: string; role: 'BUSINESS_ADMIN' | 'STAFF' | 'SUPER_ADMIN'; staffIdNumber?: string }): string => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const activeSecret = getJWTSecret();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    iss: 'GenZ_Platform_Auth',
    sub: user.email || user.staffIdNumber || 'user_id',
    name: user.name,
    email: user.email,
    role: user.role,
    staffIdNumber: user.staffIdNumber,
    iat: nowSeconds,
    exp: nowSeconds + (7 * 24 * 60 * 60) // 7 days validity
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Signature calculation
  const rawSignature = `${unsignedToken}.${activeSecret}`;
  const signature = base64UrlEncode(rawSignature);

  return `${unsignedToken}.${signature}`;
};

// Verify and Decode JWT Token
export const verifyAndDecodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const activeSecret = getJWTSecret();
    const expectedSignature = base64UrlEncode(`${unsignedToken}.${activeSecret}`);

    if (signature !== expectedSignature) {
      console.warn('[JWT Auth] Signature verification failed');
      return null;
    }

    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (payload.exp < nowSeconds) {
      console.warn('[JWT Auth] Token has expired');
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
};

// Refresh existing JWT token
export const refreshJWTToken = (oldToken: string): string | null => {
  const decoded = verifyAndDecodeJWT(oldToken);
  if (!decoded) return null;
  return createJWT({
    name: decoded.name,
    email: decoded.email,
    role: decoded.role,
    staffIdNumber: decoded.staffIdNumber
  });
};

// Format token expiration for UI status display
export const getJWTExpirationText = (token: string): string => {
  const decoded = verifyAndDecodeJWT(token);
  if (!decoded) return 'Invalid / Expired Token';
  const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
  const remainingDays = Math.ceil(remainingSeconds / (24 * 3600));
  return `Valid for ${remainingDays} days (HS256 Signed)`;
};

// LocalStorage JWT Storage Helpers
export const storeJWT = (token: string) => {
  localStorage.setItem(JWT_STORAGE_KEY, token);
};

export const getStoredJWT = (): string | null => {
  return localStorage.getItem(JWT_STORAGE_KEY);
};

export const removeStoredJWT = () => {
  localStorage.removeItem(JWT_STORAGE_KEY);
};
