# MACS Agent Portal

Agent MAXX front page, Stacy dashboard, and deployment support for the MACS Agent Portal.

## Deployment Status

- Primary host: Vercel
- Production alias: https://macs-agent-portal-pi.vercel.app
- Build command: `npm run build`
- Output directory: `dist`
- Fallback planning: Railway and Coolify support docs are included for future migration or cost-control scenarios.

## Deployment Docs

- `RAILWAY_DEPLOYMENT.md`
- `COOLIFY_SUPPORT.md`
- `COOLIFY_MIGRATION.md`
- `HOSTINGER_VPN.md`
- `DEPLOYMENT_SUMMARY.md`
- `.agents`

Do not commit filled secret files. Use Vercel, Railway, Coolify, or a vault for runtime values.

## Project info

**URL**: https://lovable.dev/projects/94b124a5-475a-42fc-9cbb-b959e4258a80

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/94b124a5-475a-42fc-9cbb-b959e4258a80) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/94b124a5-475a-42fc-9cbb-b959e4258a80) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
