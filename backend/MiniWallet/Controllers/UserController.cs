using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MiniWallet.Models;
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

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("profile")]
        public async Task<ActionResult<UserProfileResponse>> GetProfile()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            
            var user = await _context.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found");
            }

            var profile = new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.Profile?.FirstName,
                LastName = user.Profile?.LastName,
                CreatedAt = user.CreatedAt
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
                    LastName = request.LastName
                };
            }
            else
            {
                user.Profile.FirstName = request.FirstName;
                user.Profile.LastName = request.LastName;
            }

            await _context.SaveChangesAsync();

            var profile = new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.Profile.FirstName,
                LastName = user.Profile.LastName,
                CreatedAt = user.CreatedAt
            };

            return Ok(profile);
        }
    }

    public class UserProfileResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
    }
} 