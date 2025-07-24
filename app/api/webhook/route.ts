import { type NextRequest, NextResponse } from "next/server"
import { TelegramBot } from "@/lib/telegram-bot"
import { handleBotCommand } from "@/lib/bot-handlers"

// Initialize bot instance
const bot = new TelegramBot()

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing
    externalResolver: true, // Mark as external resolver
  },
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify token is available
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is missing")
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
    }

    // 2. Parse update once
    const update = await request.json()
    console.log("RAW UPDATE:", JSON.stringify({
      update_id: update.update_id,
      message: update.message ? { text: update.message.text, chat_id: update.message.chat.id } : null,
      callback_query: update.callback_query ? { data: update.callback_query.data } : null
    }))

    // 3. Immediately respond to Telegram
    const response = NextResponse.json({ ok: true })
    
    // 4. Process update asynchronously (don't await)
    processUpdate(update).catch(error => {
      console.error("Async processing error:", error)
    })

    return response

  } catch (error) {
    console.error("WEBHOOK ERROR:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

// Async update processor
async function processUpdate(update: any) {
  try {
    if (update.message) {
      await handleMessage(update.message)
    } else if (update.callback_query) {
      await handleCallback(update.callback_query)
    }
  } catch (error) {
    console.error("Update processing failed:", error)
  }
}

async function handleMessage(message: any) {
  const { chat, from, text } = message
  console.log(`Processing message from ${from.id}: ${text}`)
  
  try {
    await handleBotCommand(chat.id, text, from.id, bot)
  } catch (error) {
    console.error("Message handling failed:", error)
    // Optionally send error message to user
    await bot.sendMessage(chat.id, "⚠️ Command processing failed").catch(console.error)
  }
}

async function handleCallback(callbackQuery: any) {
  const { message, from, data, id } = callbackQuery
  console.log(`Processing callback from ${from.id}: ${data}`)
  
  try {
    if (data === "import_seed") {
      await handleImportSeed(message.chat.id, from.id, bot)
    } else if (data === "import_private") {
      await handleImportPrivate(message.chat.id, from.id, bot)
    } else {
      await handleBotCommand(message.chat.id, data, from.id, bot, true)
    }
    await bot.answerCallbackQuery(id)
  } catch (error) {
    console.error("Callback handling failed:", error)
    await bot.answerCallbackQuery(id, { text: "Action failed" }).catch(console.error)
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Operational",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  })
}