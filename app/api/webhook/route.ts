// app/api/webhook/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const update = await request.json()
    console.log("MINIMAL TEST - Received update:", JSON.stringify({
      update_id: update.update_id,
      text: update.message?.text || update.callback_query?.data
    }))

    // IMMEDIATE response
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error("MINIMAL TEST ERROR:", error)
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "Minimal test endpoint",
    instruction: "POST a Telegram update JSON to test"
  })
}