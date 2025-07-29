import { MarketCache, PoolCache } from './core/cache';
import { Listeners } from './core/listeners';
import { Connection, KeyedAccountInfo, Keypair } from '@solana/web3.js';
import { LIQUIDITY_STATE_LAYOUT_V4, MARKET_STATE_LAYOUT_V3, Token, TokenAmount } from '@raydium-io/raydium-sdk';
import { AccountLayout, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Bot, BotConfig } from './core/bot';
import { DefaultTransactionExecutor, TransactionExecutor } from './services/transactions';
import {
  getToken,
  getWallet,
  logger,
  COMMITMENT_LEVEL,
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
  PRE_LOAD_EXISTING_MARKETS,
  LOG_LEVEL,
  CHECK_IF_MUTABLE,
  CHECK_IF_MINT_IS_RENOUNCED,
  CHECK_IF_FREEZABLE,
  CHECK_IF_BURNED,
  QUOTE_MINT,
  MAX_POOL_SIZE,
  MIN_POOL_SIZE,
  QUOTE_AMOUNT,
  PRIVATE_KEY,
  USE_SNIPE_LIST,
  ONE_TOKEN_AT_A_TIME,
  AUTO_SELL_DELAY,
  MAX_SELL_RETRIES,
  AUTO_SELL,
  MAX_BUY_RETRIES,
  AUTO_BUY_DELAY,
  COMPUTE_UNIT_LIMIT,
  COMPUTE_UNIT_PRICE,
  CACHE_NEW_MARKETS,
  TAKE_PROFIT,
  STOP_LOSS,
  BUY_SLIPPAGE,
  SELL_SLIPPAGE,
  PRICE_CHECK_DURATION,
  PRICE_CHECK_INTERVAL,
  SNIPE_LIST_REFRESH_INTERVAL,
  TRANSACTION_EXECUTOR,
  CUSTOM_FEE,
  FILTER_CHECK_INTERVAL,
  FILTER_CHECK_DURATION,
  CONSECUTIVE_FILTER_MATCHES,
} from './utils/helpers';
import { version } from '../package.json';
import { ThirdPartyTransactionExecutor } from './services/transactions/third-party-transaction-executor';
import { JitoTransactionExecutor } from './services/transactions/jito-rpc-transaction-executor';

const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  commitment: COMMITMENT_LEVEL,
});

function printDetails(wallet: Keypair, quoteToken: Token, bot: Bot) {
  logger.info(`  
                    ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗ 
                    ██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
                    ███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║
                    ╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║
                    ███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║
                    ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
                    SOLANA TRADING BOT ACTIVATED
                    Version: ${version}                                          
  `);

  const botConfig = bot.config;

  logger.info('📋 CONFIGURATION');
  logger.info(`💼 Wallet: ${wallet.publicKey.toString()}`);

  logger.info('🤖 Bot Settings');
  logger.info(
    `⚡ Executor: ${TRANSACTION_EXECUTOR} (${bot.isThirdParty || bot.isJito || (TRANSACTION_EXECUTOR === 'default' ? 'enabled' : 'disabled')})`,
  );
  if (bot.isThirdParty || bot.isJito) {
    logger.info(`💰 Fee: ${CUSTOM_FEE}`);
  } else {
    logger.info(`⚙️  Compute Unit Limit: ${botConfig.unitLimit}`);
    logger.info(`💸 Compute Unit Price: ${botConfig.unitPrice} micro lamports`);
  }

  logger.info(`🔄 Single Token Mode: ${botConfig.oneTokenAtATime}`);
  logger.info(`📚 Pre-load Markets: ${PRE_LOAD_EXISTING_MARKETS}`);
  logger.info(`💾 Cache New Markets: ${CACHE_NEW_MARKETS}`);
  logger.info(`📊 Log Level: ${LOG_LEVEL}`);

  logger.info('🛒 Buy Settings');
  logger.info(`💵 Amount: ${botConfig.quoteAmount.toFixed()} ${botConfig.quoteToken.name}`);
  logger.info(`⏱️  Auto Buy Delay: ${botConfig.autoBuyDelay}ms`);
  logger.info(`🔄 Max Buy Retries: ${botConfig.maxBuyRetries}`);
  logger.info(`📈 Buy Slippage: ${botConfig.buySlippage}%`);

  logger.info('💰 Sell Settings');
  logger.info(`🤖 Auto Sell: ${AUTO_SELL}`);
  logger.info(`⏱️  Auto Sell Delay: ${botConfig.autoSellDelay}ms`);
  logger.info(`🔄 Max Sell Retries: ${botConfig.maxSellRetries}`);
  logger.info(`📉 Sell Slippage: ${botConfig.sellSlippage}%`);
  logger.info(`⏰ Price Check Interval: ${botConfig.priceCheckInterval}ms`);
  logger.info(`⏱️  Price Check Duration: ${botConfig.priceCheckDuration}ms`);
  logger.info(`📈 Take Profit: ${botConfig.takeProfit}%`);
  logger.info(`📉 Stop Loss: ${botConfig.stopLoss}%`);

  logger.info('🎯 Snipe List');
  logger.info(`📋 Enabled: ${botConfig.useSnipeList}`);
  logger.info(`🔄 Refresh Interval: ${SNIPE_LIST_REFRESH_INTERVAL}ms`);

  if (botConfig.useSnipeList) {
    logger.info('🔍 Filters');
    logger.info(`⚠️  Filters disabled when snipe list is enabled`);
  } else {
    logger.info('🔍 Filters');
    logger.info(`⏰ Check Interval: ${botConfig.filterCheckInterval}ms`);
    logger.info(`⏱️  Check Duration: ${botConfig.filterCheckDuration}ms`);
    logger.info(`🎯 Consecutive Matches: ${botConfig.consecutiveMatchCount}`);
    logger.info(`🔒 Check Renounced: ${botConfig.checkRenounced}`);
    logger.info(`❄️  Check Freezable: ${botConfig.checkFreezable}`);
    logger.info(`🔥 Check Burned: ${botConfig.checkBurned}`);
    logger.info(`📊 Min Pool Size: ${botConfig.minPoolSize.toFixed()}`);
    logger.info(`📊 Max Pool Size: ${botConfig.maxPoolSize.toFixed()}`);
  }

  logger.info('✅ CONFIGURATION COMPLETE');
  logger.info('🚀 Bot is running! Press CTRL + C to stop.');
}

const runListener = async () => {
  logger.level = LOG_LEVEL;
  logger.info('Bot is starting...');

  const marketCache = new MarketCache(connection);
  const poolCache = new PoolCache();
  let txExecutor: TransactionExecutor;

  switch (TRANSACTION_EXECUTOR) {
    case 'third-party': {
      txExecutor = new ThirdPartyTransactionExecutor(CUSTOM_FEE);
      break;
    }
    case 'jito': {
      txExecutor = new JitoTransactionExecutor(CUSTOM_FEE, connection);
      break;
    }
    default: {
      txExecutor = new DefaultTransactionExecutor(connection);
      break;
    }
  }

  const wallet = getWallet(PRIVATE_KEY.trim());
  const quoteToken = getToken(QUOTE_MINT);
  const botConfig = <BotConfig>{
    wallet,
    quoteAta: getAssociatedTokenAddressSync(quoteToken.mint, wallet.publicKey),
    checkRenounced: CHECK_IF_MINT_IS_RENOUNCED,
    checkFreezable: CHECK_IF_FREEZABLE,
    checkBurned: CHECK_IF_BURNED,
    minPoolSize: new TokenAmount(quoteToken, MIN_POOL_SIZE, false),
    maxPoolSize: new TokenAmount(quoteToken, MAX_POOL_SIZE, false),
    quoteToken,
    quoteAmount: new TokenAmount(quoteToken, QUOTE_AMOUNT, false),
    oneTokenAtATime: ONE_TOKEN_AT_A_TIME,
    useSnipeList: USE_SNIPE_LIST,
    autoSell: AUTO_SELL,
    autoSellDelay: AUTO_SELL_DELAY,
    maxSellRetries: MAX_SELL_RETRIES,
    autoBuyDelay: AUTO_BUY_DELAY,
    maxBuyRetries: MAX_BUY_RETRIES,
    unitLimit: COMPUTE_UNIT_LIMIT,
    unitPrice: COMPUTE_UNIT_PRICE,
    takeProfit: TAKE_PROFIT,
    stopLoss: STOP_LOSS,
    buySlippage: BUY_SLIPPAGE,
    sellSlippage: SELL_SLIPPAGE,
    priceCheckInterval: PRICE_CHECK_INTERVAL,
    priceCheckDuration: PRICE_CHECK_DURATION,
    filterCheckInterval: FILTER_CHECK_INTERVAL,
    filterCheckDuration: FILTER_CHECK_DURATION,
    consecutiveMatchCount: CONSECUTIVE_FILTER_MATCHES,
  };

  const bot = new Bot(connection, marketCache, poolCache, txExecutor, botConfig);
  const valid = await bot.validate();

  if (!valid) {
    logger.info('Bot is exiting...');
    process.exit(1);
  }

  if (PRE_LOAD_EXISTING_MARKETS) {
    await marketCache.init({ quoteToken });
  }

  const runTimestamp = Math.floor(new Date().getTime() / 1000);
  const listeners = new Listeners(connection);
  await listeners.start({
    walletPublicKey: wallet.publicKey,
    quoteToken,
    autoSell: AUTO_SELL,
    cacheNewMarkets: CACHE_NEW_MARKETS,
  });

  listeners.on('market', (updatedAccountInfo: KeyedAccountInfo) => {
    const marketState = MARKET_STATE_LAYOUT_V3.decode(updatedAccountInfo.accountInfo.data);
    marketCache.save(updatedAccountInfo.accountId.toString(), marketState);
  });

  listeners.on('pool', async (updatedAccountInfo: KeyedAccountInfo) => {
    const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data);
    const poolOpenTime = parseInt(poolState.poolOpenTime.toString());
    const exists = await poolCache.get(poolState.baseMint.toString());

    if (!exists && poolOpenTime > runTimestamp) {
      poolCache.save(updatedAccountInfo.accountId.toString(), poolState);
      await bot.buy(updatedAccountInfo.accountId, poolState);
    }
  });

  listeners.on('wallet', async (updatedAccountInfo: KeyedAccountInfo) => {
    const accountData = AccountLayout.decode(updatedAccountInfo.accountInfo.data);

    if (accountData.mint.equals(quoteToken.mint)) {
      return;
    }

    await bot.sell(updatedAccountInfo.accountId, accountData);
  });

  printDetails(wallet, quoteToken, bot);
};

runListener();
