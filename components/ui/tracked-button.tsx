'use client'

import * as React from 'react'
import { Button, type buttonVariants } from './button'
import type { VariantProps } from 'class-variance-authority'
import { trackButtonClickedAction } from '@/lib/actions/track-button-clicked'

interface TrackedButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  trackingText?: string
  colorScheme?: "default" | "primary" | "secondary" 
}

const getVariantForColorScheme = (colorScheme?: string, currentVariant?: string) => {
  // If variant is already specified, use it
  if (currentVariant && currentVariant !== "default") {
    return currentVariant
  }

  // Map colorScheme to appropriate variant for visibility
  switch (colorScheme) {
    case "primary":
      return "secondary" // Use secondary variant on primary background for contrast
    case "secondary":
      return "default" // Use default variant on secondary background
    case "default":
    default:
      return "outline" // Use outline variant on default pink background for better visibility
  }
}

const TrackedButton = React.forwardRef<HTMLButtonElement, TrackedButtonProps>(
  ({ children, onClick, trackingText, colorScheme, variant, asChild = false, ...props }, ref) => {
    const finalVariant = getVariantForColorScheme(colorScheme, variant as string) as VariantProps<
      typeof buttonVariants
    >["variant"]
    
    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      // Extract text content for tracking
      const buttonText =
        trackingText ||
        (typeof children === 'string'
          ? children
          : event.currentTarget.textContent || 'Unknown Button')

      try {
        // Track the button click using server action
        const result = await trackButtonClickedAction({ buttonText })
        if (!result.success) {
          console.error('Tracking failed:', result.error)
        }
      } catch (error) {
        console.error('Failed to track button click:', error)
        // Continue with the original click handler even if tracking fails
      }

      // Call the original onClick handler if provided
      if (onClick) {
        onClick(event)   
      }
    }

    if (asChild) {
      return (
        <Button asChild ref={ref} onClick={handleClick} variant={finalVariant} {...props}>
          {children}
        </Button>
      )
    }

    return (
      <Button ref={ref} onClick={handleClick} variant={finalVariant} {...props}>
        {children}
      </Button>
    )
  }
)

TrackedButton.displayName = 'TrackedButton'

export { TrackedButton }
