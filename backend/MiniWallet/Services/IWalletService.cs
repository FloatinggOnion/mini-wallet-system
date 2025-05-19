using MiniWallet.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MiniWallet.Services
{
    public interface IWalletService
    {
        Task<IEnumerable<Wallet>> GetWalletsByUserIdAsync(string userId);
        Task<Wallet> CreateWalletAsync(string userId, string password);
        Task<Wallet> GetWalletByIdAsync(string walletId);
        Task<Transaction> SendTransactionAsync(string walletId, string toAddress, decimal amount, string password);
        Task<decimal> GetBalanceAsync(string walletId);
        Task<IEnumerable<Transaction>> GetTransactionHistoryAsync(string walletId);
    }
} 