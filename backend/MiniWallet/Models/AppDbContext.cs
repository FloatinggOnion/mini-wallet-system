using Microsoft.EntityFrameworkCore;

namespace MiniWallet.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<Currency> Currencies { get; set; }
        public DbSet<WalletBalance> WalletBalances { get; set; }
        public DbSet<Transaction> Transactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // relationships and constraints
            modelBuilder.Entity<User>()
                .HasOne(u => u.Profile)
                .WithOne(p => p.User)
                .HasForeignKey<UserProfile>(p => p.UserId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Wallets)
                .WithOne(w => w.User)
                .HasForeignKey(w => w.UserId);

            modelBuilder.Entity<Wallet>()
                .HasMany(w => w.Balances)
                .WithOne(b => b.Wallet)
                .HasForeignKey(b => b.WalletId);

            modelBuilder.Entity<Currency>()
                .HasMany(c => c.WalletBalances)
                .WithOne(wb => wb.Currency)
                .HasForeignKey(wb => wb.CurrencyId);

            // Seed initial cryptocurrency data
            modelBuilder.Entity<Currency>().HasData(
                new Currency { Id = 1, Symbol = "ETH", Name = "Ethereum", NetworkType = "Ethereum", IsActive = true }
            );
        }
    }
}