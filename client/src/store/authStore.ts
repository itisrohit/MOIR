import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Types
interface User {
  _id: string;
  username: string;
  email: string;
  name: string;
  status: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  image: string;
}

interface AuthResponse {
  statusCode: number;
  data: {
    success?: boolean;
    user?: User;
    accessToken?: string;
  };
  message: string;
  success: boolean;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  
  register: (username: string, email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyUser: () => Promise<void>;
  clearError: () => void;
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});


// Create the store with separate persistence configurations
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      loading: false,
      error: null,

      register: async (username, email, password, name) => {
        try {
          set({ loading: true, error: null });
          const response = await api.post<AuthResponse>('/user/register', {
            username,
            email,
            password,
            name,
          });

          if (response.data.success) {
            set({
              accessToken: response.data.data.accessToken || null,
              isAuthenticated: true,
            });
            // Call verifyUser immediately to get complete user profile
            await get().verifyUser();
          } else {
            set({ error: response.data.message, loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ error: errorMessage, loading: false });
        }
      },

      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const response = await api.post<AuthResponse>('/user/login', {
            email,
            password,
          });

          if (response.data.success) {
            set({
              accessToken: response.data.data.accessToken || null,
              isAuthenticated: true,
            });
            // Call verifyUser immediately to get complete user profile
            await get().verifyUser();
          } else {
            set({ error: response.data.message, loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ error: errorMessage, loading: false });
        }
      },

      logout: async () => {
        try {
          set({ loading: true, error: null });
          const response = await api.post<AuthResponse>('/user/logout');
          
          if (response.data.success) {
            // Clear store state
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              loading: false,
            });
            
            // Clear cookies (all cookies in the domain)
            document.cookie.split(";").forEach((c) => {
              document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
            });
            
            // Clear localStorage (or just clear the auth-storage item)
            localStorage.removeItem('auth-storage');
            
          } else {
            set({ error: response.data.message, loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Logout failed';
          set({ error: errorMessage, loading: false });
          
          // Force logout on client side even if API call fails
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
          
          // Still clear cookies and localStorage even if API call fails
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
          });
          
          localStorage.removeItem('auth-storage');
        }
      },

      verifyUser: async () => {
        // Only attempt verification if we have a token
        if (!get().accessToken) {
          console.log('⚠️ No access token found, skipping verification');
          return;
        }
        
        console.log('🔄 Starting user verification with token');
        try {
          set({ loading: true, error: null });
          console.log('📡 Making API request to /user/profile');
          const response = await api.get<AuthResponse>('/user/profile');
          console.log('✅ API response received:', response.status);
          
          if (response.data.success) {
            console.log('✅ Verification successful');
            set({
              user: response.data.data.user || null,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            console.log('❌ Verification failed with error message:', response.data.message);
            // If verification fails, log the user out
            set({ 
              error: response.data.message, 
              loading: false,
              user: null,
              accessToken: null,
              isAuthenticated: false,
            });
            localLogout(); 
          }
        } catch (error) {
          console.log('❌ Exception in verifyUser:', error);
          // Log more details about the error
          if (axios.isAxiosError(error)) {
            console.log('Status:', error.response?.status);
            console.log('Data:', error.response?.data);
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Verification failed';
          set({ 
            error: errorMessage, 
            loading: false,
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
          console.log('🔄 Calling localLogout from verifyUser catch block');
          localLogout();
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      // Only persist the user and authentication status, not the token
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      storage: createJSONStorage(() => {
        // Use a mix: localStorage for user data, memory for tokens
        return {
          getItem: (name) => {
            const value = localStorage.getItem(name);
            if (value) {
              const parsed = JSON.parse(value);
              // Ensure token is never loaded from localStorage
              return JSON.stringify({
                ...parsed,
                state: {
                  ...parsed.state,
                  accessToken: null
                }
              });
            }
            return null;
          },
          setItem: (name, value) => {
            localStorage.setItem(name, value);
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          }
        };
      })
    }
  )
);

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle unauthorized responses
// Add a method for local logout (without server call)
const localLogout = () => {
  console.log('⚠️ localLogout called - clearing authentication state');
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    loading: false,
  });
  
  // Clear cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
  });
  
  // Clear localStorage
  localStorage.removeItem('auth-storage');
  console.log('✅ Authentication state cleared');
};

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && useAuthStore.getState().isAuthenticated) {
      console.log('🚫 401 Unauthorized response detected, initiating logout');
      localLogout();
    }
    return Promise.reject(error);
  }
);

export default useAuthStore;