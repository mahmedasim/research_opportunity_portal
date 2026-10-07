# Agent Rules

These permanent rules apply to every task in this repository:

1. **Environment**: Ubuntu Linux + bash terminal only; use `python3` and `source venv/bin/activate`. Never give or run Windows/PowerShell commands.
2. **Environment Secrets**: NEVER open, read, print, or commit `backend/.env`. Only `backend/.env.example` with placeholders may exist in git.
3. **No Sudo or Destructive Commands**: Never run `sudo` or destructive commands (`rm -rf`, etc.). If something requires `sudo`, provide the exact command for the user to run themselves.
4. **Git Push & Commit Policy**: Never run `git push`. You may run `git add` and `git commit` only when explicitly instructed by the user, using the exact commit message provided.
5. **Pre-commit Verification**: Before committing, always run `git status` and verify that `.env` and `venv/` are not staged.
6. **No Mock/Sample Data**: No hard-coded or sample opportunity data anywhere in the codebase. All data must come dynamically from MySQL via the REST API.
7. **SQL Safety & Error Handling**: Use parameterized SQL queries only. Never leak stack traces, database credentials, or internal SQL errors to API clients.
8. **Specification Adherence**: Follow `docs/API_SPEC.md` strictly. If something in it seems wrong or ambiguous, ask the user instead of changing it independently.
