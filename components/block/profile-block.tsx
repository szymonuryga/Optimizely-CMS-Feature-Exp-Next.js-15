import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ProfileBlock as ProfileBlockProps } from '@/lib/optimizely/types/generated'
import { BlockBase } from '@/lib/optimizely/types/block'
import { cva } from 'class-variance-authority'
import { TrackedButton } from '../ui/tracked-button'

type ProfileBlockPropsV2 = ProfileBlockProps & BlockBase

const backgroundVariants = cva('container mx-auto px-4 py-16', {
  variants: {
    colorScheme: {
      default: 'border-none bg-[#f9e6f0] text-[#2d2d2d]',
      primary: 'border-none bg-primary text-white',
      secondary: 'border-none bg-secondary text-secondary-foreground',
    },
  },
  defaultVariants: {
    colorScheme: 'default',
  },
})

export default function ProfileBlock({
  imageSrc,
  name,
  title,
  bio,
  isFirst,
  button_cta,
  displaySettings,
}: ProfileBlockPropsV2) {
  const colorScheme =
    displaySettings?.find((setting) => setting.key === 'colorScheme')?.value ||
    'default'

  return (
    <section className="container mx-auto px-4 py-16">
      <Card
        className={backgroundVariants({
          colorScheme: colorScheme as 'default' | 'primary' | 'secondary',
        })}
      >
        <CardContent className="p-8">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <Image
                src={imageSrc || '/placeholder.svg'}
                alt={title ?? ''}
                fill
                className="rounded-lg object-cover"
                priority={isFirst}
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold" data-epi-edit="name">
                {name}
              </h1>
              <p className="text-xl" data-epi-edit="title">
                {title}
              </p>
              <div className="mt-6">
                <h2 className="mb-2 text-lg font-semibold">Bio:</h2>
                <p className="leading-relaxed" data-epi-edit="bio">
                  {bio}
                </p>
              </div>
              {button_cta?.url?.default && (
                <div className="mt-8">
                  <TrackedButton
                    size="lg"
                    className="w-full md:w-auto"
                    asChild
                    trackingText={button_cta.text ?? ''}
                  >
                    <Link href={button_cta?.url?.default}>
                      {button_cta.text}
                    </Link>
                  </TrackedButton>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
