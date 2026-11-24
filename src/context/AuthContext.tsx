import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData, AuthState } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

type Action =
  | { type: 'LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'ERROR'; payload: string };

interface AuthContextType extends AuthState {
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (googleToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const initialState: AuthState & { error: string | null } = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

function authReducer(state: typeof initialState, action: Action): typeof initialState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) dispatch({ type: 'LOGOUT' });
    }, 15000);

    async function init() {
      try {
        const { user, token } = await authService.loadFromStorage();
        if (token && user && mounted) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
          try {
            const me = await authService.getMe();
            if (mounted) dispatch({ type: 'UPDATE_USER', payload: me });
          } catch {}
        } else if (mounted) {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (e: any) {
        if (mounted) dispatch({ type: 'LOGOUT' });
      } finally {
        clearTimeout(timer);
      }
    }
    init();

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const res = await authService.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: res });
    } catch (e: any) {
      const message = e.response?.data?.message || e.message || 'Login failed';
      dispatch({ type: 'ERROR', payload: message });
      throw new Error(message);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await authService.register(data);
      dispatch({ type: 'LOGIN_SUCCESS', payload: res });
    } catch (e: any) {
      const message = e.response?.data?.message || e.message || 'Registration failed';
      dispatch({ type: 'ERROR', payload: message });
      throw new Error(message);
    }
  };

  const googleLogin = async (googleToken: string) => {
    try {
      const res = await authService.googleLogin(googleToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: res });
    } catch (e: any) {
      const message = e.response?.data?.message || e.message || 'Google login failed';
      dispatch({ type: 'ERROR', payload: message });
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const updated = await userService.updateProfile(data);
      dispatch({ type: 'UPDATE_USER', payload: updated });
    } catch (e: any) {
      const message = e.response?.data?.message || e.message || 'Update profile failed';
      throw new Error(message);
    }
  };

  const refreshUser = async () => {
    try {
      const me = await authService.getMe();
      dispatch({ type: 'UPDATE_USER', payload: me });
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
