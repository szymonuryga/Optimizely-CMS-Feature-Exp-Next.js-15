import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { OPTIMIZELY_DATAFILE_TAG } from '@/lib/optimizely-feature-exp'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // Read the request body once
    const text = await req.text()

    // Verify the webhook request came from Optimizely
    const isVerified = await verifyOptimizelyWebhook(req.headers, text)

    if (!isVerified) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook request' },
        { status: 401 }
      )
    }

    revalidateTag(OPTIMIZELY_DATAFILE_TAG)
    console.log('Revalidating Optimizely datafile tag')
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function verifyOptimizelyWebhook(
  headers: Headers,
  body: string
): Promise<boolean> {
  try {
    const WEBHOOK_SECRET = process.env.OPTIMIZELY_FEATURE_EXP_WEBHOOK_SECRET
    if (!WEBHOOK_SECRET) {
      throw new Error(
        'Missing OPTIMIZELY_FEATURE_EXP_WEBHOOK_SECRET environment variable'
      )
    }

    const signature = headers.get('X-Hub-Signature')
    if (!signature) {
      throw new Error('Missing X-Hub-Signature header')
    }

    const [algorithm, hash] = signature.split('=')
    if (algorithm !== 'sha1' || !hash) {
      throw new Error('Invalid signature format')
    }

    const hmac = crypto.createHmac('sha1', WEBHOOK_SECRET)
    const digest = hmac.update(body).digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(digest, 'hex')
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error verifying webhook:', error?.message)
    return false
  }
}
