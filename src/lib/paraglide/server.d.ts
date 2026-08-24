declare module '$lib/paraglide/server' {
  export function paraglideMiddleware(
    request: Request,
    handler: (input: { request: Request; locale: string }) => Response | Promise<Response>
  ): Response | Promise<Response>;
}
