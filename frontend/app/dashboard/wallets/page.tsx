// app/(dashboard)/dashboard/wallets/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { walletService } from '@/services/api';
import { useRouter } from 'next/navigation';

interface Currency {
  id: number;
  symbol: string;
  name: string;
  networkType: string;
}

interface WalletBalance {
  id: string;
  walletId: string;
  currencyId: number;
  balance: number;
  updatedAt: string;
  currency: Currency;
}

interface Transaction {
  id: string;
  walletId: string;
  currencyId: number;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  fee: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  currency: Currency;
}

interface Wallet {
  id: string;
  publicAddress: string;
  createdAt: string;
  balances: WalletBalance[];
  transactions: Transaction[];
}

export default function WalletDetailsPage({ params }: { params: { id: string } }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchWalletDetails = async () => {
      try {
        const walletData = await walletService.getWalletDetails(params.id);
        setWallet(walletData);
      } catch (err) {
        console.error('Error fetching wallet details:', err);
        setError('Failed to load wallet details');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletDetails();
  }, [params.id]);

  if (loading) {
    return <div className="flex justify-center p-12">Loading wallet details...</div>;
  }

  if (error) {
    return <div className="p-6 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  if (!wallet) {
    return <div className="p-6 bg-yellow-100 text-yellow-700 rounded-lg">Wallet not found</div>;
  }

  // Helper function to truncate address for display
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Wallet Details</h1>
          <p className="mt-1 text-gray-600">View and manage your wallet details</p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Back
        </button>
      </div>

      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Wallet Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Address and balance details.</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Public Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {wallet.publicAddress}
                <button
                  onClick={() => navigator.clipboard.writeText(wallet.publicAddress)}
                  className="ml-2 text-indigo-600 hover:text-indigo-800"
                >
                  Copy
                </button>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {new Date(wallet.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Balances</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {wallet.balances.map((balance) => (
            <div key={balance.id} className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <span className="text-lg font-bold text-white">{balance.currency.symbol}</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{balance.currency.name}</dt>
                      <dd className="text-lg font-semibold text-gray-900">{balance.balance}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Network: {balance.currency.networkType}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
        <div className="mt-4 overflow-hidden bg-white shadow sm:rounded-md">
          {wallet.transactions && wallet.transactions.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {wallet.transactions.map((transaction) => (
                <li key={transaction.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium text-indigo-600">
                        {transaction.transactionHash}
                      </p>
                      <div className="ml-2 flex flex-shrink-0">
                        <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                          ${transaction.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                            transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {transaction.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {transaction.amount} {transaction.currency.symbol}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-gray-500">From:</p>
                        <p className="text-sm">{truncateAddress(transaction.fromAddress)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">To:</p>
                        <p className="text-sm">{truncateAddress(transaction.toAddress)}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
              No transactions found for this wallet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}