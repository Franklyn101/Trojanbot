

export class TelegramBot {
  private botToken: string
  private apiUrl: string

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || "8060712008:AAH8Mp308HHmAdAcr6mp4IM1Pv0HFQRQpCc"
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`
  }

  // Send message to user
  async sendMessage(chatId: number, text: string, options?: any) {
    try {
      console.log(`📤 Sending message to ${chatId}: ${text.substring(0, 100)}...`)

      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          ...options,
        }),
      })

      const result = await response.json()

      if (!result.ok) {
        console.error("❌ Telegram API error:", result)
        throw new Error(`Telegram API error: ${result.description}`)
      }

      console.log("✅ Message sent successfully")
      return result
    } catch (error) {
      console.error("❌ Error sending message:", error)
      throw error
    }
  }

  // Edit a previously sent message
  async editMessage(chatId: number, messageId: number, text: string, options?: any) {
    try {
      const response = await fetch(`${this.apiUrl}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: "HTML",
          ...options,
        }),
      })

      const result = await response.json()

      if (!result.ok) {
        console.error("❌ Telegram API error (edit):", result)
      }

      return result
    } catch (error) {
      console.error("❌ Error editing message:", error)
      throw error
    }
  }

  // Answer callback query (e.g. from inline buttons)
  async answerCallbackQuery(callbackQueryId: string, text?: string) {
    try {
      const response = await fetch(`${this.apiUrl}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
        }),
      })

      return response.json()
    } catch (error) {
      console.error("❌ Error answering callback query:", error)
      throw error
    }
  }

  // 🔍 Get bot info to verify the token
  async getBotInfo() {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`)
      const result = await response.json()
      console.log("🤖 Bot Info:", result)
      return result
    } catch (error) {
      console.error("❌ Failed to fetch bot info:", error)
      throw error
    }
  }

  // 📡 Set webhook for Telegram updates
  async setWebhook(url: string) {
    try {
      const response = await fetch(`${this.apiUrl}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const result = await response.json()
      console.log("📡 Webhook Set Result:", result)
      return result
    } catch (error) {
      console.error("❌ Error setting webhook:", error)
      throw error
    }
  }

  // ❌ Delete existing webhook (good before reset)
  async deleteWebhook() {
    try {
      const response = await fetch(`${this.apiUrl}/deleteWebhook`, { method: "POST" })
      const result = await response.json()
      console.log("🗑️ Webhook Deleted:", result)
      return result
    } catch (error) {
      console.error("❌ Error deleting webhook:", error)
      throw error
    }
  }

  // 👁️‍🗨️ Check current webhook status
  async getWebhookInfo() {
    try {
      const response = await fetch(`${this.apiUrl}/getWebhookInfo`)
      const result = await response.json()
      console.log("ℹ️ Webhook Info:", result)
      return result
    } catch (error) {
      console.error("❌ Error getting webhook info:", error)
      throw error
    }
  }
}
