import { useState } from 'react';
import { walletService } from '../services/api';

interface Wallet {
  id: string;
  publicAddress: string;
  balances: Array<{
    currencyId: number;
    balance: number;
  }>;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  currencyId: number;
}

export const useWallet = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      const wallets = await walletService.getWallets();
      return wallets;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallets');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getWalletDetails = async (walletId: string) => {
    try {
      setLoading(true);
      setError(null);
      const wallet = await walletService.getWalletDetails(walletId);
      return wallet;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet details');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      const wallet = await walletService.createWallet();
      return wallet;
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransactions = async (walletId: string) => {
    try {
      setLoading(true);
      setError(null);
      const transactions = await walletService.getTransactions(walletId);
      return transactions;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
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
    getTransactions,
  };
}; 