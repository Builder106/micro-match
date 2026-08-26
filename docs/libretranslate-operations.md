# LibreTranslate operations

MicroMatch uses a self-hosted LibreTranslate service on the Oracle ARM VM. The
service is private to the application and is reachable at
`https://translate.micromatch.app` through a named Cloudflare Tunnel.

## Service contract

- Bind LibreTranslate to localhost on the VM. The public path is the tunnel,
  not a directly exposed VM port.
- Enable LibreTranslate API keys and keep the API-key database on persistent
  storage.
- Start the service with a request limit and a character limit. The initial
  values are 60 requests per minute and 5,000 characters per request.
- Run both LibreTranslate and `cloudflared` under a persistent service manager
  with automatic restart.
- Do not log task text or translation request bodies.

The Cloudflare Tunnel should route the hostname `translate.micromatch.app` to
the local LibreTranslate listener. The application uses these production
environment variables:

```text
LIBRETRANSLATE_ENDPOINT=https://translate.micromatch.app
LIBRETRANSLATE_API_KEY=<server-only key>
```

The API key belongs in the deployment secret store and in the VM's
LibreTranslate key database. It must not be committed to `.env.example`, CI
logs, browser code, or application logs.

## Verification

From the MicroMatch repository, run the live check with the production values
in the environment:

```sh
bun run verify:libretranslate
```

The check verifies the `/health` response, one authenticated translation, and
rejection of the same request without an API key. Run it after changing DNS,
the tunnel, the LibreTranslate service, or the production secret.

The task page remains usable if the service is down. The server helper times
out after ten seconds and returns the original task text. It caches successful
translations for fifteen minutes and does not cache failures.

## Deployment checklist

1. Create the named Cloudflare Tunnel and route `translate.micromatch.app` to
   the localhost LibreTranslate listener.
2. Enable API keys and create a key with the request and character limits above.
3. Set `LIBRETRANSLATE_ENDPOINT` and `LIBRETRANSLATE_API_KEY` in the production
   deployment environment.
4. Run `bun run verify:libretranslate` from a trusted environment.
5. Open a real task with the `/es/task/<id>` locale URL and confirm the translated title,
   description, and "Auto-translated" notice.
6. Restart both services and repeat the health check to confirm recovery.
