using System;
using System.Threading.Tasks;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Nethereum.Signer;
using Nethereum.Hex.HexConvertors.Extensions;
using System.Security.Cryptography;
using System.Text;
using MiniWallet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace MiniWallet.Services
{
    public interface IEthereumService : IFundingService
    {
        Task<(string address, string privateKey)> GenerateWalletAsync();
        Task<decimal> GetBalanceAsync(string address);
        Task<string> SendTransactionAsync(string fromAddress, string toAddress, decimal amount, string privateKey);
        Task<Transaction> GetTransactionStatusAsync(string transactionHash);
        (string encryptedKey, string salt, string iv) EncryptPrivateKey(string privateKey, string password);
        string DecryptPrivateKey(string encryptedKey, string password, string salt, string iv);
        Task<Transaction> RequestFundingAsync(string walletId, decimal amount, string password);
        Task<Transaction> CheckFundingStatusAsync(string transactionHash);
        Task<(decimal minAmount, decimal maxAmount, decimal dailyLimit, int hourlyLimit)> GetFundingLimitsAsync();
        Task<decimal> GetRemainingDailyLimitAsync(string walletId);
        Task<int> GetRemainingHourlyRequestsAsync(string walletId);
    }

    public class EthereumService : IEthereumService
    {
        private readonly Web3 _web3;
        private readonly AppDbContext _context;
        private readonly string _networkUrl;
        private readonly string _faucetPrivateKey;
        private readonly decimal _minFundingAmount = 0.01m;
        private readonly decimal _maxFundingAmount = 0.1m;
        private readonly decimal _dailyLimit = 0.5m;
        private readonly int _hourlyLimit = 3; // Maximum 3 funding requests per hour

        public EthereumService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _networkUrl = configuration["Ethereum:InfuraUrl"] ?? throw new ArgumentNullException("Ethereum:InfuraUrl is required");
            _faucetPrivateKey = configuration["Ethereum:FaucetPrivateKey"] ?? throw new ArgumentNullException("Ethereum:FaucetPrivateKey is required");
            _web3 = new Web3(_networkUrl);
        }

        public async Task<(string address, string privateKey)> GenerateWalletAsync()
        {
            var ecKey = Nethereum.Signer.EthECKey.GenerateKey();
            var privateKey = ecKey.GetPrivateKeyAsBytes().ToHex();
            var account = new Account(privateKey);
            return (account.Address, privateKey);
        }

        public async Task<decimal> GetBalanceAsync(string address)
        {
            try
            {
                if (string.IsNullOrEmpty(address))
                    throw new ArgumentException("Address cannot be null or empty", nameof(address));

                if (!address.StartsWith("0x"))
                    throw new ArgumentException("Invalid Ethereum address format", nameof(address));

                if (string.IsNullOrEmpty(_networkUrl))
                    throw new InvalidOperationException("Ethereum network URL is not configured");

            var balance = await _web3.Eth.GetBalance.SendRequestAsync(address);
            return Web3.Convert.FromWei(balance);
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get Ethereum balance for address {address}: {ex.Message}", ex);
            }
        }

        public async Task<string> SendTransactionAsync(string fromAddress, string toAddress, decimal amount, string privateKey)
        {
            var account = new Account(privateKey);
            var web3 = new Web3(account, _networkUrl);

            var transaction = await web3.Eth.GetEtherTransferService()
                .TransferEtherAndWaitForReceiptAsync(toAddress, amount);

            return transaction.TransactionHash;
        }

        public async Task<Transaction> GetTransactionStatusAsync(string transactionHash)
        {
            var receipt = await _web3.Eth.Transactions.GetTransactionReceipt.SendRequestAsync(transactionHash);
            
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.TransactionHash == transactionHash);

            if (transaction != null)
            {
                transaction.Status = receipt.Status.Value == 1 ? "Completed" : "Failed";
                transaction.CompletedAt = DateTime.UtcNow;
                transaction.BlockNumber = receipt.BlockNumber.Value.ToString();
                await _context.SaveChangesAsync();
            }

            return transaction;
        }

        public (string encryptedKey, string salt, string iv) EncryptPrivateKey(string privateKey, string password)
        {
            using (var aes = Aes.Create())
            {
                aes.GenerateIV();
                aes.GenerateKey();

                var salt = new byte[16];
                using (var rng = new RNGCryptoServiceProvider())
                {
                    rng.GetBytes(salt);
                }

                var key = new Rfc2898DeriveBytes(password, salt, 10000);
                aes.Key = key.GetBytes(32);

                using (var encryptor = aes.CreateEncryptor())
                {
                    var plainBytes = Encoding.UTF8.GetBytes(privateKey);
                    var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

                    return (
                        Convert.ToBase64String(cipherBytes),
                        Convert.ToBase64String(salt),
                        Convert.ToBase64String(aes.IV)
                    );
                }
            }
        }

        public string DecryptPrivateKey(string encryptedKey, string password, string salt, string iv)
        {
            using (var aes = Aes.Create())
            {
                var saltBytes = Convert.FromBase64String(salt);
                var ivBytes = Convert.FromBase64String(iv);
                var key = new Rfc2898DeriveBytes(password, saltBytes, 10000);

                aes.Key = key.GetBytes(32);
                aes.IV = ivBytes;

                using (var decryptor = aes.CreateDecryptor())
                {
                    var cipherBytes = Convert.FromBase64String(encryptedKey);
                    var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
                    return Encoding.UTF8.GetString(plainBytes);
                }
            }
        }

        public async Task<Transaction> RequestFundingAsync(string walletId, decimal amount, string password)
        {
            try
            {
                Console.WriteLine($"Starting funding request for wallet {walletId} with amount {amount}");
                
                // Get wallet and verify password
                var wallet = await _context.Wallets
                    .FirstOrDefaultAsync(w => w.Id.ToString().ToLower() == walletId.ToLower());
                if (wallet == null)
                {
                    Console.WriteLine($"Wallet {walletId} not found");
                    throw new KeyNotFoundException($"Wallet {walletId} not found");
                }
                Console.WriteLine($"Found wallet with address {wallet.PublicAddress}");

                // Verify password by attempting to decrypt private key
                try
                {
                    Console.WriteLine("Attempting to decrypt private key");
                    _ = DecryptPrivateKey(wallet.EncryptedPrivateKey, password, wallet.Salt, wallet.IV);
                    Console.WriteLine("Private key decryption successful");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Private key decryption failed: {ex.Message}");
                    throw new UnauthorizedAccessException("Invalid wallet password");
                }

                // Validate amount
                var (minAmount, maxAmount, dailyLimit, hourlyLimit) = await GetFundingLimitsAsync();
                Console.WriteLine($"Funding limits - Min: {minAmount}, Max: {maxAmount}, Daily: {dailyLimit}, Hourly: {hourlyLimit}");
                if (amount < minAmount || amount > maxAmount)
                {
                    Console.WriteLine($"Amount {amount} is outside allowed range");
                    throw new ArgumentException($"Amount must be between {minAmount} and {maxAmount} ETH");
                }

                // Check daily limit
                var remainingDailyLimit = await GetRemainingDailyLimitAsync(walletId);
                Console.WriteLine($"Remaining daily limit: {remainingDailyLimit}");
                if (amount > remainingDailyLimit)
                {
                    Console.WriteLine($"Amount {amount} exceeds remaining daily limit {remainingDailyLimit}");
                    throw new InvalidOperationException($"Amount exceeds remaining daily limit of {remainingDailyLimit} ETH");
                }

                // Check hourly limit
                var remainingHourlyRequests = await GetRemainingHourlyRequestsAsync(walletId);
                Console.WriteLine($"Remaining hourly requests: {remainingHourlyRequests}");
                if (remainingHourlyRequests <= 0)
                {
                    Console.WriteLine("Hourly funding limit reached");
                    throw new InvalidOperationException("Hourly funding limit reached. Please try again later.");
                }

                // Create faucet account
                Console.WriteLine("Creating faucet account");
                var faucetAccount = new Account(_faucetPrivateKey);
                var web3 = new Web3(faucetAccount, _networkUrl);
                Console.WriteLine($"Faucet account address: {faucetAccount.Address}");

                try
                {
                    // Send funding transaction
                    Console.WriteLine($"Sending {amount} ETH to {wallet.PublicAddress}");
                    var tx = await web3.Eth.GetEtherTransferService()
                        .TransferEtherAndWaitForReceiptAsync(wallet.PublicAddress, amount);
                    Console.WriteLine($"Transaction sent with hash: {tx.TransactionHash}");

                    // Create transaction record
                    var transaction = new Transaction
                    {
                        Id = Guid.NewGuid(),
                        WalletId = wallet.Id,
                        TransactionHash = tx.TransactionHash,
                        FromAddress = faucetAccount.Address,
                        ToAddress = wallet.PublicAddress,
                        Amount = amount,
                        Currency = "ETH",
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow,
                        GasPrice = (decimal)Web3.Convert.FromWei(tx.EffectiveGasPrice?.Value ?? 0),
                        GasUsed = (decimal)tx.GasUsed.Value
                    };

                    await _context.Transactions.AddAsync(transaction);
                    await _context.SaveChangesAsync();
                    Console.WriteLine("Transaction record created");

                    // Update transaction status
                    Console.WriteLine("Checking transaction status");
                    return await CheckFundingStatusAsync(tx.TransactionHash);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error during Ethereum transaction: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    throw new Exception($"Failed to send Ethereum transaction: {ex.Message}", ex);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in RequestFundingAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw new Exception($"Failed to fund Ethereum wallet: {ex.Message}", ex);
            }
        }

        public async Task<Transaction> CheckFundingStatusAsync(string transactionHash)
        {
            try
            {
                var receipt = await _web3.Eth.Transactions.GetTransactionReceipt.SendRequestAsync(transactionHash);
                var transaction = await _context.Transactions
                    .Include(t => t.Wallet)
                        .ThenInclude(w => w.Balances)
                    .FirstOrDefaultAsync(t => t.TransactionHash == transactionHash);

                if (transaction != null)
                {
                    var oldStatus = transaction.Status;
                    transaction.Status = receipt.Status.Value == 1 ? "Completed" : "Failed";
                    transaction.CompletedAt = DateTime.UtcNow;
                    transaction.BlockNumber = receipt.BlockNumber.Value.ToString();

                    // If transaction just completed, update wallet balance
                    if (oldStatus == "Pending" && transaction.Status == "Completed")
                    {
                        var balance = await GetBalanceAsync(transaction.Wallet.PublicAddress);
                        var walletBalance = transaction.Wallet.Balances
                            .FirstOrDefault(b => b.Currency.Symbol == "ETH");
                        
                        if (walletBalance != null)
                        {
                            walletBalance.Balance = balance;
                            walletBalance.UpdatedAt = DateTime.UtcNow;
                        }
                    }

                    await _context.SaveChangesAsync();
                }

                return transaction;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to check Ethereum funding status: {ex.Message}", ex);
            }
        }

        public async Task<(decimal minAmount, decimal maxAmount, decimal dailyLimit, int hourlyLimit)> GetFundingLimitsAsync()
        {
            return (_minFundingAmount, _maxFundingAmount, _dailyLimit, _hourlyLimit);
        }

        public async Task<decimal> GetRemainingDailyLimitAsync(string walletId)
        {
            var today = DateTime.UtcNow.Date;
            // Convert to double for SQLite compatibility, then back to decimal
            var totalFundedToday = await _context.Transactions
                .Where(t => t.WalletId.ToString() == walletId &&
                           t.Currency == "ETH" &&
                           t.Status == "Completed" &&
                           t.CreatedAt.Date == today)
                .Select(t => (double)t.Amount)  // Convert to double for SQLite
                .SumAsync();

            return Math.Max(0, _dailyLimit - (decimal)totalFundedToday);  // Convert back to decimal
        }

        public async Task<int> GetRemainingHourlyRequestsAsync(string walletId)
        {
            var oneHourAgo = DateTime.UtcNow.AddHours(-1);
            var requestsInLastHour = await _context.Transactions
                .CountAsync(t => t.WalletId.ToString() == walletId &&
                               t.Currency == "ETH" &&
                               t.CreatedAt >= oneHourAgo);

            return Math.Max(0, _hourlyLimit - requestsInLastHour);
        }
    }
} 