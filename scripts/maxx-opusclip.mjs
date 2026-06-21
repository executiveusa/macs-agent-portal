#!/usr/bin/env node
import { parseArgs } from "node:util";
import { createOpusClipClient, COPYRIGHT_NOTICE, OpusClipConfigError } from "./lib/maxx-opusclip-client.mjs";

const HELP = `MAXX OpusClip bridge

Usage:
  node scripts/maxx-opusclip.mjs usage
  node scripts/maxx-opusclip.mjs templates
  node scripts/maxx-opusclip.mjs submit --url URL --durations 30,60,90 --confirm-owned
  node scripts/maxx-opusclip.mjs list [--project PROJECT_ID]
  node scripts/maxx-opusclip.mjs describe --project PROJECT_ID --clip CLIP_ID
  node scripts/maxx-opusclip.mjs transcript --project PROJECT_ID
  node scripts/maxx-opusclip.mjs share --project PROJECT_ID
  node scripts/maxx-opusclip.mjs accounts
  node scripts/maxx-opusclip.mjs generate-copy --project PROJECT_ID --clip CLIP_ID --account ACCOUNT_ID [--prompt TEXT]
  node scripts/maxx-opusclip.mjs copy-status --job JOB_ID
  node scripts/maxx-opusclip.mjs publish --project PROJECT_ID --clip CLIP_ID --account ACCOUNT_ID --title TITLE --confirm-publish
  node scripts/maxx-opusclip.mjs schedule --project PROJECT_ID --clip CLIP_ID --account ACCOUNT_ID --title TITLE --at ISO_DATE --confirm-schedule
  node scripts/maxx-opusclip.mjs cancel-schedule --schedule SCHEDULE_ID --confirm-schedule
  node scripts/maxx-opusclip.mjs thumbnail --url URL --confirm-cost
  node scripts/maxx-opusclip.mjs censor --project PROJECT_ID --clip CLIP_ID --confirm-edit-cost [--beep]

Environment:
  OPUSCLIP_API_KEY is required for API calls.
  OPUSCLIP_BASE_URL is optional and defaults to https://api.opus.pro/api.
`;

function parseCli() {
  const command = process.argv[2];
  const argv = process.argv.slice(3);
  const { values } = parseArgs({
    args: argv,
    options: {
      account: { type: "string" },
      aspect: { type: "string" },
      at: { type: "string" },
      beep: { type: "boolean" },
      clip: { type: "string" },
      "confirm-cost": { type: "boolean" },
      "confirm-edit-cost": { type: "boolean" },
      "confirm-owned": { type: "boolean" },
      "confirm-publish": { type: "boolean" },
      "confirm-schedule": { type: "boolean" },
      description: { type: "string" },
      durations: { type: "string" },
      genre: { type: "string" },
      help: { type: "boolean", short: "h" },
      job: { type: "string" },
      keywords: { type: "string" },
      lang: { type: "string" },
      model: { type: "string" },
      page: { type: "string" },
      "page-size": { type: "string" },
      privacy: { type: "string" },
      project: { type: "string" },
      prompt: { type: "string" },
      "range-end": { type: "string" },
      "range-start": { type: "string" },
      "remove-filler": { type: "boolean" },
      schedule: { type: "string" },
      "skip-curate": { type: "boolean" },
      "sub-account": { type: "string" },
      template: { type: "string" },
      title: { type: "string" },
      url: { type: "string" },
      webhook: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });

  return { command, values };
}

function fail(message, code = 1) {
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(code);
}

function printJson(payload) {
  console.log(JSON.stringify({ ok: true, ...payload }, null, 2));
}

function requireFlag(values, flag, reason) {
  if (!values[flag]) {
    fail(`Missing --${flag}. ${reason}`);
  }
}

function buildClient() {
  return createOpusClipClient();
}

function preflightConfirmation(command, values) {
  switch (command) {
    case "submit":
      console.error(COPYRIGHT_NOTICE);
      requireFlag(values, "confirm-owned", "Confirm that the submitted source is owned or licensed before creating a project.");
      return;
    case "publish":
      requireFlag(values, "confirm-publish", "Publishing posts can affect live social channels.");
      return;
    case "schedule":
      requireFlag(values, "confirm-schedule", "Scheduling posts can affect live social channels and future publishing.");
      return;
    case "cancel-schedule":
      requireFlag(values, "confirm-schedule", "Canceling scheduled posts changes live publication state.");
      return;
    case "thumbnail":
      requireFlag(values, "confirm-cost", "Thumbnail generation may consume OpusClip credits.");
      return;
    case "censor":
      requireFlag(values, "confirm-edit-cost", "Server-side clip edits may consume OpusClip credits.");
      return;
    default:
      return;
  }
}

function apiErrorPayload(error) {
  if (error instanceof OpusClipConfigError) {
    return error.message;
  }

  const body = error?.body ? ` Details: ${JSON.stringify(error.body)}` : "";
  return `${error instanceof Error ? error.message : String(error)}${body}`;
}

async function main() {
  const { command, values } = parseCli();

  if (!command || values.help || command === "help" || command === "--help") {
    console.log(HELP);
    return;
  }

  preflightConfirmation(command, values);

  try {
    const client = buildClient();

    switch (command) {
      case "usage":
        printJson({ data: await client.getUsage() });
        return;
      case "templates":
        printJson({ data: await client.listBrandTemplates() });
        return;
      case "submit":
        printJson({
          data: await client.createProjectFromUrl({
            url: values.url,
            durations: values.durations,
            model: values.model,
            prompt: values.prompt,
            keywords: values.keywords,
            aspect: values.aspect,
            rangeStart: values["range-start"],
            rangeEnd: values["range-end"],
            template: values.template,
            genre: values.genre,
            lang: values.lang,
            title: values.title,
            webhook: values.webhook,
            skipCurate: values["skip-curate"],
            removeFiller: values["remove-filler"],
          }),
        });
        return;
      case "list":
        if (values.project) {
          printJson({ data: await client.getClipsByProjectId(values.project) });
        } else {
          printJson({
            data: await client.listProjects({
              page: Number(values.page ?? 0),
              pageSize: Number(values["page-size"] ?? 20),
            }),
          });
        }
        return;
      case "describe":
        printJson({ data: await client.describeClip(values.project, values.clip) });
        return;
      case "transcript":
        printJson({ data: await client.getTranscript(values.project) });
        return;
      case "share":
        printJson({ data: await client.shareProject(values.project) });
        return;
      case "accounts":
        printJson({ data: await client.listSocialAccounts() });
        return;
      case "generate-copy":
        printJson({
          data: await client.generateSocialCopy({
            projectId: values.project,
            clipId: values.clip,
            accountId: values.account,
            prompt: values.prompt,
          }),
        });
        return;
      case "copy-status":
        printJson({ data: await client.getSocialCopyJob(values.job) });
        return;
      case "publish":
        printJson({
          data: await client.publishPost({
            projectId: values.project,
            clipId: values.clip,
            accountId: values.account,
            subAccountId: values["sub-account"],
            title: values.title,
            description: values.description,
            privacy: values.privacy,
          }),
        });
        return;
      case "schedule":
        printJson({
          data: await client.schedulePost({
            projectId: values.project,
            clipId: values.clip,
            accountId: values.account,
            subAccountId: values["sub-account"],
            title: values.title,
            description: values.description,
            privacy: values.privacy,
            publishAt: values.at,
          }),
        });
        return;
      case "cancel-schedule":
        printJson({ data: await client.cancelScheduledPost(values.schedule) });
        return;
      case "thumbnail":
        printJson({
          data: await client.createThumbnailJob({
            url: values.url,
            prompt: values.prompt,
          }),
        });
        return;
      case "censor":
        printJson({
          data: await client.createCensorJob({
            projectId: values.project,
            clipId: values.clip,
            beepSound: values.beep,
          }),
        });
        return;
      default:
        fail(`Unknown command: ${command}. Run node scripts/maxx-opusclip.mjs --help.`);
    }
  } catch (error) {
    fail(apiErrorPayload(error));
  }
}

await main();
