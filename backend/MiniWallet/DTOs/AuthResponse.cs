public class AuthResponse
{
    public bool Successful { get; set; }
    public string[] Errors { get; set; }
    public string Token { get; set; }
    public Guid UserId { get; set; }
}