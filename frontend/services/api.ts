// services/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5237/api',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add a request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth service
const authService = {
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      Cookies.set('token', response.data.token, { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    return response.data;
  },
  
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      Cookies.set('token', response.data.token, { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always remove the token from cookies, even if the API call fails
      Cookies.remove('token');
      // Redirect to login page
      window.location.href = '/login';
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      return null;
    }
  },
};

// Wallet service
const walletService = {
  getWallets: async () => {
    const response = await api.get('/wallets');
    return response.data;
  },
  
  getWalletDetails: async (walletId: string) => {
    const response = await api.get(`/wallets/${walletId}`);
    return response.data;
  },
  
  connectWallet: async (publicAddress: string) => {
    const response = await api.post('/wallets/connect', { publicAddress });
    return response.data;
  },
  
  getTransactions: async (walletId: string) => {
    const response = await api.get(`/wallets/${walletId}/transactions`);
    return response.data;
  },
};

// Currency service
const currencyService = {
  getAllCurrencies: async () => {
    const response = await api.get('/currencies');
    return response.data;
  },
  
  getCurrencyDetails: async (currencyId: string) => {
    const response = await api.get(`/currencies/${currencyId}`);
    return response.data;
  },
};

export { api, authService, walletService, currencyService };