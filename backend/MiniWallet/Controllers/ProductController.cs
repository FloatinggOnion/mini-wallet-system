using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace MiniWallet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        [Authorize]
        [HttpGet]
        public IActionResult GetProducts()
        {
            // Replace this with actual data retrieval logic
            var products = new[]
            {
                new { Id = 1, Name = "Laptop", Price = 1200 },
                new { Id = 2, Name = "Phone", Price = 800 },
                new { Id = 3, Name = "Tablet", Price = 600 }
            };

            return Ok(products);
        }
    }
}