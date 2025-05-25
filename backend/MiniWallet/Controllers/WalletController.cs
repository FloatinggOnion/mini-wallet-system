using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MiniWallet.Services;
using MiniWallet.Models;
using System.Security.Claims;
using System;
using System.Threading.Tasks;

namespace MiniWallet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WalletController : ControllerBase
    {
        private readonly IWalletService _walletService;
        private readonly IEthereumService _ethereumService;

        public WalletController(IWalletService walletService, IEthereumService ethereumService)
        {
            _walletService = walletService;
            _ethereumService = ethereumService;
        }

        [HttpGet]
        public async Task<IActionResult> GetWallets()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var wallets = await _walletService.GetWalletsByUserIdAsync(userId);
            return Ok(wallets);
        }

        [HttpPost]
        public async Task<IActionResult> CreateWallet([FromBody] CreateWalletRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var wallet = await _walletService.CreateWalletAsync(userId, request.Password);
                return Ok(wallet);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{walletId}")]
        public async Task<IActionResult> GetWallet(string walletId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var wallet = await _walletService.GetWalletByIdAsync(walletId);
                if (wallet.UserId != Guid.Parse(userId))
                    return Forbid();

                return Ok(wallet);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpGet("{walletId}/balance")]
        public async Task<IActionResult> GetBalance(string walletId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var wallet = await _walletService.GetWalletByIdAsync(walletId);
                if (wallet.UserId != Guid.Parse(userId))
                    return Forbid();

                try
                {
                var balance = await _walletService.GetBalanceAsync(walletId);
                return Ok(new { balance });
                }
                catch (Exception ex)
                {
                    // Log the error here
                    return StatusCode(500, new { error = "Failed to get wallet balance", details = ex.Message });
                }
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                // Log the error here
                return StatusCode(500, new { error = "An unexpected error occurred", details = ex.Message });
            }
        }

        [HttpPost("{walletId}/send")]
        public async Task<IActionResult> SendTransaction(string walletId, [FromBody] SendTransactionRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var wallet = await _walletService.GetWalletByIdAsync(walletId);
                if (wallet.UserId != Guid.Parse(userId))
                    return Forbid();

                var transaction = await _walletService.SendTransactionAsync(
                    walletId,
                    request.ToAddress,
                    request.Amount,
                    request.Password
                );

                return Ok(transaction);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{walletId}/transactions")]
        public async Task<IActionResult> GetTransactionHistory(string walletId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var wallet = await _walletService.GetWalletByIdAsync(walletId);
                if (wallet.UserId != Guid.Parse(userId))
                    return Forbid();

                var transactions = await _walletService.GetTransactionHistoryAsync(walletId);
                return Ok(transactions);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPost("{walletId}/fund")]
        public async Task<IActionResult> FundWallet(string walletId, [FromBody] FundWalletRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("No user ID found in claims");
                return Unauthorized();
            }
            Console.WriteLine($"Processing funding request for wallet {walletId} by user {userId}");

            try
            {
                var wallet = await _walletService.GetWalletByIdAsync(walletId);
                Console.WriteLine($"Found wallet with ID {wallet.Id}, owned by user {wallet.UserId}");
                
                if (wallet.UserId != Guid.Parse(userId))
                {
                    Console.WriteLine($"Wallet ownership mismatch: wallet belongs to {wallet.UserId}, but request is from {userId}");
                    return Forbid();
                }

                var transaction = await _ethereumService.RequestFundingAsync(walletId, request.Amount, request.Password);
                return Ok(transaction);
            }
            catch (KeyNotFoundException)
            {
                Console.WriteLine($"Wallet {walletId} not found");
                return NotFound();
            }
            catch (UnauthorizedAccessException ex)
            {
                Console.WriteLine($"Unauthorized access: {ex.Message}");
                return Unauthorized(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                Console.WriteLine($"Invalid argument: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                Console.WriteLine($"Invalid operation: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = "Failed to fund wallet", details = ex.Message });
            }
        }
    }

    public class CreateWalletRequest
    {
        public required string Password { get; set; }
    }

    public class SendTransactionRequest
    {
        public required string ToAddress { get; set; }
        public decimal Amount { get; set; }
        public required string Password { get; set; }
    }

    public class FundWalletRequest
    {
        public decimal Amount { get; set; }
        public required string Password { get; set; }
    }
}