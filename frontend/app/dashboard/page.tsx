// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { walletService, currencyService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { WalletConnect } from '@/components/WalletConnect';

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

interface Wallet {
    id: string;
    publicAddress: string;
    createdAt: string;
    balances: WalletBalance[];
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [walletsData, currenciesData] = await Promise.all([
                    walletService.getWallets(),
                    currencyService.getAllCurrencies(),
                ]);
                setWallets(walletsData);
                setCurrencies(currenciesData);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                Loading dashboard data...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-100 text-red-700 rounded-lg">
                {error}
            </div>
        );
    }

    if (wallets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        Welcome to Your Crypto Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Connect your wallet to get started
                    </p>
                </div>
                <WalletConnect />
            </div>
        );
    }

    // Calculate total balance in USD (in a real app, this would use real exchange rates)
    const getTotalBalanceInUSD = (wallet: Wallet) => {
        return wallet.balances.reduce((total, balance) => {
            // Mock exchange rates (in a real app, these would come from an API)
            const exchangeRates: Record<string, number> = {
                BTC: 50000,
                ETH: 3000,
                // Add more currencies as needed
            };

            const currency = currencies.find(
                (c) => c.id === balance.currencyId
            );
            const rate = currency ? exchangeRates[currency.symbol] || 0 : 0;

            return total + balance.balance * rate;
        }, 0);
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Welcome, {user?.profile?.firstName}!
                </h1>
                <p className="mt-1 text-gray-600">
                    Here's an overview of your crypto wallets.
                </p>
            </div>

            <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                <svg
                                    className="h-6 w-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Balance (USD)
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {wallets.length > 0
                                            ? `$${getTotalBalanceInUSD(
                                                  wallets[0]
                                              ).toLocaleString()}`
                                            : "$0.00"}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                <svg
                                    className="h-6 w-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Wallets
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {wallets.length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                <svg
                                    className="h-6 w-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                    />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Currencies
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {currencies.length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">
                    Your Wallets
                </h2>
                <div className="mt-4 overflow-hidden bg-white shadow sm:rounded-md">
                    {wallets.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {wallets.map((wallet) => (
                                <li key={wallet.id}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="truncate text-sm font-medium text-indigo-600">
                                                Wallet Address:{" "}
                                                {wallet.publicAddress}
                                            </p>
                                            <div className="ml-2 flex flex-shrink-0">
                                                <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                                    Active
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    Created on{" "}
                                                    {new Date(
                                                        wallet.createdAt
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    $
                                                    {getTotalBalanceInUSD(
                                                        wallet
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {wallet.balances.map((balance) => {
                                                const currency =
                                                    currencies.find(
                                                        (c) =>
                                                            c.id ===
                                                            balance.currencyId
                                                    );
                                                return (
                                                    <div
                                                        key={balance.id}
                                                        className="flex items-center rounded-md bg-gray-50 px-3 py-2"
                                                    >
                                                        <span className="text-xs font-medium text-gray-500">
                                                            {currency?.symbol}:
                                                        </span>
                                                        <span className="ml-2 text-sm font-medium">
                                                            {balance.balance}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                            No wallets found. Click "Create Wallet" to get
                            started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
