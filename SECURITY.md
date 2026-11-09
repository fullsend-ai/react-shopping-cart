# Security policy

## Supported versions

The storefront is served from the tip of `main`; only that branch receives fixes.

## Reporting a vulnerability

Do not open a public issue. Email **srevivo@redhat.com** with what you found,
where (file, route or deployed URL), how to reproduce it, and the impact you
think it has.

You'll get an acknowledgement within 3 business days and a decision on a fix
within 10. A valid report ships on `main`, credited unless you ask otherwise.

## Scope

In scope: `src/`, the deploy configuration (`firebase.json`), the container
image, and the workflows under `.github/`.

Out of scope: third-party services (Google Analytics, Firebase Hosting
infrastructure, the GitHub button widget) and anything requiring physical access
to a user's device.

## Already in place

- Dependabot watches dependencies; `security.yml` fails when a high-severity
  advisory reaches a production dependency
- commits are scanned for secrets (gitleaks): each push and pull request scans
  its new commits, and a weekly run scans the full history
- the deployed site sends CSP, HSTS, `nosniff`, `X-Frame-Options`,
  `Referrer-Policy` and `Permissions-Policy`
- the container runs as the unprivileged `node` user
