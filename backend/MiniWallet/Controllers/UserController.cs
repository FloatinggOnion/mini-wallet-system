using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MiniWallet.Models;
using MiniWallet.Services;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using Microsoft.EntityFrameworkCore;

namespace MiniWallet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPriceService _priceService;

        public UserController(AppDbContext context, IPriceService priceService)
        {
            _context = context;
            _priceService = priceService;
        }

        [HttpGet("profile")]
        public async Task<ActionResult<UserProfileResponse>> GetProfile()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            
            var user = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.Wallets)
                    .ThenInclude(w => w.Balances)
                        .ThenInclude(b => b.Currency)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found");
            }

            var portfolioValue = await _priceService.GetTotalPortfolioValueAsync(userId);
            var ethPrice = await _priceService.GetEthPriceInUsdAsync();

            var profile = new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.Profile?.FirstName,
                LastName = user.Profile?.LastName,
                PhoneNumber = user.Profile?.PhoneNumber,
                Address = user.Profile?.Address,
                Image = user.Profile?.Image,
                CreatedAt = user.CreatedAt,
                PortfolioValue = portfolioValue,
                PortfolioBreakdown = user.Wallets
                    .Where(w => w.IsActive)
                    .SelectMany(w => w.Balances)
                    .GroupBy(b => b.Currency.Symbol)
                    .Select(g => new PortfolioAsset
                    {
                        Symbol = g.Key,
                        Amount = g.Sum(b => b.Balance),
                        ValueInUsd = g.Key == "ETH" ? g.Sum(b => b.Balance * ethPrice) : 0 // Add other currencies as needed
                    })
                    .ToList()
            };

            return Ok(profile);
        }

        [HttpPut("profile")]
        public async Task<ActionResult<UserProfileResponse>> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            
            var user = await _context.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found");
            }

            if (user.Profile == null)
            {
                user.Profile = new UserProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber,
                    Address = request.Address,
                    User = user
                };
            }
            else
            {
                user.Profile.FirstName = request.FirstName;
                user.Profile.LastName = request.LastName;
                user.Profile.PhoneNumber = request.PhoneNumber;
                user.Profile.Address = request.Address;
                user.Profile.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Return updated profile with portfolio data
            return await GetProfile();
        }
    }

    public class UserProfileResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string Image { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal PortfolioValue { get; set; }
        public List<PortfolioAsset> PortfolioBreakdown { get; set; }
    }

    public class PortfolioAsset
    {
        public string Symbol { get; set; }
        public decimal Amount { get; set; }
        public decimal ValueInUsd { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
    }
} 