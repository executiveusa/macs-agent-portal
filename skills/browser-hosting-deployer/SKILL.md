# Browser Hosting Deployer

## Purpose

Deploy, restore, or migrate a website through a hosting provider's browser UI without guessing about the target environment. This skill is provider-aware, stack-aware, evidence-first, and designed for Bluehost, Hostinger, and similar shared-hosting/control-panel environments.

Use this skill for:
- static HTML/CSS/JS sites
- exported Webflow sites
- PHP sites
- WordPress/manual file restores where the hosting platform supports them
- Node.js/front-end applications only when the provider/plan explicitly supports that runtime
- Git-based deployment when the provider exposes an official Git deployment path

Do not use this skill to invent unsupported runtime behavior. If a stack is not supported by the current hosting plan, stop and report the incompatibility instead of forcing it into `public_html`.

---

## Prime Directive

**Inspect → classify → read current provider docs → prove target → stage → verify → promote → test → clean up → report.**

Never mutate production merely because a folder, domain, or hosting account looks plausible.

---

## Required Inputs

Collect or infer, then verify:

- target domain
- hosting provider
- hosting account/site identity
- source artifact or repository
- expected site identity (title, site ID, page ID, known content, framework metadata, etc.)
- intended stack/runtime
- whether this is a new install, migration, restore, or repair
- whether DNS is already pointed correctly
- whether production is currently serving anything important

If any of these are unclear, inspect first. Do not guess.

---

## Phase 0 — Detect Provider and Environment

Before changing anything:

1. Identify the provider from the UI, domain, account portal, cPanel/hPanel branding, or user instruction.
2. Identify whether the environment is:
   - Bluehost portal/cPanel
   - Hostinger hPanel
   - another cPanel-like host
   - unsupported/unknown
3. Read the provider's **current official documentation** for the exact operation before proceeding.
4. Prefer provider-native workflows over improvised ones.
5. Record the actual hosting plan/runtime capabilities that are visible in the account.

### Mandatory current-doc check

For Bluehost, verify current guidance for:
- document root
- File Manager
- addon domains
- directory index / `.htaccess`
- runtime support relevant to the detected stack

Official docs root: `https://www.bluehost.com/help`

For Hostinger, verify current guidance for:
- hPanel File Manager / Git deployment
- Node.js Web App deployment
- PHP/static deployment
- domain and document-root behavior

Official docs root: `https://www.hostinger.com/support`

Do not rely on remembered UI labels when the live UI or docs differ.

---

## Phase 1 — Classify the Stack

Inspect the source artifact/repository before touching hosting.

### Static / exported site

Signals:
- `index.html`
- `.html` pages
- `css/`, `js/`, `images/`, `fonts/`, `videos/`
- Webflow export metadata such as `data-wf-site` / `data-wf-page`
- no required backend runtime

Action: deploy the built/exported files directly to the serving document root.

### PHP

Signals:
- `index.php`
- Composer/PHP files
- no long-running Node process required

Action: verify the host's PHP version/module support before promotion.

### WordPress

Signals:
- `wp-admin/`, `wp-content/`, `wp-includes/`
- `wp-config.php`
- database dependency

Action: treat files + database + config as one deployment unit. Do not claim completion if only files were restored.

### Node.js / framework app

Signals:
- `package.json`
- build/start scripts
- Next.js, Express, React SSR, Nest, etc.

Action:
- inspect `package.json` and build config
- determine whether the provider supports Node.js for this plan
- use the provider's official Node/Web App workflow when available
- do **not** copy an unbuilt Node app into `public_html` and call it deployed

### Front-end build output

Signals:
- framework source exists, but production artifact is `dist/`, `build/`, `out/`, etc.

Action: deploy the correct build output, not the source tree, unless the provider's build service is intentionally used.

---

## Phase 2 — Prove the Target

Before upload or extraction, prove the production target at least two ways when possible.

Examples:
- domain shown in provider's Websites page
- document root shown in Files & Access / Domains
- File Manager breadcrumb path
- cPanel Domains table
- existing known production files

Record:

```text
Provider:
Account/site:
Domain:
Document root:
Target proof #1:
Target proof #2:
Current homepage/index state:
Existing files to preserve:
```

### Non-negotiable rule

Never assume every Bluehost site uses `/public_html` directly. Primary domains commonly do; addon domains normally have their own document root/subdirectory. Always read the actual value shown in the account.

Never assume every Hostinger site should be deployed by file upload. Use static/PHP/Git or Node Web App paths according to the detected stack and current plan.

---

## Phase 3 — Preserve and Baseline

Before mutation:

1. Record the production root listing.
2. Show hidden files where available.
3. Identify `index.html`, `index.php`, `.htaccess`, framework config, and existing asset directories.
4. Preserve unrelated client content.
5. If production currently works, create or confirm a backup/rollback source before replacement.
6. Do not change DNS, nameservers, SSL, document root, WordPress, databases, or unrelated sites unless the deployment specifically requires it.

A 403, 404, SSL warning, or blank page is a symptom, not permission to change unrelated configuration.

---

## Phase 4 — Stage, Never Blindly Overwrite

For file-based deployments, prefer an isolated staging directory inside the verified site area, for example:

```text
<document-root>/_deploy_stage
```

Upload/extract there first.

### Validate staging before promotion

At minimum verify:
- expected entry file exists (`index.html`, `index.php`, or provider-specific runtime entry)
- expected CSS/JS/assets exist
- no unexpected wrapper directory
- file count/manifest is plausible
- expected site identity matches
- source ZIP/repo corresponds to the requested project
- no obvious secret files are being exposed to the web root

For Webflow exports additionally verify when available:
- `data-wf-site`
- `data-wf-page`
- page title
- expected branded text/content
- required Webflow CSS/JS files

If checks fail, stop before promotion.

---

## Phase 5 — Promotion

Promote only the intended site artifacts.

Prefer minimal movement:

```text
index.html
css/
js/
images/
fonts/
videos/
```

or the equivalent stack-specific production output.

Rules:
- re-check the production root immediately before promotion
- detect collisions
- preserve unrelated files
- do not delete old material merely for neatness
- never promote a ZIP as the homepage artifact
- never leave the real entry file one wrapper folder below the document root

For static sites, the final root should resemble:

```text
<document-root>/
  index.html
  css/
  js/
  images/
```

not:

```text
<document-root>/some-export-folder/index.html
```

unless the domain is deliberately configured to serve that subfolder.

---

## Phase 6 — Provider Runbooks

### Bluehost

1. Open Bluehost Portal.
2. Select the exact site/domain.
3. Read **Files & Access** and record the displayed Document Root.
4. Cross-check in cPanel → Domains when available.
5. Open File Manager and navigate to that exact root.
6. Show hidden files.
7. Baseline current files.
8. Stage upload/extraction in an isolated folder.
9. Validate entry file + assets + project identity.
10. Recheck production root.
11. Promote only intended objects.
12. Test the public domain.
13. Check console/network/assets/interactions/responsive behavior.
14. Remove temporary stage only after public verification.
15. Leave DNS/SSL/document-root settings unchanged unless separately proven necessary.

Bluehost-specific diagnostic rule:
- if a site previously worked and later fails, do not assume migration was always wrong
- investigate missing/moved entry files, document-root reassignment, `.htaccess`, permissions, restores, account/server moves, or security cleanup
- SSL problems do not explain a physically missing `index.html`

### Hostinger — static/PHP/Git

1. Open hPanel and select the exact website.
2. Determine whether the site should use File Manager, Git deployment, or another provider-native deployment method.
3. For static/PHP sites, identify the serving root (commonly `public_html`, but verify in the live account/docs).
4. For Git deployment, verify repository, branch, root directory, and build/output behavior before deploying.
5. Stage or use the provider's preview/deploy mechanism when available.
6. Verify public runtime before cleanup.

### Hostinger — Node.js / web apps

1. Confirm the hosting plan exposes **Node.js Web App / Deploy Web App**.
2. Inspect `package.json` and framework configuration.
3. Prefer Hostinger's supported deployment flow:
   - GitHub repository, or
   - ZIP upload
4. Verify or explicitly set:
   - framework type
   - build command
   - output directory (`dist`, `build`, `out`, `.next`, etc.)
   - entry file when required
5. Deploy through the Node/Web App workflow, not raw `public_html` copying.
6. Use provider preview/build evidence.
7. Test the live domain after deployment.

---

## Phase 7 — Runtime Verification

A successful upload is not a successful deployment.

Verify the public site:

- HTTP status / successful navigation
- correct final URL
- correct page title/content identity
- CSS loaded
- images loaded
- fonts loaded when relevant
- videos/media loaded when relevant
- JS bundles loaded
- no fatal console errors
- navigation works
- forms/buttons/popups work where applicable
- desktop/tablet/mobile behavior is plausible
- redirects/canonical behavior is sane

For Webflow exports also test:
- Webflow interactions/IX2
- mobile nav
- exported third-party widgets/CDNs
- forms separately, because exported Webflow forms may require an external backend/form handler

Do not claim exact breakpoint verification unless the browser tool actually tested the exact dimensions.

---

## Phase 8 — Unauthorized Change Audit

Before declaring success, explicitly report whether these changed:

```text
DNS
nameservers
SSL
Document Root
.htaccess
WordPress
Database
GitHub
source platform (e.g. Webflow)
other hosted sites
existing client files
```

Expected default: **NO** unless required by the approved deployment plan.

---

## Phase 9 — Cleanup and Rollback

After verification:

- remove temporary stage/archive only if no longer needed
- prefer trash/recoverable deletion over permanent deletion when the UI supports it
- preserve rollback material until the live verification is complete
- record what was removed

If production verification fails:

1. stop further edits
2. restore the previous known-good files/config
3. do not compound the failure by changing DNS/SSL/document root unless evidence identifies those as the cause
4. report the failed proof and exact rollback state

---

## Forbidden Patterns

Do not:

- guess the document root
- overwrite production before staging/inspection
- upload source code when the provider expects build output
- install WordPress as a generic fix for a static site
- buy/change SSL to fix a missing homepage file
- change DNS because the page is broken without proving DNS is wrong
- deploy arbitrary remote-fetch PHP/bootstrap scripts when normal file operations are sufficient
- expose a token-authenticated upload/fetch endpoint on production as a convenience
- delete unrelated directories
- claim hashes were checked when the UI had no hashing capability
- claim a deployment succeeded merely because extraction/upload succeeded
- claim exact responsive dimensions that were not actually tested
- silently edit source inconsistencies during a restore

---

## Evidence Report Template

```markdown
# HOSTING DEPLOYMENT REPORT

## 1. Target
Provider:
Account/site:
Domain:
Document root/runtime target:
Target proof:

## 2. Stack
Detected stack:
Build/output:
Provider support verified:
Docs consulted:

## 3. Initial State
Entry file before:
Existing files preserved:
Hidden/config files inspected:

## 4. Stage
Stage method:
Files/artifact verified:
Identity verification:
Manifest/hash verification available?:
Failures:

## 5. Promotion/Deploy
Result:
Collisions:
Objects promoted:

## 6. Public Runtime
Home:
CSS:
JS:
Images:
Fonts/media:
Console:

## 7. Responsive + Interactions
Desktop:
Tablet:
Mobile:
Navigation:
Forms/popups/widgets:

## 8. Unauthorized Change Audit
DNS changed:
SSL changed:
Nameservers changed:
Document root changed:
.htaccess changed:
Database changed:
Other sites changed:
Existing client files deleted:

## 9. Cleanup
Stage removed:
Rollback retained:

## 10. Remaining Known Items
- ...

## 11. Final Status
`DEPLOYMENT_VERIFIED` or `DEPLOYMENT_BLOCKED`
```

---

## Cloneflow Integration Contract

Cloneflow should hand this skill a verified deployment bundle, not raw assumptions.

Recommended handoff manifest:

```json
{
  "source": "webflow-export",
  "domain": "example.com",
  "entry": "index.html",
  "artifact": "site-export.zip",
  "expected": {
    "title": "Example",
    "site_id": "optional",
    "page_id": "optional",
    "required_paths": ["index.html", "css", "js", "images"]
  },
  "runtime": "static",
  "forbidden_mutations": ["dns", "nameservers", "ssl", "database", "document_root"],
  "verification": ["home", "assets", "console", "interactions", "responsive"]
}
```

Cloneflow remains responsible for extraction fidelity and source validation. The hosting deployer remains responsible for provider detection, target proof, safe promotion, runtime verification, rollback, and reporting.

---

## Success Definition

A deployment is complete only when:

1. provider and target were proven
2. stack/provider compatibility was verified
3. official current docs were checked
4. production was baselined
5. deployment was staged or provider-previewed
6. site identity was verified
7. promotion/deploy completed without unintended collisions
8. public runtime passed
9. unauthorized changes were audited
10. rollback remains possible or cleanup is explicitly recorded

Anything less is `DEPLOYMENT_BLOCKED` or `DEPLOYMENT_PARTIAL`, not done.
