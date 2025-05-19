'use client';

import { useWallet } from '@/contexts/WalletContext';
import CreateWallet from '@/components/wallet/CreateWallet';
import WalletList from '@/components/wallet/WalletList';
import SendTransaction from '@/components/wallet/SendTransaction';
import TransactionHistory from '@/components/wallet/TransactionHistory';

export default function WalletsPage() {
  const { selectedWallet, balance, loading } = useWallet();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
          <CreateWallet />
          <WalletList />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          {selectedWallet && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Wallet Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-sm font-medium break-all">{selectedWallet.publicAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="text-sm font-medium">
                    {loading ? 'Loading...' : `${balance} ETH`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedWallet && <SendTransaction />}
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
} 