// middleware.ts
import { DEFAULT_LOCALE, LOCALES } from "@/lib/optimizely/utils/language"
import { createUrl, leadingSlashUrlPath } from "@/lib/utils"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import Negotiator from "negotiator"
import { COOKIE_NAME_USER_ID } from "./lib/optimizely-feature-exp/cookies"

const COOKIE_NAME_LOCALE = "__LOCALE_NAME"
const HEADER_KEY_LOCALE = "X-Locale"

const EXPERIMENT_PAGES = process.env.EXPERIMENT_PAGES
  ? new Set(process.env.EXPERIMENT_PAGES.split(",").map((path) => path.trim()))
  : new Set<string>()

function hasExperiments(pathname: string): boolean {
  // Remove locale from pathname for checking
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "") || "/"

  // Check exact match first
  if (EXPERIMENT_PAGES.has(pathWithoutLocale)) {
    return true
  }

  // Check for dynamic routes (e.g., /product/[slug] matches /product/abc)
  for (const experimentPath of EXPERIMENT_PAGES) {
    if (experimentPath.includes("[") && experimentPath.includes("]")) {
      // Convert dynamic route to regex pattern
      const regexPattern = experimentPath
        .replace(/\[([^\]]+)\]/g, "([^/]+)") // Replace [slug] with ([^/]+)
        .replace(/\//g, "\\/") // Escape forward slashes

      const regex = new RegExp(`^${regexPattern}$`)
      if (regex.test(pathWithoutLocale)) {
        return true
      }
    }
  }

  return false
}

function shouldExclude(path: string) {
  return path.startsWith("/static") || path.includes("/api/") || path.includes(".")
}

function getBrowserLanguage(request: NextRequest, locales: string[]): string | undefined {
  const headerLanguage = request.headers.get("Accept-Language")
  if (!headerLanguage) {
    return undefined
  }

  // Create a negotiator instance with the Accept-Language header
  const languages = new Negotiator({
    headers: { "accept-language": headerLanguage },
  }).languages()

  // Find the first language that matches our supported locales
  for (const lang of languages) {
    // Check for exact match
    if (locales.includes(lang)) {
      return lang
    }

    // Check for language match without region (e.g., 'pl-PL' should match 'pl')
    const langPrefix = lang.split("-")[0]
    if (locales.includes(langPrefix)) {
      return langPrefix
    }
  }

  return undefined
}

function getLocale(request: NextRequest, locales: string[]): string {
  // First check if there's a locale cookie
  const cookieLocale = request.cookies.get(COOKIE_NAME_LOCALE)?.value
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }

  // If no cookie, try to use browser language
  const browserLang = getBrowserLanguage(request, locales)
  if (browserLang && locales.includes(browserLang)) {
    return browserLang
  }

  // Fall back to default locale
  return DEFAULT_LOCALE
}

function updateLocaleCookies(request: NextRequest, response: NextResponse, locale?: string): void {
  const cookieLocale = request.cookies.get(COOKIE_NAME_LOCALE)?.value
  const userdIdValue = request.cookies.get(COOKIE_NAME_USER_ID)?.value
  const newLocale = locale || null

  if (newLocale !== cookieLocale) {
    if (newLocale) {
      response.cookies.set(COOKIE_NAME_LOCALE, newLocale)
    } else {
      response.cookies.delete(COOKIE_NAME_LOCALE)
    }
  }

  if (!userdIdValue) {
    response.cookies.set(COOKIE_NAME_USER_ID, Math.random().toString(36).substring(2))
  }

  if (newLocale) {
    response.headers.append(HEADER_KEY_LOCALE, newLocale)
  } else {
    response.headers.delete(HEADER_KEY_LOCALE)
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  let response = NextResponse.next()

  if (shouldExclude(pathname)) {
    return response
  }

  const localeInPathname = LOCALES.find((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)

  if (localeInPathname) {
    const pathnameWithoutLocale = pathname.replace(`/${localeInPathname}`, "")

    if (hasExperiments(pathname)) {
      const expUrl = createUrl(
        `/${localeInPathname}/exp${leadingSlashUrlPath(pathnameWithoutLocale)}`,
        request.nextUrl.searchParams,
      )
      response = NextResponse.rewrite(new URL(expUrl, request.url))
    } else {
      const newUrl = createUrl(
        `/${localeInPathname}${leadingSlashUrlPath(pathnameWithoutLocale)}`,
        request.nextUrl.searchParams,
      )
      response = NextResponse.rewrite(new URL(newUrl, request.url))
    }

    updateLocaleCookies(request, response, localeInPathname)
    return response
  }

  // Get locale with browser language preference
  const locale = getLocale(request, LOCALES)

  if (hasExperiments(`/${locale}${pathname}`)) {
    const expUrl = createUrl(`/${locale}/exp${leadingSlashUrlPath(pathname)}`, request.nextUrl.searchParams)
    response =
      locale === DEFAULT_LOCALE
        ? NextResponse.rewrite(new URL(expUrl, request.url))
        : NextResponse.redirect(new URL(expUrl, request.url))
  } else {
    const newUrl = createUrl(`/${locale}${leadingSlashUrlPath(pathname)}`, request.nextUrl.searchParams)
    response =
      locale === DEFAULT_LOCALE
        ? NextResponse.rewrite(new URL(newUrl, request.url))
        : NextResponse.redirect(new URL(newUrl, request.url))
  }

  updateLocaleCookies(request, response, locale)
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
