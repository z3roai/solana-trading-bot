# Solana Trading Bot

A high-performance automated trading bot for the Solana blockchain that executes trades based on predefined parameters and real-time market conditions.

## Features

- 🚀 **Real-time Market Monitoring** - Monitors pool creation, burns, and market conditions
- ⚡ **Fast Execution** - Multiple transaction execution strategies (Default, Jito, Third-party)
- 🎯 **Smart Filtering** - Configurable filters for pool size, metadata, and token properties
- 💰 **Auto Trading** - Automated buy/sell with take profit and stop loss
- 📊 **Snipe List Support** - Trade specific tokens from a predefined list
- 🔒 **Secure** - Private keys never leave your machine

## Quick Start

### Prerequisites

- Node.js 18+ 
- A Solana wallet with SOL
- USDC or WSOL for trading

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/z3roai/solana-trading-bot.git
   cd solana-trading-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the bot**
   ```bash
   cp .env.copy .env
   # Edit .env with your configuration
   ```

4. **Run the bot**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

#### Wallet Setup
```env
PRIVATE_KEY=your_wallet_private_key
```

#### Network Connection
```env
RPC_ENDPOINT=https://your-rpc-endpoint.com
RPC_WEBSOCKET_ENDPOINT=wss://your-websocket-endpoint.com
COMMITMENT_LEVEL=finalized
```

#### Bot Settings
```env
LOG_LEVEL=info
ONE_TOKEN_AT_A_TIME=true
COMPUTE_UNIT_LIMIT=200000
COMPUTE_UNIT_PRICE=5000
PRE_LOAD_EXISTING_MARKETS=false
CACHE_NEW_MARKETS=true
```

#### Transaction Execution
```env
TRANSACTION_EXECUTOR=default  # Options: default, jito, third-party
CUSTOM_FEE=0.006  # SOL (for jito/third-party executors)
```

#### Trading Parameters
```env
QUOTE_MINT=USDC  # or WSOL
QUOTE_AMOUNT=10  # Amount to trade
AUTO_BUY_DELAY=1000  # ms
MAX_BUY_RETRIES=3
BUY_SLIPPAGE=1  # %
```

#### Auto Sell Settings
```env
AUTO_SELL=true
MAX_SELL_RETRIES=3
AUTO_SELL_DELAY=1000  # ms
PRICE_CHECK_INTERVAL=5000  # ms
PRICE_CHECK_DURATION=300000  # ms
TAKE_PROFIT=50  # %
STOP_LOSS=20  # %
SELL_SLIPPAGE=1  # %
```

#### Filters
```env
FILTER_CHECK_INTERVAL=1000  # ms
FILTER_CHECK_DURATION=30000  # ms
CONSECUTIVE_FILTER_MATCHES=2
CHECK_IF_MUTABLE=true
CHECK_IF_SOCIALS=true
CHECK_IF_MINT_IS_RENOUNCED=true
CHECK_IF_FREEZABLE=true
CHECK_IF_BURNED=true
MIN_POOL_SIZE=1000
MAX_POOL_SIZE=100000
```

#### Snipe List
```env
USE_SNIPE_LIST=false
SNIPE_LIST_REFRESH_INTERVAL=30000  # ms
```

## Transaction Executors

The bot supports multiple transaction execution strategies:

### Default Executor
- Uses standard Solana RPC
- Configurable compute units and price
- No additional fees

### Jito Executor
- Uses Jito MEV infrastructure
- Faster transaction execution
- Custom fee structure

### Third-party Executor
- Uses hosted transaction service
- Enhanced reliability
- Distributed fee structure

## Trading Strategies

### Pool Monitoring
The bot monitors new liquidity pools and executes trades when:
- Pool creation time is after bot start
- Pool meets configured filters
- Token is not already owned

### Auto Sell
When `AUTO_SELL=true`, the bot automatically sells tokens based on:
- **Take Profit**: Sell when profit reaches specified percentage
- **Stop Loss**: Sell when loss reaches specified percentage
- **Time-based**: Sell after specified duration regardless of profit/loss

### Snipe List
Enable `USE_SNIPE_LIST=true` to trade only specific tokens:
- Add token addresses to `snipe-list.txt`
- Bot monitors for pool creation of listed tokens
- Filters are disabled when using snipe list

## Filters

Configure filters to only trade tokens that meet specific criteria:

- **Pool Size**: Min/max liquidity requirements
- **Metadata**: Mutable/immutable token metadata
- **Socials**: Presence of social media links
- **Mint Authority**: Renounced mint authority
- **Freezable**: Non-freezable tokens
- **Burned**: Burned liquidity pools

## Troubleshooting

### Common Issues

#### RPC Connection Errors
```
Error: 410 Gone: The RPC call or parameters have been disabled
```
**Solution**: Use a reliable RPC provider like Helius or Quicknode

#### No Token Account
```
Error: No SOL token account found in wallet
```
**Solution**: Swap some SOL to USDC/WSOL in a DEX

#### Transaction Failures
- Increase `CUSTOM_FEE` for third-party executors
- Check RPC endpoint reliability
- Verify wallet has sufficient SOL for fees

### Debug Mode
Set `LOG_LEVEL=debug` for detailed logging to help diagnose issues.

## Security

- **Private Keys**: Never stored or transmitted
- **Local Execution**: All transactions signed locally
- **No Data Storage**: No transaction or wallet data stored externally

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🚀 Getting Started

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 📋 Guidelines

- 🔧 Follow the existing code style
- 📝 Add comments for complex logic
- 🧪 Test your changes thoroughly
- 📖 Update documentation if needed
- 🐛 Report bugs using GitHub Issues

### 🎯 Areas for Contribution

- 🚀 Performance optimizations
- 🛡️ Security improvements
- 📊 Additional trading strategies
- 🎨 UI/UX enhancements
- 📚 Documentation improvements

---

## ⚠️ Disclaimer

> **Important**: This software is provided for **educational purposes only**. 
> 
> Cryptocurrency trading involves **significant risk** and may result in financial losses. 
> Past performance does not guarantee future results.
> 
> **Use at your own discretion.** The developers are not responsible for any financial losses incurred while using this bot.

### 🔒 Risk Warning

- 💰 **High Risk**: Cryptocurrency trading is inherently risky
- 📈 **Volatility**: Prices can change rapidly and unpredictably
- 🎯 **No Guarantees**: There are no guarantees of profit
- ⚡ **Technical Risk**: Software bugs or network issues may cause losses

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE.md](LICENSE.md) file for details.

### 📜 License Summary

- ✅ **Commercial Use**: Allowed
- ✅ **Modification**: Allowed  
- ✅ **Distribution**: Allowed
- ✅ **Private Use**: Allowed
- ⚠️ **Liability**: Limited
- ⚠️ **Warranty**: No warranty provided

---

## 🌟 Support the Project

If you find this project helpful, consider supporting us:

- ⭐ **Star** this repository
- 🐛 **Report** bugs and issues
- 💡 **Suggest** new features
- 📢 **Share** with the community
- ☕ **Buy us a coffee** (if applicable)

---

*Made with Z3roai*
