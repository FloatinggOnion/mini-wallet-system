'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { etherscanService } from '@/services/etherscan';
import { formatEther } from 'ethers';

interface EtherscanTransaction {
    blockHash: string;
    blockNumber: string;
    confirmations: string;
    contractAddress: string;
    cumulativeGasUsed: string;
    from: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    hash: string;
    input: string;
    isError: string;
    nonce: string;
    timeStamp: string;
    to: string;
    transactionIndex: string;
    value: string;
}

export default function TransactionsPage() {
    const router = useRouter();
    const { selectedWallet, error: walletError } = useWallet();
    const [transactions, setTransactions] = useState<EtherscanTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        if (!selectedWallet?.publicAddress) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const data = await etherscanService.getTransactions(selectedWallet.publicAddress);
            setTransactions(data);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setIsLoading(false);
        }
    }, [selectedWallet?.publicAddress]);

    useEffect(() => {
        fetchTransactions();

        // Start polling for new transactions
        if (selectedWallet?.publicAddress) {
            const cleanup = etherscanService.startPolling(
                selectedWallet.publicAddress,
                (newTransactions) => {
                    setTransactions(prev => {
                        // Merge new transactions with existing ones, avoiding duplicates
                        const existingHashes = new Set(prev.map(tx => tx.hash));
                        const uniqueNewTransactions = newTransactions.filter(
                            tx => !existingHashes.has(tx.hash)
                        );
                        return [...uniqueNewTransactions, ...prev];
                    });
                }
            );

            return cleanup;
        }
    }, [selectedWallet?.publicAddress, fetchTransactions]);

    if (!selectedWallet) {
        return (
            <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Wallet Selected</h2>
                        <p className="text-gray-600 mb-8">Please select a wallet to view transactions.</p>
                        <button
                            onClick={() => router.push('/dashboard/wallets')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Select Wallet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-lg text-gray-600">Loading transactions...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || walletError) {
        return (
            <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                        <p className="text-gray-600 mb-8">{error || walletError}</p>
                        <button
                            onClick={() => router.refresh()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
                    <p className="mt-2 text-gray-600">View all your wallet transactions</p>
                </div>

                {transactions.length === 0 ? (
                    <div className="bg-white shadow rounded-lg p-6 text-center">
                        <p className="text-gray-600">No transactions found</p>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (ETH)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From/To</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hash</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.map((tx) => (
                                        <tr key={tx.hash} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(parseInt(tx.timeStamp) * 1000).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {tx.from.toLowerCase() === selectedWallet.publicAddress.toLowerCase() ? 'Sent' : 'Received'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatEther(tx.value)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {tx.from.toLowerCase() === selectedWallet.publicAddress.toLowerCase() ? tx.to : tx.from}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    tx.isError === '0' ? 'bg-green-100 text-green-800' :
                                                    tx.isError === '1' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {tx.isError === '0' ? 'Success' : 'Failed'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <a 
                                                    href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 