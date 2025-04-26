'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

interface Wallet {
  id: string;
  publicAddress: string;
  balances: Array<{
    currencyId: number;
    balance: number;
  }>;
}

export default function WalletList() {
  const { loading, error, getWallets, createWallet } = useWallet();
  const [wallets, setWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const data = await getWallets();
      setWallets(data);
    } catch (err) {
      console.error('Failed to load wallets:', err);
    }
  };

  const handleCreateWallet = async () => {
    try {
      await createWallet();
      await loadWallets(); // Reload wallets after creating a new one
    } catch (err) {
      console.error('Failed to create wallet:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Wallets</h2>
        <button
          onClick={handleCreateWallet}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Wallet
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
          >
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Wallet Address
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {wallet.publicAddress}
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-gray-500">Balances</h4>
              <dl className="mt-2 grid grid-cols-1 gap-2">
                {wallet.balances.map((balance) => (
                  <div
                    key={balance.currencyId}
                    className="flex justify-between items-center"
                  >
                    <dt className="text-sm font-medium text-gray-500">
                      {balance.currencyId === 1
                        ? 'BTC'
                        : balance.currencyId === 2
                        ? 'ETH'
                        : 'SOL'}
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {balance.balance.toFixed(8)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 