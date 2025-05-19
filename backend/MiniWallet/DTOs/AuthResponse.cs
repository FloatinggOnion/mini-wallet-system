namespace MiniWallet.DTOs
{
    public class AuthResponse
    {
        public bool Successful { get; set; }
        public string[] Errors { get; set; } = Array.Empty<string>();
        public string Token { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
    }
}