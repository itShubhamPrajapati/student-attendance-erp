import { User } from '../types';

const TOKEN_KEY = 'qr_attendance_token';
const USER_KEY = 'qr_attendance_user';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save token to localStorage', err);
  }
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove token from localStorage', err);
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user to localStorage', err);
  }
}

export function removeStoredUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Failed to remove user from localStorage', err);
  }
}

export function clearAuthSession(): void {
  removeToken();
  removeStoredUser();
}
