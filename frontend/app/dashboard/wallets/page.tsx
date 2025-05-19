// app/(dashboard)/dashboard/wallets/[id]/page.tsx
"use client";

import React, { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";

export default function WalletPage() {
    const { wallet, loading, error, sendTransaction, transactions } = useWallet();
    const [toAddress, setToAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [sending, setSending] = useState(false);
    const [txError, setTxError] = useState<string | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wallet) return;

        setSending(true);
        setTxError(null);

        try {
            const txHash = await sendTransaction(
                toAddress,
                parseFloat(amount),
                1 // Ethereum currency ID
            );
            setToAddress("");
            setAmount("");
            alert(`Transaction sent! Hash: ${txHash}`);
        } catch (err) {
            setTxError(
                err instanceof Error
                    ? err.message
                    : "Failed to send transaction"
            );
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return <div className="p-4">Loading wallet...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>;
    }

    if (!wallet) {
        return <div className="p-4">No wallet found</div>;
    }

    const ethBalance = wallet.balances.find((b) => b.currencyId === 1);

    return (
        <div className="p-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-4">Your Wallet</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600 mb-2">Public Address</p>
                    <p className="font-mono bg-gray-100 p-2 rounded break-all">
                        {wallet.publicAddress}
                    </p>

                    {ethBalance && (
                        <div className="mt-4">
                            <p className="text-gray-600 mb-2">ETH Balance</p>
                            <p className="text-2xl font-bold">
                                {ethBalance.balance} ETH
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Send ETH</h2>
                <form
                    onSubmit={handleSend}
                    className="bg-white rounded-lg shadow p-6"
                >
                    <div className="mb-4">
                        <label className="block text-gray-600 mb-2">
                            To Address
                        </label>
                        <input
                            type="text"
                            value={toAddress}
                            onChange={(e) => setToAddress(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="0x..."
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-600 mb-2">
                            Amount (ETH)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-2 border rounded"
                            step="0.000000000000000001"
                            min="0"
                            required
                        />
                    </div>
                    {txError && <p className="text-red-500 mb-4">{txError}</p>}
                    <button
                        type="submit"
                        disabled={sending}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        {sending ? "Sending..." : "Send"}
                    </button>
                </form>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hash
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    From
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    To
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                        {tx.transactionHash.slice(0, 10)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                        {tx.fromAddress.slice(0, 10)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                        {tx.toAddress.slice(0, 10)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {tx.amount} ETH
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                tx.status === "Completed"
                                                    ? "bg-green-100 text-green-800"
                                                    : tx.status === "Pending"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(
                                            tx.createdAt
                                        ).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
