namespace MiniWallet.Models
{
    public class WalletRequestMessage
    {
        public required string WalletAddress { get; set; }
    }

    public class WalletVerifySignature
    {
        public required string WalletAddress { get; set; }
        public required string Signature { get; set; }
    }
} 