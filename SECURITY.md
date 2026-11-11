# Security

Bored is a static page with no server of its own. The interesting parts are a
GitHub token, a private data repo, and a page that has to read untrusted JSON
safely. This is how each risk is handled, and what is deliberately left out.

## What is public and what isn't

- **This repo is public** and holds only the engine and generic example data. No
  personal tasks, history, profile, tokens, or keys are committed, and
  `.gitignore` keeps local data files out.
- **Personal data lives in a separate private repo.** The page reads it at runtime
  through the GitHub API. GitHub Pages never serves it.

## The token

The token lets the page read and write the private data repo.

- **Scope it tightly.** Use a fine grained token limited to the one data repo, with
  **Contents: Read and write** and no other permissions. Give it an expiry date.
- **What a leaked token can do:** read or change the files in that one repo.
  Nothing else: not your other repos, settings, or account.
- **Where it lives:** only in the browser's localStorage on the device where you
  pasted it. It is never committed, and no server of mine ever sees it.
- **Where it goes:** only to `https://api.github.com`, in the `Authorization`
  header. It never appears in a URL, a log line, or an error message, and requests
  are sent with no referrer.
- **Forget token** in the drawer deletes the token and the cached copy of your
  private tasks from that browser.

## Untrusted data

Anything in the data repo could be edited by mistake, or by someone holding the
token, so the page treats it as untrusted:

- Files are parsed with `JSON.parse` only. Nothing from the repo is ever loaded as
  a script or evaluated.
- Every category and task is validated field by field, and only known fields are
  copied. Anything malformed is skipped.
- Task text is rendered with `textContent` or drawn on a canvas, never as HTML, so
  markup in a task shows up as literal text.
- JSON parse errors are reworded before logging, because browser error messages can
  quote the file they failed on.

## Content Security Policy

The page ships a strict policy in a `<meta>` tag:

- Scripts, styles, fonts, and images load only from the page's own origin. Inline
  scripts are blocked.
- Network requests may go only to the page itself and `api.github.com`.
- Plugins, `<base>` changes, and form posts are disabled.
- Fonts are self hosted, so the page loads nothing from third parties.
- `Referrer-Policy: no-referrer` is set through a `<meta name="referrer">` tag.

**Limits of a meta tag CSP.** GitHub Pages can't send custom HTTP headers, so the
policy has to live in the page. That rules out `frame-ancestors`, which means
another site could embed the page in a frame. The only actions on the page are
spinning and editing your own settings, so the clickjacking risk is low.

## The shared github.io origin

Every GitHub Pages site under one account is served from the same origin,
`username.github.io`. Browsers scope localStorage by origin, so **any other Pages
site on the same account can read this page's localStorage, including the token**.
A malicious or compromised project on that account would be able to take it.

**The fix:** serve Bored from its own custom subdomain, such as
`bored.example.com`, by adding it under Settings, Pages, Custom domain and creating
a `CNAME` DNS record. A custom subdomain is its own origin, so its localStorage is
isolated from every other Pages site. Until then, keep the token tightly scoped as
described above, and don't host untrusted code on other Pages sites under the same
account.

## Out of scope

- Browser extensions with access to every page can read localStorage on any
  site. Only install extensions you trust.
- Anyone with your unlocked device and browser can use the page as you.

## Reporting a vulnerability

Please report it privately through this repo's **Security** tab, using **Report a
vulnerability**, rather than in a public issue.
