using MiniWallet.Models;

namespace MiniWallet.Models {
    public class User
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public UserProfile Profile { get; set; }
        public ICollection<Wallet> Wallets { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? LastLogin { get; set; }
        public bool IsActive { get; set; }
    }

    public class UserProfile
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? Image { get; set; }
        public User User { get; set; }
    }
}