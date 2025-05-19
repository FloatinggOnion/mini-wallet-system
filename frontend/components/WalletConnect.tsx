'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';

export function WalletConnect() {
    const { createWallet, loading: isConnecting } = useWallet();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleCreateWallet = async () => {
        try {
            setError(null);
            await createWallet();
            // Refresh the page to show the new wallet
            router.refresh();
        } catch (err) {
            console.error('Error creating wallet:', err);
            setError(err instanceof Error ? err.message : 'Failed to create wallet');
        }
    };

    return (
        <div className="text-center">
            <button
                onClick={handleCreateWallet}
                disabled={isConnecting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
                {isConnecting ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Wallet...
                    </>
                ) : (
                    'Create New Wallet'
                )}
            </button>
            {error && (
                <p className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
} 