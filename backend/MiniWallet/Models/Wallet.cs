using System;
using System.Collections.Generic;

namespace MiniWallet.Models
{
    public class Wallet
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string PublicAddress { get; set; }
        public string EncryptedPrivateKey { get; set; }
        public string Salt { get; set; }
        public string IV { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsActive { get; set; }
        public string Network { get; set; } // e.g., "mainnet", "testnet"
        
        // Navigation properties
        public User User { get; set; }
        public ICollection<WalletBalance> Balances { get; set; }
        public ICollection<Transaction> Transactions { get; set; }
    }

    public class Currency
    {
        public int Id { get; set; }
        public required string Symbol { get; set; }
        public required string Name { get; set; }
        public required string NetworkType { get; set; }
        public bool IsActive { get; set; }
        public ICollection<WalletBalance> WalletBalances { get; set; } = new List<WalletBalance>();
    }

    public class WalletBalance
    {
        public Guid Id { get; set; }
        public Guid WalletId { get; set; }
        public int CurrencyId { get; set; }
        public decimal Balance { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public required Wallet Wallet { get; set; }
        public required Currency Currency { get; set; }
    }
}