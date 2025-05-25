'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { formatEther } from 'ethers';
import { api } from '@/services/api';
import { etherscanService } from '@/services/etherscan';

interface PortfolioAsset {
  symbol: string;
  amount: number;
  valueInUsd: number;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  image: string;
  createdAt: string;
}

interface PortfolioData {
  totalValue: number;
  assets: PortfolioAsset[];
  history: {
    date: string;
    value: number;
  }[];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { selectedWallet, wallets } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: ''
  });

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get<UserProfile>('/user/profile');
      const data = response.data;
      setProfile(data);
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address || ''
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPortfolioData = useCallback(async () => {
    if (!selectedWallet?.publicAddress) return;

    try {
      // Get all transactions for the selected wallet
      const transactions = await etherscanService.getTransactions(selectedWallet.publicAddress);
      
      // Calculate portfolio value and history
      const ethPrice = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
        .then(res => res.json())
        .then(data => data.ethereum.usd);

      // Calculate total ETH balance
      const totalEth = transactions.reduce((acc, tx) => {
        const value = parseFloat(formatEther(tx.value));
        if (tx.to.toLowerCase() === selectedWallet.publicAddress.toLowerCase()) {
          return acc + value;
        } else if (tx.from.toLowerCase() === selectedWallet.publicAddress.toLowerCase()) {
          return acc - value;
        }
        return acc;
      }, 0);

      // Create portfolio assets
      const assets: PortfolioAsset[] = [{
        symbol: 'ETH',
        amount: totalEth,
        valueInUsd: totalEth * ethPrice
      }];

      // Create portfolio history (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const history = transactions
        .filter(tx => new Date(parseInt(tx.timeStamp) * 1000) >= thirtyDaysAgo)
        .sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp))
        .reduce((acc: { date: string; value: number }[], tx) => {
          const date = new Date(parseInt(tx.timeStamp) * 1000).toISOString().split('T')[0];
          const value = parseFloat(formatEther(tx.value));
          const lastValue = acc.length > 0 ? acc[acc.length - 1].value : 0;
          
          let newValue = lastValue;
          if (tx.to.toLowerCase() === selectedWallet.publicAddress.toLowerCase()) {
            newValue += value;
          } else if (tx.from.toLowerCase() === selectedWallet.publicAddress.toLowerCase()) {
            newValue -= value;
          }

          // Only add if the date is different from the last entry
          if (acc.length === 0 || acc[acc.length - 1].date !== date) {
            acc.push({ date, value: newValue * ethPrice });
          } else {
            acc[acc.length - 1].value = newValue * ethPrice;
          }
          
          return acc;
        }, []);

      setPortfolioData({
        totalValue: totalEth * ethPrice,
        assets,
        history
      });
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError('Failed to fetch portfolio data');
    }
  }, [selectedWallet?.publicAddress]);

  useEffect(() => {
    fetchProfile();
    // Refresh profile data every 5 minutes
    const interval = setInterval(fetchProfile, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchProfile]);

  useEffect(() => {
    fetchPortfolioData();
    // Refresh portfolio data every minute
    const interval = setInterval(fetchPortfolioData, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPortfolioData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.put<UserProfile>('/user/profile', formData);
      const updatedProfile = response.data;
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !profile) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error && !profile) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">First Name</p>
                    <p>{profile.firstName || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Name</p>
                    <p>{profile.lastName || 'Not set'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p>{profile.phoneNumber || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p>{profile.address || 'Not set'}</p>
                </div>
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Portfolio Value</p>
                <p className="text-2xl font-bold">
                  {portfolioData ? formatCurrency(portfolioData.totalValue) : 'Loading...'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Asset Breakdown</p>
                <div className="space-y-2">
                  {portfolioData?.assets.map((asset) => (
                    <div key={asset.symbol} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{asset.symbol}</p>
                        <p className="text-sm text-gray-500">{asset.amount.toFixed(6)}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(asset.valueInUsd)}</p>
                    </div>
                  ))}
                  {!portfolioData && <p className="text-gray-500">Loading assets...</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Value Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value History (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {portfolioData?.history && portfolioData.history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={portfolioData.history}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                {portfolioData ? 'No transaction history available' : 'Loading chart...'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 