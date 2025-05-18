import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Types
export interface User {
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

interface UsersResponse {
  statusCode: number;
  data: {
    success: boolean;
    users: User[];
    pagination: {
      total: number;
    }
  };
  message: string;
  success: boolean;
}

interface UserStore {
  users: User[];
  totalUsers: number;
  loading: boolean;
  error: string | null;
  
  fetchAllUsers: () => Promise<void>;
  clearError: () => void;
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});


// Create the user store
export const useUserStore = create<UserStore>()((set) => ({
  users: [],
  totalUsers: 0,
  loading: false,
  error: null,

  fetchAllUsers: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get<UsersResponse>('/user/all-users');
      if (response.data.success) {
        set({
          users: response.data.data.users,
          totalUsers: response.data.data.pagination.total,
          loading: false,
        });
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      set({ error: errorMessage, loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useUserStore;