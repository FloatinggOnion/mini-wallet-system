using Microsoft.EntityFrameworkCore;
using MiniWallet.Models;

namespace MiniWallet.Data
{
    public static class SeedData
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using var context = new AppDbContext(
                serviceProvider.GetRequiredService<DbContextOptions<AppDbContext>>());

            // Add currencies if they don't exist
            if (!context.Currencies.Any())
            {
                context.Currencies.AddRange(
                    new Currency
                    {
                        Id = 1,
                        Symbol = "ETH",
                        Name = "Ethereum",
                        NetworkType = "Ethereum",
                        IsActive = true
                    },
                    new Currency
                    {
                        Id = 2,
                        Symbol = "BTC",
                        Name = "Bitcoin",
                        NetworkType = "Bitcoin",
                        IsActive = true
                    }
                );
                context.SaveChanges();
            }
        }
    }
} 