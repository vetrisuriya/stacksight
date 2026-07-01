# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | ✅ Yes             |
| < 1.0   | ❌ Not supported   |

## Reporting a Vulnerability

If you discover a security vulnerability in StackSight, please **do not open a public GitHub issue**.

Instead, please report it responsibly via one of these methods:

1. **GitHub Private Vulnerability Reporting** (preferred):
   Go to the [Security tab](https://github.com/vetrisuriya/stacksight/security/advisories/new)
   on GitHub and submit a private advisory.

2. **Email**: If you cannot use GitHub's private reporting, email the maintainers directly.
   Contact details are listed in the GitHub repository profile.

### What to include in your report

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Any proof-of-concept code or screenshots
- The version of StackSight and Chrome you are using

### What to expect

- We will acknowledge receipt within **48 hours**
- We aim to release a fix within **7 days** for critical issues
- We will credit you in the release notes if you wish

## Security Architecture

StackSight is designed to be secure by default:

- **No backend server** — there is nothing to attack remotely
- **No user data stored** — no database, no cloud storage, no logs
- **Minimal permissions** — only `activeTab`, `scripting`, `tabs`, and host permissions for header fetching
- **No remote code execution** — all scripts are bundled locally; no eval(), no dynamic imports from external URLs
- **CSP-friendly** — the extension does not inject or modify page scripts
- **Read-only** — StackSight only reads page data; it never modifies pages, forms, or storage

## Scope

Issues in scope:
- The Chrome Extension code in this repository
- The GitHub Pages landing page (docs/)

Issues out of scope:
- Vulnerabilities in third-party websites that StackSight detects
- Chrome browser security issues (report to [Google](https://g.co/vulnz))
- Social engineering attacks
