using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MiniWallet.Models;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace MiniWallet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CurrenciesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CurrenciesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCurrencies()
        {
            var currencies = await _context.Currencies
                .Where(c => c.IsActive)
                .Select(c => new
                {
                    c.Id,
                    c.Symbol,
                    c.Name,
                    c.NetworkType
                })
                .ToListAsync();

            return Ok(currencies);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCurrency(int id)
        {
            var currency = await _context.Currencies
                .Where(c => c.Id == id && c.IsActive)
                .Select(c => new
                {
                    c.Id,
                    c.Symbol,
                    c.Name,
                    c.NetworkType
                })
                .FirstOrDefaultAsync();

            if (currency == null)
                return NotFound();

            return Ok(currency);
        }
    }
} 