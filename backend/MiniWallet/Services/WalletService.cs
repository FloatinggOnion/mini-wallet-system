using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using MiniWallet.Models;

namespace MiniWallet.Services
{
    public class WalletService : IWalletService
    {
        private readonly AppDbContext _context;
        private readonly IEthereumService _ethereumService;

        public WalletService(AppDbContext context, IEthereumService ethereumService)
        {
            _context = context;
            _ethereumService = ethereumService;
        }

        public async Task<IEnumerable<Wallet>> GetWalletsByUserIdAsync(string userId)
        {
            return await _context.Wallets
                .Include(w => w.Balances)
                .Include(w => w.Transactions)
                .Where(w => w.UserId == Guid.Parse(userId))
                .ToListAsync();
        }

        public async Task<Wallet> CreateWalletAsync(string userId, string password)
        {
            var userGuid = Guid.Parse(userId);
            var user = await _context.Users.FindAsync(userGuid);
            if (user == null)
                throw new KeyNotFoundException($"User with ID {userId} not found.");

            var (address, privateKey) = await _ethereumService.GenerateWalletAsync();
            var encryptedKey = _ethereumService.EncryptPrivateKey(privateKey, password);

            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userGuid,
                PublicAddress = address,
                EncryptedPrivateKey = encryptedKey,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true,
                Network = "mainnet",
                User = user
            };

            await _context.Wallets.AddAsync(wallet);
            await _context.SaveChangesAsync();
            return wallet;
        }

        public async Task<Wallet> GetWalletByIdAsync(string walletId)
        {
            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .Include(w => w.Transactions)
                .FirstOrDefaultAsync(w => w.Id.ToString() == walletId);

            if (wallet == null)
                throw new KeyNotFoundException($"Wallet with ID {walletId} not found.");

            return wallet;
        }

        public async Task<Transaction> SendTransactionAsync(string walletId, string toAddress, decimal amount, string password)
        {
            var wallet = await GetWalletByIdAsync(walletId);
            var privateKey = _ethereumService.DecryptPrivateKey(wallet.EncryptedPrivateKey, password, wallet.Salt, wallet.IV);

            var transactionHash = await _ethereumService.SendTransactionAsync(
                wallet.PublicAddress,
                toAddress,
                amount,
                privateKey
            );

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                TransactionHash = transactionHash,
                FromAddress = wallet.PublicAddress,
                ToAddress = toAddress,
                Amount = amount,
                Currency = "ETH",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            await _context.Transactions.AddAsync(transaction);
            await _context.SaveChangesAsync();

            return transaction;
        }

        public async Task<decimal> GetBalanceAsync(string walletId)
        {
            var wallet = await GetWalletByIdAsync(walletId);
            return await _ethereumService.GetBalanceAsync(wallet.PublicAddress);
        }

        public async Task<IEnumerable<Transaction>> GetTransactionHistoryAsync(string walletId)
        {
            return await _context.Transactions
                .Where(t => t.WalletId == Guid.Parse(walletId))
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }
    }
}