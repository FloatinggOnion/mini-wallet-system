namespace MiniWallet.Models
{
    public class TransferRequest
    {
        public required string ToAddress { get; set; }
        public decimal Amount { get; set; }
    }
} 