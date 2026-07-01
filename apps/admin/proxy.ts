import {
  clerkMiddleware,
  createRouteMatcher,
  clerkClient,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/login(.*)", "/access-denied(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  await auth.protect();

  const { sessionClaims, userId } = await auth();
  let role = (sessionClaims?.publicMetadata as Record<string, unknown>)?.role;

  // Fallback: If role is not in session claims (e.g. JWT token not configured), fetch directly from Clerk API
  if (!role && userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = (user.publicMetadata as Record<string, unknown>)?.role;
    } catch (e) {
      console.error(
        "Failed to fetch user role from Clerk API in middleware:",
        e,
      );
    }
  }

  if (!role) {
    return NextResponse.redirect(new URL("/access-denied", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
