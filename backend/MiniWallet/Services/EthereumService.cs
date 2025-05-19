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

namespace MiniWallet.Services
{
    public interface IEthereumService
    {
        Task<(string address, string privateKey)> GenerateWalletAsync();
        Task<decimal> GetBalanceAsync(string address);
        Task<string> SendTransactionAsync(string fromAddress, string toAddress, decimal amount, string privateKey);
        Task<Transaction> GetTransactionStatusAsync(string transactionHash);
        string EncryptPrivateKey(string privateKey, string password);
        string DecryptPrivateKey(string encryptedKey, string password, string salt, string iv);
    }

    public class EthereumService : IEthereumService
    {
        private readonly Web3 _web3;
        private readonly AppDbContext _context;
        private readonly string _networkUrl;

        public EthereumService(AppDbContext context, string networkUrl = "https://mainnet.infura.io/v3/4471bc9330654892aa8f45bea58546d9")
        {
            _context = context;
            _networkUrl = networkUrl;
            _web3 = new Web3(networkUrl);
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
            var balance = await _web3.Eth.GetBalance.SendRequestAsync(address);
            return Web3.Convert.FromWei(balance);
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

        public string EncryptPrivateKey(string privateKey, string password)
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

                    return Convert.ToBase64String(cipherBytes);
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
    }
} 