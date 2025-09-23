import * as flags from '../../../../flags'
import { getProviderData, createFlagsDiscoveryEndpoint } from 'flags/next'

export const dynamic = 'force-dynamic'

// This function handles the authorization check for you
export const GET = createFlagsDiscoveryEndpoint(async () => {
  // your previous logic in here to gather your feature flags
  const apiData = getProviderData(flags)

  // return the ApiData directly, without a NextResponse.json object.
  return apiData
})
