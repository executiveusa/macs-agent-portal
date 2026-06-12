import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadMaxxEnv, withRemotePage, getOptionalMaxxEnv } from "./lib/maxx-browser-client.mjs";
import {
  analyzeVideoEntries,
  extractYtInitialDataFromRawHtml,
  parseVideoEntriesFromText,
  parseVideoEntriesFromYouTubeInitialData,
  renderVideoDossierMarkdown,
} from "./lib/maxx-video-dossier.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultSourceUrl = "https://www.youtube.com/@stefan_3d_ai/videos";

function readArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index < 0) {
    return fallback;
  }

  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function fetchFirecrawlChannelSnapshot(sourceUrl) {
  const apiKey = getOptionalMaxxEnv("VITE_FIRECRAWL_API_KEY") || getOptionalMaxxEnv("FIRECRAWL_API_KEY");
  if (!apiKey) {
    return null;
  }

  const scrapeResponse = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: sourceUrl,
      formats: ["rawHtml"],
      onlyMainContent: false,
      proxy: "enhanced",
      mobile: true,
      blockAds: true,
      removeBase64Images: true,
      timeout: 120000,
    }),
  });

  if (!scrapeResponse.ok) {
    return null;
  }

  const scrapePayload = await scrapeResponse.json();
  const rawHtml = scrapePayload?.data?.rawHtml ?? "";
  const ytInitialData = rawHtml ? extractYtInitialDataFromRawHtml(rawHtml) : null;
  const title = scrapePayload?.data?.metadata?.title ?? "";
  return {
    ...scrapePayload?.data,
    title,
    bodyText: rawHtml,
    ytInitialData,
  };
}

loadMaxxEnv();

const sourceUrl = readArg("--source", defaultSourceUrl);
const outPath = resolve(repoRoot, readArg("--out", "ops/reports/MAXX-STEFAN-3D-AI-DOSSIER.md"));
const limit = Number(readArg("--limit", "30")) || 30;
const forceFirecrawl = hasFlag("--firecrawl-first");

let browserProbe = {
  ok: false,
  error: "Remote browser not tried yet",
};

let videos = [];
let channelName = "";

const remoteBrowserAllowed = !forceFirecrawl;
if (remoteBrowserAllowed) {
  try {
    const probe = await withRemotePage(
      sourceUrl,
      async ({ page }) => {
        for (let i = 0; i < 3; i += 1) {
          await page.mouse.wheel(0, 5000);
          await page.waitForTimeout(1000);
        }

        const title = await page.title();
        const bodyPreview = await page.locator("body").innerText({ timeout: 15000 }).catch(() => "");
        const ytData = await page.evaluate(() => window.ytInitialData ?? null).catch(() => null);
        const extractedVideos = parseVideoEntriesFromYouTubeInitialData(ytData, limit);

        return {
          ok: true,
          title,
          bodyPreview: bodyPreview.slice(0, 600),
          videos: extractedVideos,
          channelName: title.replace(/\s*-\s*YouTube$/i, "").trim() || "Stefan 3D AI",
        };
      },
      { timeoutMs: 60000, networkIdleTimeoutMs: 12000 },
    );

    browserProbe = {
      ok: true,
      title: probe.title,
      bodyPreview: probe.bodyPreview,
    };
    videos = probe.videos;
    channelName = probe.channelName;
  } catch (error) {
    browserProbe = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

if (!videos.length) {
  const firecrawlSnapshot = await fetchFirecrawlChannelSnapshot(sourceUrl);
  const fallbackText = firecrawlSnapshot?.bodyText ?? firecrawlSnapshot?.markdown ?? "";
  videos = firecrawlSnapshot?.ytInitialData
    ? parseVideoEntriesFromYouTubeInitialData(firecrawlSnapshot.ytInitialData, limit)
    : parseVideoEntriesFromText(fallbackText, limit);
  channelName = channelName || firecrawlSnapshot?.title || firecrawlSnapshot?.metadata?.title || "Stefan 3D AI";
}

if (!videos.length) {
  throw new Error(`Could not extract any uploads from ${sourceUrl}. Browser probe failed and Firecrawl fallback was empty.`);
}

const analysis = analyzeVideoEntries(videos);
const generatedAt = new Date().toISOString();
const markdown = renderVideoDossierMarkdown({
  sourceUrl,
  channelName,
  generatedAt,
  browserProbe,
  videos,
  analysis,
});

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, markdown, "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      outPath,
      sourceUrl,
      videoCount: videos.length,
      browserProbe,
      usedFirecrawlFallback: !browserProbe.ok,
      markdownPreview: markdown.slice(0, 900),
    },
    null,
    2,
  ),
);
