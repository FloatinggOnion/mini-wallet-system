using System;
using System.Threading.Tasks;
using MiniWallet.Models;

namespace MiniWallet.Services
{
    public interface IFundingService
    {
        /// <summary>
        /// Initiates a funding request for a wallet
        /// </summary>
        /// <param name="walletId">The ID of the wallet to fund</param>
        /// <param name="amount">The amount to fund (in the native currency)</param>
        /// <param name="password">The wallet password for verification</param>
        /// <returns>The funding transaction</returns>
        Task<Transaction> RequestFundingAsync(string walletId, decimal amount, string password);

        /// <summary>
        /// Checks the status of a funding transaction
        /// </summary>
        /// <param name="transactionHash">The hash of the funding transaction</param>
        /// <returns>The updated transaction status</returns>
        Task<Transaction> CheckFundingStatusAsync(string transactionHash);

        /// <summary>
        /// Gets the current funding limits for the service
        /// </summary>
        /// <returns>A tuple containing (minAmount, maxAmount, dailyLimit, hourlyLimit)</returns>
        Task<(decimal minAmount, decimal maxAmount, decimal dailyLimit, int hourlyLimit)> GetFundingLimitsAsync();

        /// <summary>
        /// Gets the remaining daily funding limit for a wallet
        /// </summary>
        /// <param name="walletId">The ID of the wallet</param>
        /// <returns>The remaining daily limit</returns>
        Task<decimal> GetRemainingDailyLimitAsync(string walletId);

        /// <summary>
        /// Gets the number of funding requests allowed in the current hour
        /// </summary>
        /// <param name="walletId">The ID of the wallet</param>
        /// <returns>The number of remaining requests</returns>
        Task<int> GetRemainingHourlyRequestsAsync(string walletId);
    }
} 