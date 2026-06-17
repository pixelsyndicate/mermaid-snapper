# Codex Handoff: Mermaid Snapper Public Repo Prep

You are working in `C:\_SourceCode\GitHubRepos\mermaid-snapper`, a public-facing static web app copied out of an internal repo. Keep this repo clean, static, and safe for public GitHub hosting.

## Immediate Goals

1. Confirm the npm package is named `mermaid-snapper` in `package.json` and `package-lock.json`.
2. Run `npm install` if `node_modules/` is missing, then run `npm test`.
3. Confirm the deployable app is static-only under `docs/` and does not contain internal source folders or Express runtime files.
4. Help configure Git source control for the GitHub account `pixelsyndicate` and the new public repository.

## Repository Shape To Preserve

Expected public repo contents:

```text
docs/
scripts/
tests/
.gitignore
package.json
package-lock.json
README.md
AGENTS.md
```

Do not add or publish these from the old internal project:

```text
.git/
node_modules/
_origin_code/
TODO.md
app.js
bin/
public/
routes/
views/
using_expressjs_cli.txt
```

## Git / GitHub Identity Work

The desired GitHub username for this public repo is `pixelsyndicate`.

Before committing, inspect current Git state:

```powershell
git status
git remote -v
git config user.name
git config user.email
```

If this folder is not initialized yet, initialize it:

```powershell
git init
```

Set repo-local identity only, not global identity, unless the user explicitly asks:

```powershell
git config user.name "pixelsyndicate"
git config user.email "<ask-user-for-public-git-email>"
```

Ask the user for the exact GitHub remote URL after they create the empty repo, or use the URL they provide. Prefer SSH if their machine is set up for it; otherwise HTTPS is fine.

Examples:

```powershell
git remote add origin git@github.com:pixelsyndicate/mermaid-snapper.git
```

or

```powershell
git remote add origin https://github.com/pixelsyndicate/mermaid-snapper.git
```

If `origin` already exists but points elsewhere, do not overwrite silently. Show it to the user and ask before changing it.

## Verification Checklist

Run:

```powershell
npm install
npm test
```

Also verify:

- `docs/index.html` references assets with relative `./` paths.
- `docs/.nojekyll` exists.
- `docs/vendor/mermaid/mermaid.min.js` exists.
- No internal markers appear in deployable app source: `BSN`, `APP/RTR`, `Splunk`, `SAP/HANA`, `QAS`.
- No Express dependencies remain in `package.json`.

## Suggested First Commit

After verification, stage only the intended public repo files and commit:

```powershell
git add AGENTS.md README.md package.json package-lock.json .gitignore docs scripts tests
git commit -m "Initial static Mermaid Snapper app"
```

Do not push until the user confirms the remote URL and account are correct.

