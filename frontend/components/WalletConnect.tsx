import React from 'react';
import { useWeb3 } from '@/contexts/Web3Context';

export function WalletConnect() {
  const { isConnected, address, connectWallet, disconnectWallet, error } = useWeb3();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <div className="w-full max-w-md p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      {!isConnected ? (
        <button
          onClick={connectWallet}
          className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Connected</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono">{formatAddress(address!)}</span>
            <button
              onClick={disconnectWallet}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 