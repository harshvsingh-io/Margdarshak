import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  // ─── Skip middleware for auth callback (let the route handler handle it) ───
  if (path.startsWith("/auth")) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isRootPath = path === "/";
  const isLoginPage = path.startsWith("/login");
  const isPublicFile = path.includes(".");

  // If logged-in user visits /login, redirect to dashboard
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Root path is always public
  if (isRootPath || isPublicFile) {
    return response;
  }

  // For all other protected routes, require authentication
  if (!user) {
    // Redirect to landing page instead of login
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Role verification for admin/moderator routes
  if (path.startsWith("/admin")) {
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (
      !userRole ||
      (userRole.role !== "admin" && userRole.role !== "moderator")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
