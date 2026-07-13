import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  const url = request.nextUrl.clone();

  // Rota de Login e Cadastro
  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some((path) => url.pathname.startsWith(path));

  if (isPublicPath) {
    if (token) {
      try {
        const decoded = atob(token);
        const session = JSON.parse(decoded);
        if (session.userRole === "CAMPO") {
          return NextResponse.redirect(new URL("/ponto", request.url));
        }
        return NextResponse.redirect(new URL("/", request.url));
      } catch {
        // Token corrompido, ignora e permite ir para rotas públicas
      }
    }
    return NextResponse.next();
  }

  // Se não houver token, redireciona para o login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const decoded = atob(token);
    const session = JSON.parse(decoded);
    const role = session.userRole;

    // A rota /usuarios só pode ser acessada pelo MASTER
    if (url.pathname.startsWith("/usuarios")) {
      if (role !== "MASTER") {
        const redirectDest = role === "CAMPO" ? "/ponto" : "/";
        return NextResponse.redirect(new URL(redirectDest, request.url));
      }
    }

    // Se o usuário for de CAMPO, restrinja o acesso a páginas administrativas
    if (role === "CAMPO") {
      const allowedPaths = ["/ponto", "/diario-obra"];
      const isAllowed = allowedPaths.some((path) => url.pathname.startsWith(path));

      if (!isAllowed) {
        return NextResponse.redirect(new URL("/ponto", request.url));
      }
    }
  } catch {
    // Token inválido/corrompido
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (manifest file)
     * - logo.png (logo file)
     * - logo.svg (logo file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|logo.png|logo.svg).*)",
  ],
};
