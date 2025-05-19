import { useState } from 'react';
import { walletService } from '@/services/api';
import { toast } from 'react-hot-toast';

interface FundWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletId: string;
    onSuccess?: () => void;
}

export default function FundWalletModal({ isOpen, onClose, walletId, onSuccess }: FundWalletModalProps) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            setLoading(true);
            // Convert to decimal with 18 decimal places (standard for ETH)
            const decimalAmount = parseFloat(amount).toFixed(18);
            await walletService.fundWallet(walletId, Number(decimalAmount));
            toast.success('Wallet funded successfully');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Error funding wallet:', error);
            toast.error(error.response?.data?.error || 'Failed to fund wallet');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-semibold mb-4">Fund Wallet</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                            Amount (ETH)
                        </label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter amount"
                            step="0.000000000000000001"
                            min="0"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Funding...' : 'Fund Wallet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 