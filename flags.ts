import { reportValue } from 'flags'
import { flag } from 'flags/next'
import { COOKIE_NAME_USER_ID } from '@/lib/optimizely-feature-exp/cookies'
import { getOptimizelyInstance } from './lib/optimizely-feature-exp'

export const getCmsSaasContentVariation = flag<string>({
  key: 'cms-saas-content-variation',
  defaultValue: 'original',
  description: 'Get CMS SaaS Content Variation Key',
  options: [
    { value: 'Original', label: 'Original' },
    { value: 'Variation1', label: 'Variation1' },
    { value: 'Variation2', label: 'Variation2' },
  ],
  async decide({ cookies }) {
    const optimizely = await getOptimizelyInstance()
    let flag = 'original'

    try {
      if (!optimizely) {
        throw new Error('Failed to create client')
      }

      await optimizely.onReady({ timeout: 500 })
      const userdIdValue = cookies.get(COOKIE_NAME_USER_ID)?.value
      const userId = userdIdValue
        ? userdIdValue
        : Math.random().toString(36).substring(2)
      const context = optimizely!.createUserContext(userId)

      if (!context) {
        throw new Error('Failed to create user context')
      }

      const decision = context.decide('opticon-portfolio-demo')
      flag =
        (decision?.variables?.['cms-saas-content-variation'] as string) ??
        'original'
    } catch (error) {
      console.error('Optimizely error:', error)
    } finally {
      reportValue('cms-saas-content-variation', flag)
      return flag
    }
  },
})

export const precomputeFlags = [] as const
