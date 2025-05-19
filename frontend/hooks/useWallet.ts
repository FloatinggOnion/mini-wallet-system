import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { walletService } from '@/services/api';

interface Wallet {
  id: string;
  publicAddress: string;
  balances: Array<{
    currencyId: number;
    balance: number;
  }>;
}

export function useWallet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const getWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await walletService.getWallets();
      return Array.isArray(data) ? data : [data];
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch wallets');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getWalletDetails = async (walletId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await walletService.getWalletDetails(walletId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch wallet details');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      return await walletService.createWallet();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create wallet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getWallets,
    getWalletDetails,
    createWallet,
  };
} 