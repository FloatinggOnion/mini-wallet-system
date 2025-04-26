using System;
using System.Collections.Generic;


namespace MiniWallet.Models{
    public class Wallet
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string PublicAddress { get; set; }
        public string EncryptedPrivateKey { get; set; }
        public DateTime CreatedAt { get; set; }
        public User User { get; set; }
        public ICollection<WalletBalance> Balances { get; set; }
        public ICollection<Transaction> Transactions { get; set; }
    }

    public class Currency
    {
        public int Id { get; set; }
        public string Symbol { get; set; }
        public string Name { get; set; }
        public string NetworkType { get; set; }  // Ethereum, Bitcoin, etc.
        public bool IsActive { get; set; }
        public ICollection<WalletBalance> WalletBalances { get; set; }
        public ICollection<Transaction> Transactions { get; set; }
    }

    public class WalletBalance
    {
        public Guid Id { get; set; }
        public Guid WalletId { get; set; }
        public int CurrencyId { get; set; }
        public decimal Balance { get; set; }
        public DateTime UpdatedAt { get; set; }
        public Wallet Wallet { get; set; }
        public Currency Currency { get; set; }
    }

    public class Transaction
    {
        public Guid Id { get; set; }
        public Guid WalletId { get; set; }
        public int CurrencyId { get; set; }
        public string TransactionHash { get; set; }
        public string FromAddress { get; set; }
        public string ToAddress { get; set; }
        public decimal Amount { get; set; }
        public decimal Fee { get; set; }
        public string Status { get; set; }  // Pending, Completed, Failed
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public Wallet Wallet { get; set; }
        public Currency Currency { get; set; }
    }
}