"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { walletService } from '@/services/api';
import { useAuth } from './AuthContext';

interface Wallet {
  id: string;
  publicAddress: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  network: string;
}

interface Transaction {
  id: string;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface WalletContextType {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  transactions: Transaction[];
  balance: number;
  loading: boolean;
  error: string | null;
  createWallet: (password: string) => Promise<void>;
  selectWallet: (walletId: string) => Promise<void>;
  sendTransaction: (toAddress: string, amount: number, password: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadWallets();
    }
  }, [user]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const data = await walletService.getWallets();
      setWallets(data);
      if (data.length > 0 && !selectedWallet) {
        await selectWallet(data[0].id);
      }
    } catch (err) {
      setError('Failed to load wallets');
      console.error('Error loading wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async (password: string) => {
    try {
      setLoading(true);
      const newWallet = await walletService.createWallet(password);
      setWallets(prev => [...prev, newWallet]);
      await selectWallet(newWallet.id);
    } catch (err) {
      setError('Failed to create wallet');
      console.error('Error creating wallet:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const selectWallet = async (walletId: string) => {
    try {
      setLoading(true);
      if (!selectedWallet || selectedWallet.id !== walletId) {
        const wallet = await walletService.getWalletDetails(walletId);
        setSelectedWallet(wallet);
        
        const [balanceData, transactionsData] = await Promise.all([
          walletService.getWalletBalance(walletId),
          walletService.getTransactionHistory(walletId)
        ]);
        
        setBalance(balanceData.balance);
        setTransactions(transactionsData);
      }
    } catch (err) {
      setError('Failed to load wallet details');
      console.error('Error loading wallet details:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendTransaction = async (toAddress: string, amount: number, password: string) => {
    if (!selectedWallet) throw new Error('No wallet selected');
    
    try {
      setLoading(true);
      const transaction = await walletService.sendTransaction(
        selectedWallet.id,
        toAddress,
        amount,
        password
      );
      setTransactions(prev => [transaction, ...prev]);
      await refreshBalance();
    } catch (err) {
      setError('Failed to send transaction');
      console.error('Error sending transaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    if (!selectedWallet) return;
    
    try {
      const { balance: newBalance } = await walletService.getWalletBalance(selectedWallet.id);
      setBalance(newBalance);
    } catch (err) {
      setError('Failed to refresh balance');
      console.error('Error refreshing balance:', err);
    }
  };

  const refreshTransactions = async () => {
    if (!selectedWallet) return;
    
    try {
      const data = await walletService.getTransactionHistory(selectedWallet.id);
      setTransactions(data);
    } catch (err) {
      setError('Failed to refresh transactions');
      console.error('Error refreshing transactions:', err);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallets,
        selectedWallet,
        transactions,
        balance,
        loading,
        error,
        createWallet,
        selectWallet,
        sendTransaction,
        refreshBalance,
        refreshTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 