using MiniWallet.Models;
using Microsoft.EntityFrameworkCore; // Add this for AnyAsync, Include, ToListAsync
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt; // Add this for JWT functionality
using Microsoft.IdentityModel.Tokens; // Add this for SymmetricSecurityKey, SigningCredentials
using System.Security.Claims; // Add this for Claims
using System.Text; // Add this for Encoding
using Microsoft.AspNetCore.Identity; // Add this for IPasswordHasher

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest model);
    Task<AuthResponse> LoginAsync(LoginRequest model);
    Task LogoutAsync(string userId);
}

namespace MiniWallet.Services{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IPasswordHasher<User> _passwordHasher;

        public AuthService(AppDbContext context, IConfiguration configuration, IPasswordHasher<User> passwordHasher)
        {
            _context = context;
            _configuration = configuration;
            _passwordHasher = passwordHasher;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest model)
        {
            if (await _context.Users.AnyAsync(u => u.Email == model.Email))
            {
                return new AuthResponse { Successful = false, Errors = new[] { "User with this email already exists" } };
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = model.Email,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, model.Password);

            var profile = new UserProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                FirstName = model.FirstName,
                LastName = model.LastName
            };

            user.Profile = profile;

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Create default wallet for user
            await CreateWalletForUser(user.Id);

            var token = GenerateJwtToken(user);

            return new AuthResponse
            {
                Successful = true,
                Token = token,
                UserId = user.Id
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest model)
        {
            var user = await _context.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null)
            {
                return new AuthResponse { Successful = false, Errors = new[] { "Invalid email or password" } };
            }

            var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, model.Password);

            if (verificationResult == PasswordVerificationResult.Failed)
            {
                return new AuthResponse { Successful = false, Errors = new[] { "Invalid email or password" } };
            }

            var token = GenerateJwtToken(user);

            return new AuthResponse
            {
                Successful = true,
                Token = token,
                UserId = user.Id
            };
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.Now.AddDays(Convert.ToDouble(_configuration["JWT:ExpireDays"]));

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:Issuer"],
                audience: _configuration["JWT:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<Wallet> CreateWalletForUser(Guid userId)
        {
            // In a real implementation, this would generate a secure wallet with a proper private key
            // For demo purposes, we're just creating a placeholder wallet
            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PublicAddress = "0x" + Guid.NewGuid().ToString("N"),
                EncryptedPrivateKey = "encrypted_key_placeholder",
                CreatedAt = DateTime.UtcNow
            };

            await _context.Wallets.AddAsync(wallet);
            
            // Initialize balances for all active currencies
            var currencies = await _context.Currencies.Where(c => c.IsActive).ToListAsync();
            foreach (var currency in currencies)
            {
                var balance = new WalletBalance
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    CurrencyId = currency.Id,
                    Balance = 0,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.WalletBalances.AddAsync(balance);
            }

            await _context.SaveChangesAsync();
            return wallet;
        }

        public async Task LogoutAsync(string userId)
        {
            // In a real implementation, you might want to:
            // 1. Add the token to a blacklist
            // 2. Update the user's last logout time
            // 3. Clear any session data
            
            var user = await _context.Users.FindAsync(Guid.Parse(userId));
            if (user != null)
            {
                user.LastLogin = null;
                await _context.SaveChangesAsync();
            }
        }
    }
}