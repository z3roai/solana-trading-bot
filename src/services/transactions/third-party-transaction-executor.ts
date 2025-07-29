import {
  BlockhashWithExpiryBlockHeight,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { TransactionExecutor } from './transaction-executor.interface';
import { logger } from '../helpers';
import axios, { AxiosError } from 'axios';
import bs58 from 'bs58';
import { Currency, CurrencyAmount } from '@raydium-io/raydium-sdk';

export class ThirdPartyTransactionExecutor implements TransactionExecutor {
  private readonly thirdPartyFeeWallet = new PublicKey('WARPzUMPnycu9eeCZ95rcAUxorqpBqHndfV3ZP5FSyS');

  constructor(private readonly thirdPartyFee: string) {}

  public async executeAndConfirm(
    transaction: VersionedTransaction,
    payer: Keypair,
    latestBlockhash: BlockhashWithExpiryBlockHeight,
  ): Promise<{ confirmed: boolean; signature?: string; error?: string }> {
    logger.debug('Executing transaction...');

    try {
      const fee = new CurrencyAmount(Currency.SOL, this.thirdPartyFee, false).raw.toNumber();
      const thirdPartyFeeMessage = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [
          SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: this.thirdPartyFeeWallet,
            lamports: fee,
          }),
        ],
      }).compileToV0Message();

      const thirdPartyFeeTx = new VersionedTransaction(thirdPartyFeeMessage);
      thirdPartyFeeTx.sign([payer]);

      const response = await axios.post<{ confirmed: boolean; signature: string; error?: string }>(
        'https://tx.warp.id/transaction/execute',
        {
          transactions: [bs58.encode(thirdPartyFeeTx.serialize()), bs58.encode(transaction.serialize())],
          latestBlockhash,
        },
        {
          timeout: 100000,
        },
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        logger.trace({ error: error.response?.data }, 'Failed to execute third-party transaction');
      }
    }

    return { confirmed: false };
  }
} 