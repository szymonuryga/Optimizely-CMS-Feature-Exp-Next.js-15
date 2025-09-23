import optimizelySdk from '@optimizely/optimizely-sdk'

export async function fetchDatafileFromCDN() {
  const sdkKey = process.env.OPTIMIZELY_FEATURE_EXP_API_KEY

  try {
    const response = await fetch(
      `https://cdn.optimizely.com/datafiles/${sdkKey}.json`,
      {
        next: { tags: [OPTIMIZELY_DATAFILE_TAG] },
      }
    )
    const responseJson = await response.json()
    return responseJson
  } catch (error) {
    console.log(error)
  }
}

export const OPTIMIZELY_DATAFILE_TAG = 'optimizely_datafile'

export async function getOptimizelyInstance() {
  const datafile = await fetchDatafileFromCDN()

  const optimizelyInstance = optimizelySdk.createInstance({
    datafile: datafile as object,
  })

  return optimizelyInstance
}
