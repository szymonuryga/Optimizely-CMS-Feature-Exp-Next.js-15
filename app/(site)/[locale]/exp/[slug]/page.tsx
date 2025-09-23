// app/[locale]/exp/[slug]/page.tsx
import ContentAreaMapper from '@/components/content-area/mapper'
import VisualBuilderExperienceWrapper from '@/components/visual-builder/wrapper'
import { getCmsSaasContentVariation } from '@/flags'
import { optimizely } from '@/lib/optimizely/fetch'
import { SafeVisualBuilderExperience } from '@/lib/optimizely/types/experience'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { generateAlternates } from '@/lib/utils/metadata'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug?: string }>
}): Promise<Metadata> {
  const { locale, slug = '' } = await props.params
  const locales = getValidLocale(locale)
  const formattedSlug = `/${slug}`
  const { data, errors } = await optimizely.getPageByURL({
    locales: [locales],
    slug: formattedSlug,
  })

  if (errors) {
    return {}
  }

  const page = data?.CMSPage?.item
  if (!page) {
    const experienceData = await optimizely.GetVisualBuilderBySlug({
      locales: [locales],
      slug: formattedSlug,
    })

    const experience = experienceData.data?.SEOExperience?.item

    if (experience) {
      return {
        title: experience?.title,
        description: experience?.shortDescription || '',
        keywords: experience?.keywords ?? '',
        alternates: generateAlternates(locale, formattedSlug),
      }
    }

    return {}
  }

  return {
    title: page.title,
    description: page.shortDescription || '',
    keywords: page.keywords ?? '',
    alternates: generateAlternates(locale, formattedSlug),
  }
}

export default async function CmsPage(props: {
  params: Promise<{ locale: string; slug?: string }>
}) {
  const { locale, slug = '' } = await props.params
  const locales = getValidLocale(locale)
  const formattedSlug = `/${slug}`
  const variationKey = await getCmsSaasContentVariation()

  const { data, errors } = await optimizely.getPageByURLWithVariation({
    locales: [locales],
    slug: formattedSlug,
    variationKey,
  })

  if (errors || !data?.CMSPage?.item?._modified) {
    const experienceData = await optimizely.GetVisualBuilderBySlugWithVariation(
      {
        locales: [locales],
        slug: formattedSlug,
        variationKey,
      }
    )

    const experience = experienceData.data?.SEOExperience?.item as
      | SafeVisualBuilderExperience
      | undefined

    if (experience) {
      return (
        <Suspense>
          <VisualBuilderExperienceWrapper experience={experience} />
        </Suspense>
      )
    }

    return notFound()
  }

  const page = data.CMSPage.item
  const blocks = (page?.blocks ?? []).filter(
    (block) => block !== null && block !== undefined
  )

  return (
    <>
      <Suspense>
        <ContentAreaMapper blocks={blocks} />
      </Suspense>
    </>
  )
}
