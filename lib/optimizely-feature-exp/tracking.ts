import { cookies } from 'next/headers'
import { getOptimizelyInstance } from '.'
import { EventTags } from '@optimizely/optimizely-sdk'
import { COOKIE_NAME_USER_ID } from './cookies'

export async function trackButtonClicked({
  buttonText,
}: {
  buttonText?: string
}) {
  const optimizely = await getOptimizelyInstance()

  if (!optimizely) {
    throw new Error('Failed to create client')
  }

  await optimizely.onReady({ timeout: 500 })

  const cookieStore = await cookies()
  const userdIdValue = cookieStore.get(COOKIE_NAME_USER_ID)?.value
  const userId = userdIdValue
    ? userdIdValue
    : Math.random().toString(36).substring(2)
  const context = optimizely!.createUserContext(userId)

  if (!context) {
    throw new Error('Failed to create user context')
  }

  const properties = {
    Text: buttonText ?? '',
  }

  const tags = {
    $opt_event_properties: properties,
  }

  context.trackEvent('cta-clicked', tags as unknown as EventTags)
}
