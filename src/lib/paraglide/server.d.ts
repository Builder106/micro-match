declare module '$lib/paraglide/server' {
  export function paraglideMiddleware(
    request: Request,
    handler: (input: { request: Request; locale: string }) => Response | Promise<Response>
  ): Response | Promise<Response>;
}

declare module '$lib/paraglide/runtime' {
  export function deLocalizeUrl(url: URL): URL;
}

declare module '$lib/paraglide/messages.js' {
  export function error_404(): string;
  export function not_found_title(): string;
  export function not_found_body(): string;
  export function back_home(): string;
  export function browse_tasks(): string;
}
