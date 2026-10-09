# Manufacturing documentation assistant

Planning-stage demo: route floor supervisors' questions to safety, maintenance, or quality documentation and return guarded, cited answers.

See [BUILD_PLAN.md](BUILD_PLAN.md) for scope, architecture, and parallel implementation tickets. The application has not been scaffolded yet.

## Configuration

An ignored `.env` has been created locally with empty credential fields. Fill in the OpenRouter key, chat/embedding model IDs, and Zilliz endpoint/token. `.env.example` is the tracked template; never commit credentials. Clef is the proposed decision model and still needs a live availability check.

For a fresh checkout, copy `.env.example` to `.env` only if `.env` does not already exist.

## Railway

`railway.json` selects Railpack, Bun install/build/start commands, and `/api/health`. These commands and the health route will be implemented during scaffolding; the repository is not deployable yet.

Set the variables from `.env.example` in Railway service Variables, plus `RAILPACK_BUN_VERSION=1.4.2` and `NODE_ENV=production`. Use a separate production Zilliz collection. Railway supplies `PORT`; the server will bind to `0.0.0.0`. Local `.env` is not automatically imported by Railway.

Vector setup and corpus seeding will run explicitly, not during build/start. No Railway volume is needed because vectors and source passages persist in Zilliz.
