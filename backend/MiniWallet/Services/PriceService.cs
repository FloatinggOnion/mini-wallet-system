using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MiniWallet.Models;
using Microsoft.EntityFrameworkCore;

namespace MiniWallet.Services
{
    public interface IPriceService
    {
        Task<decimal> GetEthPriceInUsdAsync();
        Task<decimal> GetTotalPortfolioValueAsync(Guid userId);
    }

    public class PriceService : IPriceService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<PriceService> _logger;
        private readonly AppDbContext _context;
        private const string COINGECKO_API = "https://api.coingecko.com/api/v3";
        private const int CACHE_DURATION_MINUTES = 5;

        public PriceService(
            HttpClient httpClient,
            IMemoryCache cache,
            ILogger<PriceService> logger,
            AppDbContext context)
        {
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
            _context = context;
        }

        public async Task<decimal> GetEthPriceInUsdAsync()
        {
            const string cacheKey = "eth_usd_price";
            
            if (_cache.TryGetValue(cacheKey, out decimal cachedPrice))
            {
                return cachedPrice;
            }

            try
            {
                var response = await _httpClient.GetAsync($"{COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd");
                response.EnsureSuccessStatusCode();
                
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<JsonElement>(content);
                var price = result.GetProperty("ethereum").GetProperty("usd").GetDecimal();

                // Cache the price for 5 minutes
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(CACHE_DURATION_MINUTES));
                _cache.Set(cacheKey, price, cacheOptions);

                return price;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching ETH price from CoinGecko");
                throw;
            }
        }

        public async Task<decimal> GetTotalPortfolioValueAsync(Guid userId)
        {
            try
            {
                // Get all wallet balances for the user
                var wallets = await _context.Wallets
                    .Include(w => w.Balances)
                        .ThenInclude(b => b.Currency)
                    .Where(w => w.UserId == userId && w.IsActive)
                    .ToListAsync();

                var ethPrice = await GetEthPriceInUsdAsync();
                decimal totalValue = 0;

                foreach (var wallet in wallets)
                {
                    foreach (var balance in wallet.Balances)
                    {
                        if (balance.Currency.Symbol == "ETH")
                        {
                            totalValue += balance.Balance * ethPrice;
                        }
                        // Add other currencies here as needed
                    }
                }

                return totalValue;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating total portfolio value for user {UserId}", userId);
                throw;
            }
        }
    }
} 