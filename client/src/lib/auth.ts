import { User } from "@shared/schema";

interface AuthState {
  user: User | null;
  token: string | null;
}

class AuthManager {
  private static instance: AuthManager;
  private state: AuthState = {
    user: null,
    token: localStorage.getItem('auth_token'),
  };
  private listeners: ((state: AuthState) => void)[] = [];

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  getState(): AuthState {
    return { ...this.state };
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  setAuth(user: User, token: string) {
    this.state = { user, token };
    localStorage.setItem('auth_token', token);
    this.notify();
  }

  clearAuth() {
    this.state = { user: null, token: null };
    localStorage.removeItem('auth_token');
    this.notify();
  }

  getAuthHeader(): { Authorization?: string } {
    return this.state.token ? { Authorization: `Bearer ${this.state.token}` } : {};
  }
}

export const authManager = AuthManager.getInstance();
