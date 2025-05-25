// app/(dashboard)/dashboard/wallets/[id]/page.tsx
"use client";

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import CreateWalletModal from '@/components/wallet/CreateWalletModal';
import TransferModal from '@/components/wallet/TransferModal';
import { toast } from 'react-hot-toast';

export default function WalletsPage() {
    const { wallets, selectedWallet, transactions, balance, selectWallet, loading, error } = useWallet();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-red-500">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Your Wallets</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Create New Wallet
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Wallet List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Wallet List</h2>
                        {wallets.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 mb-4">No wallets found</p>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="text-indigo-600 hover:text-indigo-800"
                                >
                                    Create your first wallet
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {wallets.map((wallet) => (
                                    <div
                                        key={wallet.id}
                                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                            selectedWallet?.id === wallet.id
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-indigo-300'
                                        }`}
                                        onClick={() => selectWallet(wallet.id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Wallet {wallet.id.slice(0, 6)}
                                                </p>
                                                <p className="text-sm text-gray-500 font-mono mt-1">
                                                    {wallet.publicAddress.slice(0, 6)}...
                                                    {wallet.publicAddress.slice(-4)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900">
                                                    {selectedWallet?.id === wallet.id ? `${balance} ETH` : '...'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Wallet Details */}
                <div className="lg:col-span-2">
                    {selectedWallet ? (
                        <div className="space-y-6">
                            {/* Wallet Overview */}
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">
                                            Wallet {selectedWallet.id.slice(0, 6)}
                                        </h2>
                                        <p className="text-gray-500 font-mono break-all">
                                            {selectedWallet.publicAddress}
                                        </p>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => setIsTransferModalOpen(true)}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            Send ETH
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-gray-500 mb-1">ETH Balance</h3>
                                        <p className="text-2xl font-bold">
                                            {balance} ETH
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                                        <p className="text-lg">
                                            {new Date(selectedWallet.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction History */}
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hash</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(tx.createdAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            tx.fromAddress === selectedWallet.publicAddress
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {tx.fromAddress === selectedWallet.publicAddress ? 'Sent' : 'Received'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                        {tx.amount} ETH
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            tx.status === 'Completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : tx.status === 'Pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <a
                                                            href={`https://etherscan.io/tx/${tx.transactionHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-600 hover:text-indigo-900 font-mono"
                                                        >
                                                            {tx.transactionHash.slice(0, 8)}...{tx.transactionHash.slice(-6)}
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                            {transactions.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                        No transactions found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                            <h2 className="text-xl font-semibold mb-4">No Wallet Selected</h2>
                            <p className="text-gray-500 mb-6">
                                Select a wallet from the list or create a new one to get started
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Create New Wallet
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CreateWalletModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
            {selectedWallet && (
                <TransferModal
                    isOpen={isTransferModalOpen}
                    onClose={() => setIsTransferModalOpen(false)}
                    walletId={selectedWallet.id}
                    onSuccess={() => {
                        // Refresh wallet data after successful transfer
                        selectWallet(selectedWallet.id);
                    }}
                />
            )}
        </div>
    );
}
