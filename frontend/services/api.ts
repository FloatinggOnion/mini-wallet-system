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

// Add a request interceptor to include JWT token and log requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration and log responses
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    if (error.response?.status === 401) {
      Cookies.remove('token', { path: '/' });
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
        sameSite: 'lax',
        path: '/' // Important: set the path to root
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
        sameSite: 'lax',
        path: '/' // Important: set the path to root
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
      Cookies.remove('token', { path: '/' }); // Important: remove from root path
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
  createWallet: async (password: string) => {
    const response = await api.post('/wallet', { password });
    return response.data;
  },
  
  getWallets: async () => {
    const response = await api.get('/wallet');
    return response.data;
  },
  
  getWalletDetails: async (walletId: string) => {
    const response = await api.get(`/wallet/${walletId}`);
    return response.data;
  },

  getWalletBalance: async (walletId: string) => {
    const response = await api.get(`/wallet/${walletId}/balance`);
    return response.data;
  },

  sendTransaction: async (walletId: string, toAddress: string, amount: number, password: string) => {
    const response = await api.post(`/wallet/${walletId}/send`, {
      toAddress,
      amount,
      password
    });
    return response.data;
  },

  getTransactionHistory: async (walletId: string) => {
    const response = await api.get(`/wallet/${walletId}/transactions`);
    return response.data;
  }
};

// Currency service
const currencyService = {
  getAllCurrencies: async () => {
    try {
      const response = await api.get('/currencies');
      return response.data;
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return []; // Return empty array instead of throwing error
    }
  },
  
  getCurrencyDetails: async (currencyId: string) => {
    try {
      const response = await api.get(`/currencies/${currencyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching currency details:', error);
      throw error;
    }
  },
};

export { api, authService, walletService, currencyService };