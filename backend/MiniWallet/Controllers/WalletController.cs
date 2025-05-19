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

        public WalletController(IWalletService walletService)
        {
            _walletService = walletService;
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

                var balance = await _walletService.GetBalanceAsync(walletId);
                return Ok(new { balance });
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
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
}