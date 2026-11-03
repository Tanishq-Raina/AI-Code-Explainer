# Local tutor and video connections

Start the tutor from the repository root in one terminal:

```powershell
.\backend\start_local_tutor.ps1
```

This selects local Ollama `qwen3-coder:30b` for the tutor. Keep Ollama running.
The browser talks to the tutor on port 5000; it never calls Ollama directly.
Restart an already running tutor using this launcher to apply the local model settings.

Keep the prepared video Docker container running. Its host port is 4000;
the container's internal port is 5000. Video generation continues to use the
server's AbacusAI configuration and Edge speech. No credentials belong in the frontend.

Start the frontend in a second terminal:

```powershell
cd frontend
npm run dev
```

Defaults work without creating an environment file. For custom addresses,
copy `.env.example` to `.env.local`, edit it, and restart Vite.
`VITE_TUTOR_API_URL` includes `/api`; `VITE_VIDEO_API_URL` defaults to
`/render-api`. Vite forwards that route to host port 4000 for both development
and `npm run preview`. A separately hosted production site needs an equivalent
reverse proxy or an explicit video API URL with CORS configured on that server.

Hint-producing requests allow 21 minutes to cover the backend's two possible
600-second model calls plus other processing. Execute-only requests retain
their 45-second timeout. Timeout messages explain that server processing may continue.

Video polling continues across temporary connection failures and reconnects
after reload in the same browser tab. Completed playback uses the same API route
as the upload. A service restart can lose jobs because the video service uses an
in-memory job store. An unconfirmed upload is never automatically retried.

Offline integration checks (no model or video calls):

```powershell
node --test checks/service-integration.mjs
npm run build
```

These UI changes do not change the frozen scientific benchmark. Do not start
the benchmark until its separate run command is explicitly requested.
