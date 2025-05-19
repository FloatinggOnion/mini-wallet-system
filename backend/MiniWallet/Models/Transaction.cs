using System;

namespace MiniWallet.Models
{
    public class Transaction
    {
        public Guid Id { get; set; }
        public Guid WalletId { get; set; }
        public string TransactionHash { get; set; }
        public string FromAddress { get; set; }
        public string ToAddress { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public decimal GasPrice { get; set; }
        public decimal GasUsed { get; set; }
        public string Status { get; set; } // Pending, Completed, Failed
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string BlockNumber { get; set; }
        public string ErrorMessage { get; set; }

        // Navigation properties
        public Wallet Wallet { get; set; }
    }
} 