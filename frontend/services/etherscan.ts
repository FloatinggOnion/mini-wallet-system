import axios from 'axios';

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
const ETHERSCAN_API_URL = 'https://api-sepolia.etherscan.io/api';
const POLLING_INTERVAL = 30000; // 30 seconds

interface EtherscanResponse<T> {
    status: string;
    message: string;
    result: T;
}

interface EtherscanTransaction {
    blockHash: string;
    blockNumber: string;
    confirmations: string;
    contractAddress: string;
    cumulativeGasUsed: string;
    from: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    hash: string;
    input: string;
    isError: string;
    nonce: string;
    timeStamp: string;
    to: string;
    transactionIndex: string;
    value: string;
}

class EtherscanService {
    private lastFetchedBlock: number = 0;
    private cache: Map<string, EtherscanTransaction[]> = new Map();
    private cacheTimeout: Map<string, number> = new Map();
    private readonly CACHE_DURATION = 30000; // 30 seconds
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000; // 1 second

    constructor() {
        if (!ETHERSCAN_API_KEY) {
            throw new Error('Etherscan API key is required. Please add NEXT_PUBLIC_ETHERSCAN_API_KEY to your environment variables.');
        }
    }

    private async fetchWithRetry<T>(params: Record<string, string>, retryCount = 0): Promise<T> {
        try {
            const queryParams = new URLSearchParams({
                ...params,
                apikey: ETHERSCAN_API_KEY!,
            });

            const response = await axios.get<EtherscanResponse<T>>(
                `${ETHERSCAN_API_URL}?${queryParams.toString()}`
            );

            // Handle different response statuses
            if (response.data.status === '0') {
                if (response.data.message === 'No transactions found') {
                    return [] as T;
                }
                if (response.data.message === 'NOTOK') {
                    throw new Error('Invalid API key or rate limit exceeded. Please check your Etherscan API key.');
                }
                throw new Error(`Etherscan API error: ${response.data.message}`);
            }

            return response.data.result;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Handle rate limiting
                if (error.response?.status === 429) {
                    if (retryCount < this.MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (retryCount + 1)));
                        return this.fetchWithRetry(params, retryCount + 1);
                    }
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
                // Handle network errors
                if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                    if (retryCount < this.MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (retryCount + 1)));
                        return this.fetchWithRetry(params, retryCount + 1);
                    }
                }
                throw new Error(`Network error: ${error.message}`);
            }
            throw error;
        }
    }

    private isCacheValid(address: string): boolean {
        const timestamp = this.cacheTimeout.get(address);
        return timestamp ? Date.now() - timestamp < this.CACHE_DURATION : false;
    }

    async getTransactions(address: string, startBlock: number = 0): Promise<EtherscanTransaction[]> {
        if (!address) {
            throw new Error('Wallet address is required');
        }

        // Check cache first
        if (this.cache.has(address) && this.isCacheValid(address)) {
            return this.cache.get(address)!;
        }

        try {
            const params: Record<string, string> = {
                module: 'account',
                action: 'txlist',
                address,
                startblock: startBlock.toString(),
                endblock: '99999999',
                sort: 'desc',
                offset: '100', // Limit to 100 transactions per request
                page: '1'
            };

            const transactions = await this.fetchWithRetry<EtherscanTransaction[]>(params);
            
            // Update cache
            this.cache.set(address, transactions);
            this.cacheTimeout.set(address, Date.now());

            // Update last fetched block
            if (transactions.length > 0) {
                this.lastFetchedBlock = Math.max(
                    this.lastFetchedBlock,
                    parseInt(transactions[0].blockNumber)
                );
            }

            return transactions;
        } catch (error) {
            console.error('Error fetching transactions from Etherscan:', error);
            throw error;
        }
    }

    async getLatestBlockNumber(): Promise<number> {
        try {
            const params = {
                module: 'proxy',
                action: 'eth_blockNumber',
            };

            const result = await this.fetchWithRetry<string>(params);
            return parseInt(result, 16);
        } catch (error) {
            console.error('Error fetching latest block number:', error);
            throw error;
        }
    }

    // Start polling for new transactions
    startPolling(address: string, callback: (transactions: EtherscanTransaction[]) => void): () => void {
        if (!address) {
            throw new Error('Wallet address is required for polling');
        }

        let isPolling = true;
        let errorCount = 0;
        const MAX_CONSECUTIVE_ERRORS = 3;

        const poll = async () => {
            if (!isPolling) return;

            try {
                const transactions = await this.getTransactions(address, this.lastFetchedBlock);
                if (transactions.length > 0) {
                    callback(transactions);
                }
                // Reset error count on successful request
                errorCount = 0;
            } catch (error) {
                console.error('Error in polling:', error);
                errorCount++;

                // If we get too many consecutive errors, stop polling
                if (errorCount >= MAX_CONSECUTIVE_ERRORS) {
                    console.error('Too many consecutive errors, stopping polling');
                    isPolling = false;
                    return;
                }
            }

            if (isPolling) {
                setTimeout(poll, POLLING_INTERVAL);
            }
        };

        poll();

        // Return cleanup function
        return () => {
            isPolling = false;
        };
    }
}

// Validate API key on service initialization
if (!ETHERSCAN_API_KEY) {
    console.error('Etherscan API key is missing. Please add NEXT_PUBLIC_ETHERSCAN_API_KEY to your environment variables.');
}

export const etherscanService = new EtherscanService(); 