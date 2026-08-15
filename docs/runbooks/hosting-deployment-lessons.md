# Durable Hosting Deployment Lessons

## Reference incident

The 3X Plumbing Bluehost restore is the reference implementation for safe browser-agent website installation.

The live target was verified as the Bluehost site `3xtest`, domain `3xplumbers.com`, document root `/home2/fuomhemy/public_html/website_c0f9a350`. The initial production root did not contain the Webflow site's `index.html`, CSS, JS, image, font, or video deployment objects, while unrelated client files were preserved.

The successful restore used a static-only path. A proposed internet-reachable PHP restore/bootstrap endpoint was not deployed because ordinary File Manager staging and promotion were sufficient.

## What worked

### 1. Target proof before mutation

The browser agent verified the exact domain and exact document root instead of assuming `public_html`.

This is critical on multi-site Bluehost accounts because addon domains/sites can use their own document roots.

### 2. Isolated staging

The uploaded Webflow ZIP was extracted into a temporary stage inside the verified site area rather than directly over production.

This allowed validation before any public files were replaced.

### 3. Identity verification

Before promotion, the agent validated:
- `index.html`
- CSS, JS, fonts, images, videos
- Webflow `data-wf-site`
- Webflow `data-wf-page`
- title and expected branded content

This prevented a plausible-looking but wrong export from being installed.

### 4. Minimal promotion

The agent rechecked production, then moved exactly the required site objects into the document root and preserved unrelated files.

### 5. Runtime verification

The deployment was not considered complete after extraction or file movement.

The browser agent tested:
- public homepage
- CSS
- JS
- images
- fonts
- video
- third-party Webflow/Flowbase dependencies
- console errors
- responsive layout
- mobile menu
- popups
- IX2 animations
- ticker animation

### 6. Explicit limitation reporting

The agent did not fabricate SHA-256 verification because Bluehost File Manager did not expose a hash/checksum tool. It also disclosed that responsive testing was approximate when the browser tool could not force an exact viewport.

This is the required evidence standard: state what was proven and what was not.

### 7. Minimal blast radius

The successful restore changed none of the following:
- DNS
- SSL
- nameservers
- document root
- `.htaccess`
- WordPress
- database
- GitHub
- Vercel
- Webflow
- other Bluehost sites

That is the desired default for a static restore.

### 8. Cleanup after proof

The stage and leftover ZIP were moved to trash only after public verification succeeded.

## What should not be repeated

### Do not diagnose every hosting failure as SSL

If an entry file is missing from disk, buying/changing SSL is not a repair for the missing file.

### Do not assume a migration that later fails was always broken

The 3X site had worked for months. A later outage means the investigation should consider:
- deleted or moved entry files
- changed document root
- `.htaccess`
- permissions
- partial restore
- account/server migration
- security/malware cleanup
- hosting configuration drift

### Do not deploy arbitrary recovery scripts when browser-native file operations are enough

A recovery script that can fetch remote content and write files to production creates unnecessary attack surface. Prefer File Manager, provider Git deployment, SFTP/SSH, or the provider's supported deployment workflow.

### Do not extract directly over production before validation

Staging is cheap. Recovery from an unknown overwrite is not.

### Do not treat successful upload/extraction as proof of deployment

Only the public runtime can prove that the site is actually serving correctly.

### Do not silently repair source inconsistencies during restore

Restore should preserve the verified source artifact. Source-level improvements belong in a separate change with separate approval and rollback.

## Reusable process

The durable process is:

`DETECT → DOCS → CLASSIFY → TARGET PROOF → BASELINE → STAGE → IDENTITY CHECK → PROMOTE → PUBLIC TEST → AUDIT → CLEANUP → REPORT`

The canonical executable instructions are in:

`skills/browser-hosting-deployer/SKILL.md`

Agent MAXX is routed to the skill by:

`.claude/rules/hosting-deployment.md`

## Cloneflow handoff

Cloneflow should output a deployment artifact plus a manifest containing:
- source type
- runtime type
- entry file
- required file paths
- expected title/content
- Webflow site/page IDs when available
- forbidden hosting mutations
- verification checklist

The deployer should not be responsible for rediscovering whether Cloneflow extracted the source correctly. Cloneflow proves artifact fidelity; the hosting deployer proves target safety and live runtime.
