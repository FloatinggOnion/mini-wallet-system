import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import toast from 'react-hot-toast';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
  onSuccess: () => void;
}

export default function TransferModal({
  isOpen,
  onClose,
  walletId,
  onSuccess,
}: TransferModalProps) {
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const { loading, error, transferFunds } = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transferFunds(walletId, toAddress, parseFloat(amount), 1); // Always use ETH (currencyId: 1)
      toast.success('Transfer initiated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to transfer funds');
      console.error('Transfer error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Transfer ETH</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              To Address
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="0x..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount (ETH)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="0.0"
              step="0.00000001"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Transferring...' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 