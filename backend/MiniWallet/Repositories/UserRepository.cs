using MiniWallet.Models;

public class UserRepository
{
    private readonly List<User> _users = new();
    public User? GetByEmail(string email) => _users.SingleOrDefault(u => u.Email == email);
    public void Add(User user) => _users.Add(user);
}