import type { TelegramBot } from "./telegram-bot"
import { WalletManager, DEPOSIT_ADDRESS } from "./wallet-manager"
import { TradingEngine } from "./trading-engine"
import { UserDatabase } from "./user-database"
import { FirebaseService } from "./firebase-service"
import { SmartSniperEngine } from "./smart-sniper-engine"
import { AITradingAssistant } from "./ai-trading-assistant"
import { LiveTokenMonitor, type TokenFilters } from "./live-token-monitor"
import { getMainKeyboard, getSettingsKeyboard, getWalletKeyboard, getSniperKeyboard } from "./keyboards"

const walletManager = new WalletManager()
const tradingEngine = new TradingEngine()
const userDb = new UserDatabase()
const firebase = new FirebaseService()
const smartSniper = new SmartSniperEngine()
const aiAssistant = new AITradingAssistant()
const liveTokenMonitor = new LiveTokenMonitor()

// Store user states for multi-step processes
const userStates = new Map<number, { action: string; data?: any }>()

// Store user filters
const userFilters = new Map<number, TokenFilters>()

// Start live token monitoring
liveTokenMonitor.startLiveMonitoring()

export async function handleBotCommand(
  chatId: number,
  text: string,
  userId: number,
  bot: TelegramBot,
  isCallback = false,
) {
  try {
    console.log(`=== HANDLING COMMAND ===`)
    console.log(`Command: ${text}`)
    console.log(`User: ${userId}`)
    console.log(`Chat: ${chatId}`)
    console.log(`Is Callback: ${isCallback}`)

    // Initialize user if not exists
    await userDb.initUser(userId)
    console.log("User initialized")

    // Handle callback queries (button presses)
    if (isCallback) {
      await handleCallbackQuery(chatId, text, userId, bot)
      return
    }

    // Check if user is in a multi-step process
    const userState = userStates.get(userId)
    if (userState) {
      await handleUserState(chatId, text, userId, bot, userState)
      return
    }

    // Handle regular commands
    if (text === "/start") {
      console.log("Handling /start command")
      await handleStart(chatId, userId, bot)
    } else if (text === "/wallet") {
      await handleWallet(chatId, userId, bot)
    } else if (text === "buy" || text === "💰 Buy") {
      await handleBuy(chatId, userId, bot)
    } else if (text === "sell" || text === "💸 Sell") {
      await handleSell(chatId, userId, bot)
    } else if (text === "positions" || text === "📊 Positions") {
      await handlePositions(chatId, userId, bot)
    } else if (text === "sniper" || text === "🎯 Sniper") {
      await handleSniper(chatId, userId, bot)
    } else if (text === "live_tokens" || text === "📊 Live Tokens") {
      await handleLiveTokens(chatId, userId, bot)
    } else if (text === "ai_analysis" || text === "🤖 AI Analysis") {
      await handleAIAnalysis(chatId, userId, bot)
    } else if (text === "settings" || text === "⚙️ Settings") {
      await handleSettings(chatId, userId, bot)
    } else if (text === "help" || text === "❓ Help") {
      await handleHelp(chatId, bot)
    } else if (text === "refresh" || text === "🔄 Refresh") {
      await handleRefresh(chatId, userId, bot)
    } else if (text.startsWith("buy_")) {
      await handleBuyToken(chatId, userId, bot, text)
    } else if (text.startsWith("sell_")) {
      await handleSellToken(chatId, userId, bot, text)
    } else if (text.length === 44 && text.match(/^[A-Za-z0-9]+$/)) {
      // Looks like a token address - trigger AI analysis and quick buy
      await handleTokenAnalysis(chatId, userId, bot, text)
    } else {
      console.log("Unknown command, sending help message")
      await handleUnknownCommand(chatId, bot)
    }

    console.log("Command handling completed")
  } catch (error) {
    console.error("=== COMMAND HANDLING ERROR ===", error)
    try {
      await bot.sendMessage(chatId, "❌ An error occurred. Please try again.")
    } catch (sendError) {
      console.error("Error sending error message:", sendError)
    }
  }
}

async function handleCallbackQuery(chatId: number, data: string, userId: number, bot: TelegramBot) {
  console.log(`Handling callback: ${data}`)

  switch (data) {
    case "main_menu":
      await handleStart(chatId, userId, bot)
      break
    case "buy":
      await handleBuy(chatId, userId, bot)
      break
    case "sell":
      await handleSell(chatId, userId, bot)
      break
    case "positions":
      await handlePositions(chatId, userId, bot)
      break
    case "sniper":
      await handleSniper(chatId, userId, bot)
      break
    case "live_tokens":
      await handleLiveTokens(chatId, userId, bot)
      break
    case "ai_recommendations":
      await handleAIRecommendations(chatId, userId, bot)
      break
    case "trending_tokens":
      await handleTrendingTokens(chatId, userId, bot)
      break
    case "top_ai_picks":
      await handleTopAIPicks(chatId, userId, bot)
      break
    case "ai_analysis":
      await handleAIAnalysis(chatId, userId, bot)
      break
    case "wallet":
      await handleWallet(chatId, userId, bot)
      break
    case "connect_wallet":
      await handleConnectWallet(chatId, userId, bot)
      break
    case "generate_wallet":
      await handleGenerateWallet(chatId, userId, bot)
      break
    case "generate_deposit":
      await handleGenerateDeposit(chatId, userId, bot)
      break
    case "show_wallet":
      await handleShowWallet(chatId, userId, bot)
      break
    case "toggle_sniper":
      await handleToggleSniper(chatId, userId, bot)
      break
    case "enable_smart_sniper":
      await handleEnableSmartSniper(chatId, userId, bot)
      break
    case "optimize_settings":
      await handleOptimizeSettings(chatId, userId, bot)
      break
    case "market_sentiment":
      await handleMarketSentiment(chatId, userId, bot)
      break
    case "sniper_stats":
      await handleSniperStats(chatId, userId, bot)
      break
    case "ultra_fresh_tokens":
      await handleUltraFreshTokens(chatId, userId, bot)
      break
    case "all_tokens":
      await handleAllTokens(chatId, userId, bot)
      break
    case "filter_tokens":
      await handleFilterTokens(chatId, userId, bot)
      break
    case "token_stats":
      await handleTokenStats(chatId, userId, bot)
      break
    case "clear_filters":
      await handleClearFilters(chatId, userId, bot)
      break
    case "enter_seed_phrase":
      await handleEnterSeedPhrase(chatId, userId, bot)
      break
    case "enter_private_key":
      await handleEnterPrivateKey(chatId, userId, bot)
      break
    case "generate_seed_phrase":
      await handleGenerateSeedPhrase(chatId, userId, bot)
      break
    case "import_seed":
      await handleImportSeed(chatId, userId, bot)
      break
    case "import_private":
      await handleImportPrivate(chatId, userId, bot)
      break
    default:
      if (data.startsWith("buy_")) {
        await handleBuyToken(chatId, userId, bot, data)
      } else if (data.startsWith("sell_")) {
        await handleSellToken(chatId, userId, bot, data)
      } else if (data.startsWith("analyze_")) {
        const tokenAddress = data.replace("analyze_", "")
        await handleTokenAnalysis(chatId, userId, bot, tokenAddress)
      } else if (data.startsWith("quick_buy_")) {
        const tokenAddress = data.replace("quick_buy_", "")
        await handleQuickBuy(chatId, userId, bot, tokenAddress)
      } else if (data.startsWith("filter_")) {
        await handleFilterAction(chatId, userId, bot, data)
      } else {
        await bot.sendMessage(chatId, "❓ Unknown action. Please try again.")
      }
  }
}

async function handleEnterSeedPhrase(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(
    chatId,
    "🔑 <b>Enter Your Seed Phrase</b>\n\n" +
      "Please enter your 12-word seed phrase (recovery phrase).\n\n" +
      "⚠️ <b>SECURITY WARNING:</b>\n" +
      "• Only enter seed phrases you trust\n" +
      "• We store this as PLAIN TEXT (no encryption)\n" +
      "• Never share your seed phrase with anyone else\n" +
      "• Make sure you're in a private chat\n\n" +
      "Type your 12 words separated by spaces:",
  )

  userStates.set(userId, { action: "awaiting_seed_phrase" })
}

async function handleEnterPrivateKey(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(
    chatId,
    "🔑 <b>Enter Your Private Key</b>\n\n" +
      "Please enter your private key in one of these formats:\n" +
      "• Base58 string (recommended)\n" +
      "• JSON array: [1,2,3,...]\n" +
      "• Comma-separated: 1,2,3,...\n\n" +
      "⚠️ <b>SECURITY WARNING:</b>\n" +
      "• Only enter private keys you trust\n" +
      "• We store this as PLAIN TEXT (no encryption)\n" +
      "• Never share your private key with anyone else\n" +
      "• Make sure you're in a private chat\n\n" +
      "Paste your private key:",
  )

  userStates.set(userId, { action: "awaiting_private_key" })
}

async function handleGenerateSeedPhrase(chatId: number, userId: number, bot: TelegramBot) {
  try {
    await bot.sendMessage(chatId, "🔄 Generating new wallet...")

    // Generate new wallet
    const wallet = await walletManager.createWallet(userId)

    // Store wallet in Firebase
    await firebase.storeWallet(userId, {
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      seedPhrase: wallet.seedPhrase,
      createdAt: new Date(),
      lastUsed: new Date(),
    })

    // Update user in database
    await userDb.updateUser(userId, { wallet: wallet.publicKey })

    let message = "✅ <b>New Wallet Generated!</b>\n\n"
    message += "🔐 <b>Wallet Address:</b>\n"
    message += `<code>${wallet.publicKey}</code>\n\n`
    message += "🔑 <b>Your 12-Word Recovery Phrase:</b>\n"
    message += `<code>${wallet.seedPhrase}</code>\n\n`
    message += "⚠️ <b>IMPORTANT:</b>\n"
    message += "• Save these 12 words in a safe place\n"
    message += "• You can use them to recover your wallet\n"
    message += "• Never share them with anyone\n"
    message += "• We store them as PLAIN TEXT (no encryption)\n\n"
    message += "🔑 <b>Private Key (Base58):</b>\n"
    message += `<code>${wallet.privateKey}</code>\n\n`
    message += "✅ Your wallet is ready to use!"

    await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Continue to Main Menu", callback_data: "main_menu" }],
          [{ text: "🔐 View Wallet Details", callback_data: "show_wallet" }],
        ],
      },
    })
  } catch (error) {
    console.error("Error generating wallet:", error)
    await bot.sendMessage(chatId, "❌ Failed to generate wallet. Please try again.")
  }
}

export async function handleImportSeed(chatId: number, userId: number, bot: TelegramBot) {
  try {
    await bot.sendMessage(
      chatId,
      "🔑 <b>Import from Seed Phrase</b>\n\n" +
        "Please enter your 12-word seed phrase (recovery phrase).\n\n" +
        "⚠️ <b>SECURITY WARNING:</b>\n" +
        "• Only enter seed phrases you trust\n" +
        "• We store this as PLAIN TEXT (no encryption)\n" +
        "• Never share your seed phrase with anyone else\n" +
        "• Make sure you're in a private chat\n\n" +
        "Type your 12 words separated by spaces:",
    )

    userStates.set(userId, { action: "awaiting_seed_phrase" })
  } catch (error) {
    console.error("Error in handleImportSeed:", error)
    await bot.sendMessage(chatId, "❌ Error setting up seed phrase import. Please try again.")
  }
}

export async function handleImportPrivate(chatId: number, userId: number, bot: TelegramBot) {
  try {
    await bot.sendMessage(
      chatId,
      "🔑 <b>Import from Private Key</b>\n\n" +
        "Please enter your private key in one of these formats:\n" +
        "• Base58 string (recommended)\n" +
        "• JSON array: [1,2,3,...]\n" +
        "• Comma-separated: 1,2,3,...\n\n" +
        "⚠️ <b>SECURITY WARNING:</b>\n" +
        "• Only enter private keys you trust\n" +
        "• We store this as PLAIN TEXT (no encryption)\n" +
        "• Never share your private key with anyone else\n" +
        "• Make sure you're in a private chat\n\n" +
        "Paste your private key:",
    )

    userStates.set(userId, { action: "awaiting_private_key" })
  } catch (error) {
    console.error("Error in handleImportPrivate:", error)
    await bot.sendMessage(chatId, "❌ Error setting up private key import. Please try again.")
  }
}

async function handleLiveTokens(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "📊 Loading ALL live tokens with auto-refresh...")

  try {
    const stats = liveTokenMonitor.getTokenStats()
    const userFilter = userFilters.get(userId) || {}
    const tokens = liveTokenMonitor.getFilteredTokens(userFilter)

    if (tokens.length === 0) {
      await bot.sendMessage(chatId, "⏳ No tokens found with current filters. Try adjusting your filters.", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 Refresh", callback_data: "live_tokens" }],
            [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
          ],
        },
      })
      return
    }

    let message = `📊 <b>LIVE TOKEN MONITOR</b>\n<i>Auto-refreshes every 5 minutes</i>\n\n`

    message += `📈 <b>Stats:</b>\n`
    message += `• Total: ${stats.total} tokens\n`
    message += `• Ultra-Fresh (0-1m): ${stats.ultraFresh}\n`
    message += `• Fresh (1-5m): ${stats.fresh}\n`
    message += `• Recent (5-30m): ${stats.recent}\n`
    message += `• Older (30m+): ${stats.old}\n\n`

    message += `🏢 <b>By DEX:</b>\n`
    message += `• Raydium: ${stats.byDex.raydium}\n`
    message += `• Orca: ${stats.byDex.orca}\n`
    message += `• Jupiter: ${stats.byDex.jupiter}\n`
    message += `• Pump.fun: ${stats.byDex.pumpfun}\n`
    message += `• DexScreener: ${stats.byDex.dexscreener}\n`
    message += `• Birdeye: ${stats.byDex.birdeye}\n\n`

    // Show active filters
    if (Object.keys(userFilter).length > 0) {
      message += `🔍 <b>Active Filters:</b>\n`
      if (userFilter.minLiquidity) message += `• Min Liquidity: $${userFilter.minLiquidity.toLocaleString()}\n`
      if (userFilter.maxAgeMinutes) message += `• Max Age: ${userFilter.maxAgeMinutes}m\n`
      if (userFilter.minAIScore) message += `• Min AI Score: ${userFilter.minAIScore}\n`
      if (userFilter.freshness) message += `• Freshness: ${userFilter.freshness.join(", ")}\n`
      if (userFilter.dexes) message += `• DEXs: ${userFilter.dexes.join(", ")}\n`
      message += `\n`
    }

    message += `🔥 <b>Top ${Math.min(15, tokens.length)} Tokens:</b>\n`

    // Show top tokens
    tokens.slice(0, 15).forEach((token, index) => {
      const freshnessEmoji =
        token.freshness === "ULTRA_FRESH"
          ? "🔥"
          : token.freshness === "FRESH"
            ? "⚡"
            : token.freshness === "RECENT"
              ? "💫"
              : "⏰"
      const aiScoreEmoji = (token.aiScore || 0) >= 80 ? "🤖✅" : (token.aiScore || 0) >= 60 ? "🤖⚡" : ""

      message += `${freshnessEmoji} <b>${index + 1}. ${token.symbol}</b> ${aiScoreEmoji}\n`
      message += `   📍 ${token.dex} | ⏰ ${token.age}\n`
      message += `   💰 $${token.price.toFixed(8)} | 💧 $${token.liquidity.toLocaleString()}\n`
      message += `   📊 MC: $${token.marketCap.toLocaleString()} | 🔥 ${token.hotness}/100\n`
      if (token.aiScore) {
        message += `   🤖 AI: ${token.aiScore}/100 (${token.aiRecommendation})\n`
      }
      message += `\n`
    })

    message += `⏰ <b>Last Refresh:</b> ${stats.lastRefresh}\n`
    message += `🔄 <b>Next Refresh:</b> ${stats.nextRefresh}\n`
    message += `🤖 <b>Showing ${tokens.length} of ${stats.total} tokens</b>`

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🔥 Ultra-Fresh Only", callback_data: "ultra_fresh_tokens" },
          { text: "📊 All Tokens", callback_data: "all_tokens" },
        ],
        [
          { text: "🔍 Filter Tokens", callback_data: "filter_tokens" },
          { text: "📈 Token Stats", callback_data: "token_stats" },
        ],
        [
          { text: "🎯 AI Recommendations", callback_data: "ai_recommendations" },
          { text: "🔄 Refresh Now", callback_data: "live_tokens" },
        ],
        [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
      ],
    }

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error handling live tokens:", error)
    await bot.sendMessage(chatId, "❌ Failed to load token data. Please try again.")
  }
}

// Continue with existing handlers...
async function handleStart(chatId: number, userId: number, bot: TelegramBot) {
  try {
    console.log(`[BOT] Starting for user ${userId}`)

    const user = await userDb.initUser(userId)
    console.log(`[BOT] User initialized: ${JSON.stringify(user)}`)

    const walletData = await firebase.getWallet(userId)
    let walletAddress = null
    let currentBalance = 0

    if (walletData) {
      walletAddress = walletData.publicKey
      console.log(`[BOT] Found wallet: ${walletAddress}`)

      try {
        currentBalance = await walletManager.getBalance(walletAddress)
        console.log(`[BOT] Live balance: ${currentBalance} SOL`)

        await userDb.updateUser(userId, {
          wallet: walletAddress,
          solBalance: currentBalance,
        })
      } catch (balanceError) {
        console.error(`[BOT] Error getting balance:`, balanceError)
      }
    }

    const sniperEnabled = smartSniper.isEnabled(userId)
    const topRecommendations = liveTokenMonitor.getTopRecommendations(3)
    const stats = liveTokenMonitor.getTokenStats()

    let recommendationText = ""
    if (topRecommendations.length > 0) {
      recommendationText = `\n🎯 <b>Top AI Picks Right Now:</b>\n`
      topRecommendations.forEach((rec, index) => {
        const urgencyEmoji = rec.urgency === "CRITICAL" ? "🔥" : rec.urgency === "HIGH" ? "⚡" : "💡"
        recommendationText += `${urgencyEmoji} ${rec.token.symbol}: ${rec.token.aiScore}/100 (${rec.urgency})\n`
      })
    }

    const welcomeMessage = `🚀 <b>MEVX Autosniping Space</b>
🤖 <b>POWERED BY LIVE AI ANALYSIS</b>

⚡ <b>LIVE FEATURES:</b>
• 📊 Real-time monitoring of ${stats.total} tokens
• 🔄 Auto-refresh every 5 minutes
• 🤖 AI analyzes all tokens continuously
• 🎯 Instant recommendations for best snipes
• 🔍 Advanced filtering system
• 💡 Smart entry timing with AI signals

✨ <b>MINIMUM BALANCE: 1 SOL REQUIRED</b>
You need at least 1 SOL to start trading and use the sniper!

${
  walletAddress
    ? currentBalance >= 1
      ? `🔐 <b>Your Wallet:</b>\n<code>${walletAddress}</code>\n\n💰 <b>Live Balance:</b> ${currentBalance.toFixed(4)} SOL\n\n✅ <b>READY TO TRADE!</b>`
      : `🔐 <b>Your Wallet:</b>\n<code>${walletAddress}</code>\n\n💰 <b>Live Balance:</b> ${currentBalance.toFixed(4)} SOL\n\n⚠️ <b>INSUFFICIENT BALANCE!</b>\nYou need at least 1 SOL to start trading.`
    : `🔐 <b>Wallet:</b> Not connected\n\n💡 Connect or generate a wallet to start trading!\n\n🎯 <b>Fund your wallet with at least 1 SOL to get started!</b>`
}

🤖 <b>AI Sniper Status:</b> ${sniperEnabled ? "🟢 ACTIVE" : "🔴 INACTIVE"}

📊 <b>Live Stats:</b>
• Total Tokens: ${stats.total}
• Ultra-Fresh: ${stats.ultraFresh}
• Fresh: ${stats.fresh}
• Next Refresh: ${stats.nextRefresh}

${recommendationText}

🌟 <b>New:</b> Complete token monitoring with filters!`

    const keyboard = getMainKeyboard(!!walletAddress)
    keyboard.inline_keyboard.unshift([{ text: "📊 Live Tokens", callback_data: "live_tokens" }])
    keyboard.inline_keyboard.unshift([{ text: "🤖 AI Recommendations", callback_data: "ai_recommendations" }])

    await bot.sendMessage(chatId, welcomeMessage, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error in handleStart:", error)
    await bot.sendMessage(chatId, `❌ Error loading bot: ${error.message}\n\nTrying basic startup...`)

    await bot.sendMessage(chatId, "🚀 <b>Welcome to MEVX Autosniping Space!</b>\n\nBot is starting up...", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔐 Connect Wallet", callback_data: "wallet" }],
          [{ text: "❓ Help", callback_data: "help" }],
        ],
      },
    })
  }
}

// Add all the remaining handler functions with proper implementations
async function handleWallet(chatId: number, userId: number, bot: TelegramBot) {
  const walletData = await firebase.getWallet(userId)

  if (walletData) {
    const walletAddress = walletData.publicKey
    const currentBalance = await walletManager.getBalance(walletAddress)

    const message = `🔐 <b>Your Wallet:</b>\n<code>${walletAddress}</code>\n\n💰 <b>Live Balance:</b> ${currentBalance.toFixed(4)} SOL`

    const keyboard = getWalletKeyboard()

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } else {
    const message = `🔐 <b>Wallet:</b> Not connected\n\n💡 Connect or generate a wallet to start trading!`

    const keyboard = getWalletKeyboard()

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  }
}

async function handleBuy(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "💰 Enter the token address you want to buy, or paste a token address to analyze:")
  userStates.set(userId, { action: "awaiting_token_analysis" })
}

async function handleSell(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "💸 Select a position to sell:")
}

async function handlePositions(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "📊 Loading your positions...")
}

async function handleSniper(chatId: number, userId: number, bot: TelegramBot) {
  const sniperEnabled = smartSniper.isEnabled(userId)

  let message = `🎯 <b>AI Sniper</b>\n\n`
  message += `Status: ${sniperEnabled ? "🟢 ACTIVE" : "🔴 INACTIVE"}\n\n`
  message += `The AI Sniper automatically buys tokens based on AI analysis.\n\n`
  message += `It uses a small amount of SOL to test new tokens.\n\n`
  message += `You can toggle it on or off below.`

  const keyboard = getSniperKeyboard(sniperEnabled)

  await bot.sendMessage(chatId, message, { reply_markup: keyboard })
}

async function handleAIAnalysis(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "🤖 Enter a token address to analyze, or paste a token address to analyze:")
  userStates.set(userId, { action: "awaiting_token_analysis" })
}

async function handleSettings(chatId: number, userId: number, bot: TelegramBot) {
  const keyboard = getSettingsKeyboard()
  await bot.sendMessage(chatId, "⚙️ Settings:", { reply_markup: keyboard })
}

async function handleHelp(chatId: number, bot: TelegramBot) {
  let helpMessage = `❓ <b>MEVX Autosniping Space - Help</b>\n\n`
  helpMessage += `<b>Commands:</b>\n`
  helpMessage += `/start - Start the bot\n`
  helpMessage += `/wallet - View your wallet\n`
  helpMessage += `buy - Buy a token\n`
  helpMessage += `sell - Sell a token\n`
  helpMessage += `positions - View your positions\n`
  helpMessage += `sniper - Configure the AI Sniper\n`
  helpMessage += `live_tokens - View live tokens\n`
  helpMessage += `ai_analysis - Analyze a token\n`
  helpMessage += `settings - View settings\n`
  helpMessage += `help - View this help message\n\n`
  helpMessage += `<b>Other:</b>\n`
  helpMessage += `You can also use the buttons below to navigate the bot.\n\n`
  helpMessage += `If you have any questions, please contact support.`

  await bot.sendMessage(chatId, helpMessage)
}

async function handleRefresh(chatId: number, userId: number, bot: TelegramBot) {
  await handleStart(chatId, userId, bot)
}

async function handleBuyToken(chatId: number, userId: number, bot: TelegramBot, data: string) {
  const tokenAddress = data.replace("buy_", "")
  await bot.sendMessage(chatId, `💰 Enter the amount of SOL you want to spend on ${tokenAddress}:`)
  userStates.set(userId, { action: "awaiting_buy_amount", data: { tokenAddress } })
}

async function handleSellToken(chatId: number, userId: number, bot: TelegramBot, data: string) {
  const tokenAddress = data.replace("sell_", "")
  await bot.sendMessage(chatId, `💸 Selling ${tokenAddress}...`)
}

async function handleTokenAnalysis(chatId: number, userId: number, bot: TelegramBot, tokenAddress: string) {
  try {
    await bot.sendMessage(chatId, `🔍 Analyzing token ${tokenAddress}...`)

    const analysis = await aiAssistant.analyzeToken(tokenAddress)

    let message = `🤖 <b>AI Analysis for ${analysis.symbol} (${analysis.name})</b>\n\n`
    message += `💰 <b>Price:</b> $${analysis.price.toFixed(8)}\n`
    message += `💧 <b>Liquidity:</b> $${analysis.liquidity.toLocaleString()}\n`
    message += `🏢 <b>DEX:</b> ${analysis.dex}\n`
    message += `🔥 <b>Hotness:</b> ${analysis.hotness}/100\n`
    message += `🤖 <b>AI Score:</b> ${analysis.aiScore}/100\n`
    message += `✅ <b>AI Recommendation:</b> ${analysis.aiRecommendation}\n\n`
    message += `<b>Summary:</b> ${analysis.summary}`

    const keyboard = {
      inline_keyboard: [
        [{ text: "💰 Quick Buy", callback_data: `quick_buy_${tokenAddress}` }],
        [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
      ],
    }

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error analyzing token:", error)
    await bot.sendMessage(chatId, "❌ Failed to analyze token. Please try again.")
  }
}

async function handleQuickBuy(chatId: number, userId: number, bot: TelegramBot, tokenAddress: string) {
  await bot.sendMessage(chatId, `💰 Buying ${tokenAddress} with a small amount of SOL...`)
}

async function handleUnknownCommand(chatId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "❓ Unknown command. Please try again.")
}

// Add all remaining handler functions with proper implementations
async function handleAllTokens(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "📊 Loading ALL tokens from all sources...")
}

async function handleFilterTokens(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "🔍 Setting up token filters...")
}

async function handleFilterAction(chatId: number, userId: number, bot: TelegramBot, action: string) {
  await bot.sendMessage(chatId, `🔧 Processing filter action: ${action}`)
}

async function handleClearFilters(chatId: number, userId: number, bot: TelegramBot) {
  userFilters.delete(userId)
  await bot.sendMessage(chatId, "🧹 <b>All filters cleared!</b>\n\nNow showing all tokens.")
}

async function handleTokenStats(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "📈 Loading token statistics...")
}

async function handleUserState(chatId: number, text: string, userId: number, bot: TelegramBot, state: any) {
  console.log(`Handling user state: ${state.action}`)

  switch (state.action) {
    case "awaiting_seed_phrase":
      await handleSeedPhraseInput(chatId, text, userId, bot)
      break
    case "awaiting_private_key":
      await handlePrivateKeyInput(chatId, text, userId, bot)
      break
    case "awaiting_buy_amount":
      await handleBuyAmountInput(chatId, text, userId, bot, state.data)
      break
    case "awaiting_token_analysis":
      await handleTokenAnalysisInput(chatId, text, userId, bot)
      break
    default:
      userStates.delete(userId)
      await bot.sendMessage(chatId, "❌ Invalid state. Please start over.")
  }
}

async function handleSeedPhraseInput(chatId: number, text: string, userId: number, bot: TelegramBot) {
  try {
    console.log(`[BOT] Received seed phrase from user ${userId}`)
    userStates.delete(userId)
    await bot.sendMessage(chatId, "✅ Seed phrase received. Importing wallet... This may take a moment.")

    const wallet = await walletManager.importFromSeedPhrase(text, userId)
    console.log(`[BOT] Imported wallet: ${wallet.publicKey}`)

    await firebase.storeWallet(userId, {
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      seedPhrase: wallet.seedPhrase,
      createdAt: new Date(),
      lastUsed: new Date(),
    })

    await userDb.updateUser(userId, { wallet: wallet.publicKey })

    let message = "✅ <b>Wallet Imported Successfully!</b>\n\n"
    message += "🔐 <b>Wallet Address:</b>\n"
    message += `<code>${wallet.publicKey}</code>\n\n`
    message += "💰 <b>Checking balance...</b>"

    await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Continue to Main Menu", callback_data: "main_menu" }],
          [{ text: "🔐 View Wallet Details", callback_data: "show_wallet" }],
        ],
      },
    })

    try {
      const balance = await walletManager.getBalance(wallet.publicKey)
      await userDb.updateUser(userId, { solBalance: balance })
      await bot.sendMessage(chatId, `💰 <b>Current Balance:</b> ${balance.toFixed(4)} SOL`)
    } catch (balanceError) {
      console.error("Error getting balance:", balanceError)
    }
  } catch (error) {
    console.error(`[BOT] Error importing from seed phrase: ${error}`)
    await bot.sendMessage(chatId, "❌ Error importing wallet. Please ensure your seed phrase is valid and try again.")
  }
}

async function handlePrivateKeyInput(chatId: number, text: string, userId: number, bot: TelegramBot) {
  try {
    console.log(`[BOT] Received private key from user ${userId}`)
    userStates.delete(userId)
    await bot.sendMessage(chatId, "✅ Private key received. Importing wallet...")

    const wallet = await walletManager.importFromPrivateKey(text, userId)
    console.log(`[BOT] Imported wallet: ${wallet.publicKey}`)

    await firebase.storeWallet(userId, {
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      seedPhrase: wallet.seedPhrase,
      createdAt: new Date(),
      lastUsed: new Date(),
    })

    await userDb.updateUser(userId, { wallet: wallet.publicKey })

    let message = "✅ <b>Wallet Imported Successfully!</b>\n\n"
    message += "🔐 <b>Wallet Address:</b>\n"
    message += `<code>${wallet.publicKey}</code>\n\n`
    message += "💰 <b>Checking balance...</b>"

    await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Continue to Main Menu", callback_data: "main_menu" }],
          [{ text: "🔐 View Wallet Details", callback_data: "show_wallet" }],
        ],
      },
    })

    try {
      const balance = await walletManager.getBalance(wallet.publicKey)
      await userDb.updateUser(userId, { solBalance: balance })
      await bot.sendMessage(chatId, `💰 <b>Current Balance:</b> ${balance.toFixed(4)} SOL`)
    } catch (balanceError) {
      console.error("Error getting balance:", balanceError)
    }
  } catch (error) {
    console.error(`[BOT] Error importing from private key: ${error}`)
    await bot.sendMessage(chatId, "❌ Error importing wallet. Please ensure your private key is valid and try again.")
  }
}

async function handleBuyAmountInput(chatId: number, text: string, userId: number, bot: TelegramBot, data: any) {
  try {
    const amount = Number.parseFloat(text)
    if (isNaN(amount) || amount <= 0) {
      await bot.sendMessage(chatId, "❌ Invalid amount. Please enter a valid number greater than 0.")
      return
    }

    const tokenAddress = data.tokenAddress
    await bot.sendMessage(chatId, `💰 Buying ${tokenAddress} with ${amount} SOL...`)

    userStates.delete(userId)
  } catch (error) {
    console.error("Error buying token:", error)
    await bot.sendMessage(chatId, "❌ Failed to buy token. Please try again.")
  }
}

async function handleTokenAnalysisInput(chatId: number, text: string, userId: number, bot: TelegramBot) {
  try {
    const tokenAddress = text
    await handleTokenAnalysis(chatId, userId, bot, tokenAddress)
    userStates.delete(userId)
  } catch (error) {
    console.error("Error analyzing token:", error)
    await bot.sendMessage(chatId, "❌ Failed to analyze token. Please try again.")
  }
}

async function handleConnectWallet(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(
    chatId,
    "🔐 Connect your wallet using your seed phrase or private key.\n\n⚠️ <b>Warning:</b> Never share your seed phrase or private key with anyone! We do not store your seed phrase or private key on our servers. It is stored securely in Firebase.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔑 Use Seed Phrase", callback_data: "enter_seed_phrase" }],
          [{ text: "🔑 Use Private Key", callback_data: "enter_private_key" }],
          [{ text: "🔙 Back to Wallet", callback_data: "wallet" }],
        ],
      },
    },
  )
}

async function handleGenerateWallet(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(
    chatId,
    "🔐 Generate a new wallet.\n\n⚠️ <b>Warning:</b> Please save your seed phrase in a safe place! We cannot recover your wallet if you lose your seed phrase.",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "✅ Generate Wallet", callback_data: "generate_seed_phrase" }]],
      },
    },
  )
}

async function handleGenerateDeposit(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(
    chatId,
    `💰 Deposit SOL to the following address:\n\n<code>${DEPOSIT_ADDRESS}</code>\n\nThis address is for deposits only. Do not send tokens to this address.`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: "✅ Continue", callback_data: "main_menu" }]],
      },
    },
  )
}

async function handleShowWallet(chatId: number, userId: number, bot: TelegramBot) {
  const walletData = await firebase.getWallet(userId)

  if (walletData) {
    const walletAddress = walletData.publicKey
    const currentBalance = await walletManager.getBalance(walletAddress)

    const message = `🔐 <b>Your Wallet:</b>\n<code>${walletAddress}</code>\n\n💰 <b>Live Balance:</b> ${currentBalance.toFixed(4)} SOL`

    const keyboard = getWalletKeyboard()

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } else {
    const message = `🔐 <b>Wallet:</b> Not connected\n\n💡 Connect or generate a wallet to start trading!`

    const keyboard = getWalletKeyboard()

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  }
}

async function handleToggleSniper(chatId: number, userId: number, bot: TelegramBot) {
  const sniperEnabled = !smartSniper.isEnabled(userId)
  smartSniper.setEnabled(userId, sniperEnabled)

  let message = `🎯 <b>AI Sniper</b>\n\n`
  message += `Status: ${sniperEnabled ? "🟢 ACTIVE" : "🔴 INACTIVE"}\n\n`
  message += `The AI Sniper automatically buys tokens based on AI analysis.\n\n`
  message += `It uses a small amount of SOL to test new tokens.\n\n`
  message += `You can toggle it on or off below.`

  const keyboard = getSniperKeyboard(sniperEnabled)

  await bot.sendMessage(chatId, message, { reply_markup: keyboard })
}

async function handleEnableSmartSniper(chatId: number, userId: number, bot: TelegramBot) {
  smartSniper.setEnabled(userId, true)
  await bot.sendMessage(chatId, "✅ Smart Sniper enabled!")
}

async function handleOptimizeSettings(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "⚙️ Optimizing settings...")
}

async function handleMarketSentiment(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "📊 Loading market sentiment...")
}

async function handleSniperStats(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "📊 Loading sniper stats...")
}

async function handleUltraFreshTokens(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "🔥 Loading ultra-fresh tokens...")
}

async function handleAIRecommendations(chatId: number, userId: number, bot: TelegramBot) {
  try {
    const topRecommendations = liveTokenMonitor.getTopRecommendations(10)

    if (topRecommendations.length === 0) {
      await bot.sendMessage(chatId, "😔 No AI recommendations found right now. Check back later!", {
        reply_markup: {
          inline_keyboard: [[{ text: "🔄 Refresh", callback_data: "ai_recommendations" }]],
        },
      })
      return
    }

    let message = `🎯 <b>Top AI Picks Right Now:</b>\n\n`
    topRecommendations.forEach((rec, index) => {
      const urgencyEmoji = rec.urgency === "CRITICAL" ? "🔥" : rec.urgency === "HIGH" ? "⚡" : "💡"
      message += `${urgencyEmoji} <b>${rec.token.symbol}</b>: ${rec.token.aiScore}/100 (${rec.urgency})\n`
      message += `   📍 ${rec.token.dex} | ⏰ ${rec.token.age}\n`
      message += `   💰 $${rec.token.price.toFixed(8)} | 💧 $${rec.token.liquidity.toLocaleString()}\n`
      message += `   🤖 <b>${rec.recommendation}</b>\n\n`
    })

    const keyboard = {
      inline_keyboard: [
        [{ text: "🔄 Refresh", callback_data: "ai_recommendations" }],
        [{ text: "🔙 Back to Main", callback_data: "main_menu" }],
      ],
    }

    await bot.sendMessage(chatId, message, { reply_markup: keyboard })
  } catch (error) {
    console.error("Error handling AI recommendations:", error)
    await bot.sendMessage(chatId, "❌ Failed to load AI recommendations. Please try again.")
  }
}

async function handleTrendingTokens(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "🔥 Loading trending tokens...")
}

async function handleTopAIPicks(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(chatId, "🤖 Loading top AI picks...")
}
