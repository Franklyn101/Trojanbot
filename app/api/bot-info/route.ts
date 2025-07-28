import { NextResponse } from "next/server"

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "8060712008:AAHxjTEDoMdO5G4AdW30yxf1fRsFYb34lGI"

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    const result = await response.json()

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get bot info",
      },
      { status: 500 },
    )
  }
}
