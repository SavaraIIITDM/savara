import { NextResponse, type NextRequest } from "next/server";
import { isDisabledRoute } from "./src/lib/site-release";

export async function middleware(request: NextRequest) {
  if (isDisabledRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
