# Hosting Deployment Rule

When Agent MAXX is asked to install, restore, migrate, or repair a website on Bluehost, Hostinger, cPanel, hPanel, or a similar browser-managed host, load and follow:

`skills/browser-hosting-deployer/SKILL.md`

## Agent MAXX requirements

1. Treat hosting work as a production mutation.
2. Inspect first and identify provider, domain, account/site, document root/runtime target, and stack.
3. Read current official provider documentation before mutation.
4. Do not infer the document root from folder names.
5. Prefer a staged deployment or provider preview.
6. Require identity checks before promotion.
7. Do not change DNS, nameservers, SSL, document root, databases, WordPress, or unrelated sites unless the approved task specifically requires that change and evidence proves it is necessary.
8. Do not use remote-fetch/upload PHP bootstrap endpoints when ordinary File Manager, Git, SSH, SFTP, or provider-native deployment is sufficient.
9. Verify the public runtime after deployment; upload/extraction alone is not proof.
10. Produce the Evidence Report from the reusable skill and classify the result as `DEPLOYMENT_VERIFIED`, `DEPLOYMENT_PARTIAL`, or `DEPLOYMENT_BLOCKED`.

## 3X Plumbing reference lesson

The successful 3X restore established the preferred browser-agent pattern:

- prove the exact Bluehost document root
- record the initial state
- extract into an isolated staging folder
- validate required files and Webflow identity before promotion
- recheck production immediately before moving files
- move only the intended static production objects
- test the public URL, assets, responsive behavior, and interactions
- audit unauthorized changes
- remove temporary staging only after verification

The restore succeeded without DNS, SSL, nameserver, document-root, `.htaccess`, WordPress, database, GitHub, Vercel, or Webflow changes. Preserve that minimal-blast-radius behavior as the default.
