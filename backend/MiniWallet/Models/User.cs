using System;
using System.Collections.Generic;

namespace MiniWallet.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public string? PasswordHash { get; set; }
        public UserProfile? Profile { get; set; }
        public ICollection<Wallet> Wallets { get; set; } = new List<Wallet>();
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? LastLogin { get; set; }
        public bool IsActive { get; set; }
    }
}