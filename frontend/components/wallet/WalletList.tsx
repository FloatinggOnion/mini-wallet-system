'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useState } from 'react';
import CreateWalletModal from './CreateWalletModal';

export default function WalletList() {
  const { wallets, selectedWallet, selectWallet, loading, error } = useWallet();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (loading) {
    return <div className="text-center py-4">Loading wallets...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  if (wallets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No wallets found. Create a new wallet to get started.</p>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Wallet
        </button>
        <CreateWalletModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Wallets</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Wallet
        </button>
      </div>
      <div className="grid gap-4">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className={`p-4 rounded-lg border ${
              selectedWallet?.id === wallet.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300'
            } cursor-pointer transition-colors`}
            onClick={() => selectWallet(wallet.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">Wallet Address</h3>
                <p className="text-sm text-gray-600 break-all">{wallet.publicAddress}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">
                  Created: {new Date(wallet.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {wallet.network}
              </span>
            </div>
          </div>
        ))}
      </div>
      <CreateWalletModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
} 