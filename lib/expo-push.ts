const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
}

export async function sendExpoPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    })
  } catch (e) {
    console.error('Expo push send failed:', e)
    // Fire-and-forget — never throw
  }
}
