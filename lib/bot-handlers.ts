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
const userFilters = new Map<number, TokenFilters>()

// Start live token monitoring
liveTokenMonitor.startLiveMonitoring()

// ======================
// VALIDATION HELPERS
// ======================
function isValidSeedPhrase(phrase: string): boolean {
  const words = phrase.trim().split(/\s+/)
  return words.length >= 12 && words.every(w => w.length >= 3)
}

function isValidPrivateKey(key: string): boolean {
  // Supports:
  // - Base58 strings (44 chars)
  // - JSON arrays ([1,2,3,...])
  // - Comma-separated values
  return (
    (key.length >= 30 && /^[A-Za-z0-9]+$/.test(key)) || // Base58
    (key.startsWith('[') && key.endsWith(']')) ||        // JSON array
    (key.includes(',') && key.split(',').length >= 30)    // CSV
  )
}

function truncateSensitiveData(data: string, visibleChars = 4): string {
  if (!data) return ''
  if (data.length <= visibleChars * 2) return '••••••••'
  return `${data.substring(0, visibleChars)}••••${data.slice(-visibleChars)}`
}

// ======================
// WALLET HANDLERS (FIXED)
// ======================
async function handleEnterSeedPhrase(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(
    chatId,
    "🔑 <b>Enter Your Seed Phrase</b>\n\n" +
      "Format: 12-24 words separated by spaces\n\n" +
      "⚠️ <b>SECURITY CHECK:</b>\n" +
      "1. Check this is a PRIVATE chat\n" +
      "2. Never share your seed phrase\n" +
      "3. We'll show a confirmation\n\n" +
      "Type your seed phrase:",
    { parse_mode: 'HTML' }
  )
  userStates.set(userId, { action: "awaiting_seed_phrase" })
}

async function handleEnterPrivateKey(chatId: number, userId: number, bot: TelegramBot) {
  await bot.sendMessage(
    chatId,
    "🔑 <b>Enter Your Private Key</b>\n\n" +
      "Supported formats:\n" +
      "• Base58 string (recommended)\n" +
      "• JSON array: [1,2,3,...]\n" +
      "• Comma-separated: 1,2,3,...\n\n" +
      "⚠️ <b>SECURITY CHECK:</b>\n" +
      "1. Check this is a PRIVATE chat\n" +
      "2. Never share your private key\n" +
      "3. We'll show a confirmation\n\n" +
      "Paste your private key:",
    { parse_mode: 'HTML' }
  )
  userStates.set(userId, { action: "awaiting_private_key" })
}

async function handleSeedPhraseInput(chatId: number, text: string, userId: number, bot: TelegramBot) {
  try {
    console.log(`[SEED INPUT] User ${userId} submitted seed phrase (first/last 3 chars): ${
      text.substring(0, 3)}...${text.slice(-3)}`)

    if (!isValidSeedPhrase(text)) {
      throw new Error("Invalid seed phrase - must be 12+ words")
    }

    // Create temporary wallet to validate
    const wallet = await walletManager.importFromSeedPhrase(text, userId)
    console.log(`[SEED VALIDATION] Derived public key: ${wallet.publicKey}`)

    // Request confirmation
    const words = text.trim().split(/\s+/)
    const confirmationMessage = `🔐 <b>Please confirm your seed phrase:</b>\n\n` +
      `First 3 words: <code>${words.slice(0, 3).join(' ')}</code>\n` +
      `Last 3 words: <code>${words.slice(-3).join(' ')}</code>\n\n` +
      `Reply <b>YES</b> to confirm or <b>NO</b> to cancel`

    await bot.sendMessage(chatId, confirmationMessage, { parse_mode: 'HTML' })
    userStates.set(userId, {
      action: "confirm_seed_phrase",
      data: {
        rawInput: text.trim(),
        derivedWallet: wallet
      }
    })

  } catch (error) {
    console.error(`[SEED ERROR] ${error.message}`)
    await bot.sendMessage(
      chatId,
      `❌ <b>Invalid Seed Phrase</b>\n\n` +
      `Must be 12-24 words separated by spaces\n\n` +
      `Example:\n<code>word1 word2 ... word12</code>\n\n` +
      `Please try again:`,
      { parse_mode: 'HTML' }
    )
  }
}

async function handlePrivateKeyInput(chatId: number, text: string, userId: number, bot: TelegramBot) {
  try {
    console.log(`[PRIVATE KEY INPUT] User ${userId} submitted key (first/last 3 chars): ${
      text.substring(0, 3)}...${text.slice(-3)}`)

    if (!isValidPrivateKey(text)) {
      throw new Error("Invalid private key format")
    }

    // Create temporary wallet to validate
    const wallet = await walletManager.importFromPrivateKey(text, userId)
    console.log(`[PRIVATE KEY VALIDATION] Derived public key: ${wallet.publicKey}`)

    // Request confirmation
    const confirmationMessage = `🔐 <b>Please confirm your private key:</b>\n\n` +
      `First/last 4 chars: <code>${truncateSensitiveData(text)}</code>\n\n` +
      `Derived address: <code>${wallet.publicKey}</code>\n\n` +
      `Reply <b>YES</b> to confirm or <b>NO</b> to cancel`

    await bot.sendMessage(chatId, confirmationMessage, { parse_mode: 'HTML' })
    userStates.set(userId, {
      action: "confirm_private_key",
      data: {
        rawInput: text.trim(),
        derivedWallet: wallet
      }
    })

  } catch (error) {
    console.error(`[PRIVATE KEY ERROR] ${error.message}`)
    await bot.sendMessage(
      chatId,
      `❌ <b>Invalid Private Key</b>\n\n` +
      `Supported formats:\n` +
      `• Base58 (44 chars)\n` +
      `• JSON array: [1,2,3,...]\n` +
      `• Comma-separated: 1,2,3,...\n\n` +
      `Please try again:`,
      { parse_mode: 'HTML' }
    )
  }
}

async function handleGenerateSeedPhrase(chatId: number, userId: number, bot: TelegramBot) {
  try {
    console.log(`[WALLET GENERATION] Creating new wallet for user ${userId}`)
    const wallet = await walletManager.createWallet(userId)

    // DEBUG: Log generated wallet (truncated)
    console.log(`[WALLET GENERATED]`, {
      publicKey: wallet.publicKey,
      privateKey: truncateSensitiveData(wallet.privateKey),
      seedPhrase: wallet.seedPhrase?.split(' ').slice(0, 2).join(' ') + '...'
    })

    // Store in Firebase
    await firebase.storeWallet(userId, {
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      seedPhrase: wallet.seedPhrase,
      createdAt: new Date(),
      lastUsed: new Date()
    })

    // Format response message
    const message = `✅ <b>New Wallet Generated</b>\n\n` +
      `Address: <code>${wallet.publicKey}</code>\n\n` +
      `🔐 <b>Seed Phrase (SAVE THIS):</b>\n` +
      `<code>${wallet.seedPhrase}</code>\n\n` +
      `🔑 <b>Private Key:</b>\n` +
      `<code>${truncateSensitiveData(wallet.privateKey)}</code>\n\n` +
      `⚠️ <b>Store these securely!</b> We cannot recover them.`

    await bot.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ I've Saved My Seed Phrase", callback_data: "main_menu" }]
        ]
      }
    })

  } catch (error) {
    console.error(`[WALLET GENERATION ERROR]`, error)
    await bot.sendMessage(
      chatId,
      "❌ Failed to generate wallet. Please try again later.",
      { parse_mode: 'HTML' }
    )
  }
}

// ======================
// STATE HANDLER (UPDATED)
// ======================
async function handleUserState(chatId: number, text: string, userId: number, bot: TelegramBot, state: any) {
  console.log(`[STATE HANDLER] Processing state: ${state.action}`)

  try {
    switch (state.action) {
      case "confirm_seed_phrase":
        if (text.toLowerCase() === 'yes') {
          console.log(`[SEED CONFIRMED] Storing wallet for user ${userId}`)
          await firebase.storeWallet(userId, {
            publicKey: state.data.derivedWallet.publicKey,
            privateKey: state.data.derivedWallet.privateKey,
            seedPhrase: state.data.rawInput, // Store original input
            createdAt: new Date(),
            lastUsed: new Date()
          })
          await bot.sendMessage(chatId, "✅ Wallet imported successfully!")
        } else {
          await bot.sendMessage(chatId, "❌ Import cancelled. Your seed phrase was NOT stored.")
        }
        userStates.delete(userId)
        break

      case "confirm_private_key":
        if (text.toLowerCase() === 'yes') {
          console.log(`[PRIVATE KEY CONFIRMED] Storing wallet for user ${userId}`)
          await firebase.storeWallet(userId, {
            publicKey: state.data.derivedWallet.publicKey,
            privateKey: state.data.rawInput, // Store original input
            seedPhrase: null,
            createdAt: new Date(),
            lastUsed: new Date()
          })
          await bot.sendMessage(chatId, "✅ Wallet imported successfully!")
        } else {
          await bot.sendMessage(chatId, "❌ Import cancelled. Your private key was NOT stored.")
        }
        userStates.delete(userId)
        break

      // ... other state cases ...

      default:
        console.warn(`[UNKNOWN STATE]`, state)
        await bot.sendMessage(chatId, "⚠️ Session expired. Please start over.")
        userStates.delete(userId)
    }
  } catch (error) {
    console.error(`[STATE HANDLER ERROR]`, error)
    await bot.sendMessage(chatId, "❌ An error occurred. Please start over.")
    userStates.delete(userId)
  }
}

// ======================
// CORE COMMAND HANDLER
// ======================
export async function handleBotCommand(
  chatId: number,
  text: string,
  userId: number,
  bot: TelegramBot,
  isCallback = false
) {
  try {
    console.log(`[COMMAND] User ${userId}: ${text}`)

    // Initialize user if not exists
    await userDb.initUser(userId)

    // Handle callback queries
    if (isCallback) {
      await handleCallbackQuery(chatId, text, userId, bot)
      return
    }

    // Check for multi-step processes
    const userState = userStates.get(userId)
    if (userState) {
      await handleUserState(chatId, text, userId, bot, userState)
      return
    }

    // ... rest of your existing command handling logic ...
    // (keep all your other command handlers as-is)

  } catch (error) {
    console.error(`[COMMAND ERROR]`, error)
    await bot.sendMessage(chatId, "❌ An error occurred. Please try again.")
  }
}

// ... rest of your existing code (other handlers) ...