using MiniWallet.Models;

namespace MiniWallet.Repositories
{
    public interface IWalletRepository
    {
        Task<Wallet> GetByIdAsync(Guid id);
        Task<IEnumerable<Wallet>> GetByUserIdAsync(Guid userId);
        Task<Wallet> CreateAsync(Wallet wallet);
        Task<Wallet> UpdateAsync(Wallet wallet);
        Task<bool> DeleteAsync(Guid id);
        Task<WalletBalance> GetBalanceAsync(Guid walletId, int currencyId);
        Task<IEnumerable<Transaction>> GetTransactionsAsync(Guid walletId);
    }
} 