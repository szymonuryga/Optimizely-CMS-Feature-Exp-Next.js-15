'use server'

import { trackButtonClicked } from '../optimizely-feature-exp/tracking'

export async function trackButtonClickedAction({
  buttonText,
}: {
  buttonText?: string
}) {
  try {
    await trackButtonClicked({ buttonText })

    return { success: true }
  } catch (error) {
    console.error('Failed to track button click:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
