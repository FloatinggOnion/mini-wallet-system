using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MiniWallet.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace MiniWallet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WalletController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WalletController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Wallet>>> GetWallets()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var wallets = await _context.Wallets
                .Include(w => w.Balances)
                    .ThenInclude(b => b.Currency)
                .Where(w => w.UserId == userId)
                .ToListAsync();

            return Ok(wallets);
        }

        [HttpPost("connect")]
        public async Task<ActionResult<Wallet>> ConnectWallet([FromBody] ConnectWalletRequest request)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

            // Verify if the wallet address is valid (you might want to add more validation)
            if (string.IsNullOrEmpty(request.PublicAddress))
            {
                return BadRequest("Invalid wallet address");
            }

            // Check if wallet already exists for this user
            var existingWallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.UserId == userId && w.PublicAddress == request.PublicAddress);

            if (existingWallet != null)
            {
                return BadRequest("Wallet already connected");
            }

            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PublicAddress = request.PublicAddress,
                CreatedAt = DateTime.UtcNow
            };

            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync();

            return Ok(wallet);
        }

        [HttpGet("{walletId}/balance")]
        public async Task<ActionResult<IEnumerable<WalletBalance>>> GetWalletBalances(Guid walletId)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            
            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                    .ThenInclude(b => b.Currency)
                .FirstOrDefaultAsync(w => w.Id == walletId && w.UserId == userId);

            if (wallet == null)
            {
                return NotFound("Wallet not found");
            }

            return Ok(wallet.Balances);
        }
    }

    public class ConnectWalletRequest
    {
        public string PublicAddress { get; set; }
    }
} 