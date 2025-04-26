using Microsoft.EntityFrameworkCore;
using MiniWallet.Models;

namespace MiniWallet.Repositories
{
    public class WalletRepository : IWalletRepository
    {
        private readonly AppDbContext _context;

        public WalletRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Wallet> GetByIdAsync(Guid id)
        {
            return await _context.Wallets
                .Include(w => w.Balances)
                .Include(w => w.Transactions)
                .FirstOrDefaultAsync(w => w.Id == id);
        }

        public async Task<IEnumerable<Wallet>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Wallets
                .Include(w => w.Balances)
                .Include(w => w.Transactions)
                .Where(w => w.UserId == userId)
                .ToListAsync();
        }

        public async Task<Wallet> CreateAsync(Wallet wallet)
        {
            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync();
            return wallet;
        }

        public async Task<Wallet> UpdateAsync(Wallet wallet)
        {
            _context.Entry(wallet).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return wallet;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var wallet = await _context.Wallets.FindAsync(id);
            if (wallet == null) return false;

            _context.Wallets.Remove(wallet);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<WalletBalance> GetBalanceAsync(Guid walletId, int currencyId)
        {
            return await _context.WalletBalances
                .FirstOrDefaultAsync(wb => wb.WalletId == walletId && wb.CurrencyId == currencyId);
        }

        public async Task<IEnumerable<Transaction>> GetTransactionsAsync(Guid walletId)
        {
            return await _context.Transactions
                .Include(t => t.Currency)
                .Where(t => t.WalletId == walletId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }
    }
} 