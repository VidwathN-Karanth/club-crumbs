import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isDevAuthBypass } from "./lib/devAuth";

// Routes that require a signed-in account.
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/admin(.*)',
  '/leader(.*)',
  '/choose-access(.*)'
]);

/**
 * Middleware does ONE thing now: send unauthenticated visitors to our own
 * /login page. It deliberately does NOT resolve the account's email or roles.
 *
 * Role routing (which console, the multi-role chooser, the roster gate) used to
 * live here, which meant every protected navigation resolved the email — and
 * when the Clerk session token carries no email (the default), that was a Clerk
 * Backend API call per navigation. A multi-role redirect chain multiplied those
 * into Clerk's rate limit ("429 too many requests"), which broke sign-in.
 *
 * All of that now happens once, on the client, in SyncProvider using /api/me —
 * loop-safe and with no per-navigation backend calls. Every API route still
 * enforces access on its own, so nothing here is a security boundary.
 */
export default clerkMiddleware(async (auth, req) => {
  if (isDevAuthBypass()) {
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    await auth.protect({
      unauthenticatedUrl: new URL('/login', req.url).toString(),
    });
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
