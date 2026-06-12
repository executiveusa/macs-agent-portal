const durationPattern = /^\d{1,2}:\d{2}(?::\d{2})?$/;
const viewsPattern = /^\d+(?:[.,]\d+)?(?:[KMB])?$/i;
const agePattern = /^\d+\s*(?:h|hr|hrs|d|w|mo|y|day|days|week|weeks|month|months|year|years)\s*ago$/i;
const ignoreTitleLines = new Set(["Stefan 3D AI"]);

function parseCompactCount(value) {
  const normalized = value.replace(/,/g, "");
  const match = normalized.match(/^(\d+(?:\.\d+)?)([KMB])?$/i);
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  if (Number.isNaN(amount)) {
    return null;
  }

  const suffix = match[2]?.toUpperCase() ?? "";
  const multiplier = suffix === "M" ? 1_000_000 : suffix === "B" ? 1_000_000_000 : suffix === "K" ? 1_000 : 1;
  return Math.round(amount * multiplier);
}

function parseDurationToSeconds(value) {
  const parts = value.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return null;
}

function parseAgeScore(value) {
  const normalized = value.toLowerCase();
  const match = normalized.match(/^(\d+)\s*(h|hr|hrs|d|w|mo|y|day|days|week|weeks|month|months|year|years)\s*ago$/i);
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const table = {
    h: 1,
    hr: 1,
    hrs: 1,
    d: 24,
    day: 24,
    days: 24,
    w: 168,
    week: 168,
    weeks: 168,
    mo: 720,
    month: 720,
    months: 720,
    y: 8760,
    year: 8760,
    years: 8760,
  };

  return amount * (table[unit] ?? 1);
}

function extractPlainText(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => extractPlainText(item)).filter(Boolean).join(" ").trim();
  }

  if (typeof value !== "object") {
    return "";
  }

  if (typeof value.content === "string") {
    return value.content;
  }

  if (typeof value.simpleText === "string") {
    return value.simpleText;
  }

  if (Array.isArray(value.runs)) {
    return value.runs.map((run) => extractPlainText(run)).filter(Boolean).join("").trim();
  }

  if (typeof value.text === "string") {
    return value.text;
  }

  if (value.text) {
    return extractPlainText(value.text);
  }

  return "";
}

function getThumbnailDuration(lockupViewModel) {
  const overlays = lockupViewModel?.contentImage?.thumbnailViewModel?.image?.overlays ?? [];
  for (const overlay of overlays) {
    const badges = overlay?.thumbnailBottomOverlayViewModel?.badges ?? [];
    for (const badge of badges) {
      const text = extractPlainText(badge?.thumbnailBadgeViewModel?.text) || badge?.thumbnailBadgeViewModel?.rendererContext?.accessibilityContext?.label || "";
      if (durationPattern.test(text)) {
        return text;
      }
    }
  }

  const seen = new WeakSet();
  let found = "";
  const walk = (value) => {
    if (found || !value || typeof value !== "object" || seen.has(value)) {
      return;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }

    if (value.thumbnailBadgeViewModel) {
      const text = extractPlainText(value.thumbnailBadgeViewModel.text) || value.thumbnailBadgeViewModel.rendererContext?.accessibilityContext?.label || "";
      if (durationPattern.test(text)) {
        found = text;
        return;
      }
    }

    for (const item of Object.values(value)) {
      walk(item);
    }
  };

  walk(lockupViewModel);
  return found;
}

function getLockupMetadata(lockupViewModel) {
  const metadataRows = lockupViewModel?.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows ?? [];
  return metadataRows
    .map((row) =>
      (row?.metadataParts ?? [])
        .map((part) => extractPlainText(part?.text))
        .filter(Boolean)
        .join(" • ")
        .trim(),
    )
    .filter(Boolean);
}

function parseLockupVideo(lockupViewModel) {
  const title = extractPlainText(lockupViewModel?.metadata?.lockupMetadataViewModel?.title) || "";
  if (!title) {
    return null;
  }

  const metadataRows = getLockupMetadata(lockupViewModel);
  const metadataSegments = metadataRows
    .flatMap((line) => line.split(/\s*[•·]\s*/g))
    .map((segment) => segment.trim())
    .filter(Boolean);
  const duration = getThumbnailDuration(lockupViewModel);
  const author = metadataSegments.find((line) => line !== title && !viewsPattern.test(line) && !agePattern.test(line) && !/\bviews?\b/i.test(line)) ?? "";
  const viewsRaw = metadataSegments.find((line) => /\bviews?\b/i.test(line)) ?? "";
  const publishedRaw = metadataSegments.find((line) => agePattern.test(line) || /\bago\b/i.test(line)) ?? "";
  const url = lockupViewModel?.contentId ? `https://www.youtube.com/watch?v=${lockupViewModel.contentId}` : "";

  return {
    title,
    author,
    duration,
    durationSeconds: duration ? parseDurationToSeconds(duration) : null,
    viewsRaw,
    viewCount: viewsRaw ? parseCompactCount(viewsRaw.replace(/\s*views?\s*/i, "")) : null,
    publishedRaw,
    ageScore: publishedRaw ? parseAgeScore(publishedRaw) : null,
    url,
  };
}

function parseVideoSegment(segment) {
  const lines = segment.lines.map((line) => line.trim()).filter(Boolean);
  const ageIndex = [...lines].reverse().findIndex((line) => agePattern.test(line));
  if (ageIndex < 0) {
    return null;
  }

  const actualAgeIndex = lines.length - 1 - ageIndex;
  const viewsIndex = [...lines.slice(0, actualAgeIndex)].reverse().findIndex((line) => viewsPattern.test(line));
  if (viewsIndex < 0) {
    return null;
  }

  const actualViewsIndex = actualAgeIndex - 1 - viewsIndex;
  const titleLines = lines
    .slice(0, actualViewsIndex + 1)
    .filter((line) => !ignoreTitleLines.has(line) && !/^and\s+/i.test(line));

  const title = titleLines.join(" ").replace(/\s+/g, " ").trim();
  if (!title) {
    return null;
  }

  const durationSeconds = parseDurationToSeconds(segment.duration);
  const viewCount = parseCompactCount(lines[actualViewsIndex]);
  const ageScore = parseAgeScore(lines[actualAgeIndex]);

  return {
    title,
    duration: segment.duration,
    durationSeconds,
    viewsRaw: lines[actualViewsIndex],
    viewCount,
    publishedRaw: lines[actualAgeIndex],
    ageScore,
    url: segment.url ?? "",
  };
}

export function parseVideoEntriesFromText(text, limit = 30) {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const startIndex = lines.findIndex((line) => line === "Oldest");
  const content = startIndex >= 0 ? lines.slice(startIndex + 1) : lines;
  const segments = [];
  let current = null;

  for (const line of content) {
    if (!line) {
      continue;
    }

    if (durationPattern.test(line)) {
      if (current) {
        segments.push(current);
      }

      current = { duration: line, lines: [] };
      continue;
    }

    if (!current) {
      continue;
    }

    current.lines.push(line);
  }

  if (current) {
    segments.push(current);
  }

  return segments.map(parseVideoSegment).filter(Boolean).slice(0, limit);
}

export function parseVideoEntriesFromYouTubeInitialData(root, limit = 30) {
  const found = [];
  const seen = new WeakSet();

  const walk = (value) => {
    if (!value || typeof value !== "object") {
      return;
    }

    if (seen.has(value)) {
      return;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }

    if (value.videoRenderer) {
      found.push({ kind: "videoRenderer", value: value.videoRenderer });
    }

    if (value.lockupViewModel) {
      found.push({ kind: "lockupViewModel", value: value.lockupViewModel });
    }

    for (const item of Object.values(value)) {
      walk(item);
    }
  };

  walk(root);

  return found
    .map((entry) => {
      if (entry.kind === "videoRenderer") {
        const video = entry.value;
        const title = video.title?.runs?.map((run) => run.text).join("") || video.title?.simpleText || "";
        const url = video.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || (video.videoId ? `/watch?v=${video.videoId}` : "");
        const duration = video.lengthText?.simpleText || "";
        const viewsRaw = video.viewCountText?.simpleText || "";
        const publishedRaw = video.publishedTimeText?.simpleText || "";

        if (!title) {
          return null;
        }

        return {
          title,
          duration,
          durationSeconds: duration ? parseDurationToSeconds(duration) : null,
          viewsRaw,
          viewCount: viewsRaw ? parseCompactCount(viewsRaw) : null,
          publishedRaw,
          ageScore: publishedRaw ? parseAgeScore(publishedRaw) : null,
          url: url.startsWith("http") ? url : `https://www.youtube.com${url}`,
        };
      }

      if (entry.kind === "lockupViewModel") {
        return parseLockupVideo(entry.value);
      }

      return null;
    })
    .filter(Boolean)
    .slice(0, limit);
}

export function extractYtInitialDataFromRawHtml(rawHtml) {
  const token = "ytInitialData =";
  const tokenIndex = rawHtml.indexOf(token);
  if (tokenIndex < 0) {
    return null;
  }

  let cursor = tokenIndex + token.length;
  while (cursor < rawHtml.length && /\s/.test(rawHtml[cursor])) {
    cursor += 1;
  }

  if (rawHtml[cursor] !== "{") {
    return null;
  }

  const start = cursor;
  let depth = 0;
  let inString = false;
  let quote = "";
  let escape = false;

  for (; cursor < rawHtml.length; cursor += 1) {
    const char = rawHtml[cursor];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }

      if (char === "\\") {
        escape = true;
        continue;
      }

      if (char === quote) {
        inString = false;
      }

      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        const objectText = rawHtml.slice(start, cursor + 1);
        try {
          return Function(`return (${objectText});`)();
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

function topThemes(videos) {
  const buckets = new Map();
  const rules = [
    { name: "news / updates", test: /news|launch|leaks?|updates?|here/i },
    { name: "workflow / setup", test: /workflow|setup|guide|full free setup|full setup/i },
    { name: "tool / model review", test: /generator|open source|local|best|insane|free/i },
    { name: "characters / asset building", test: /character|figure|headshot|bones|cloth|asset/i },
    { name: "animation / motion", test: /animation|parkour|physics|motion|blender/i },
    { name: "printing / fabrication", test: /printed|printing|multi-part|chess set|mesh/i },
  ];

  for (const video of videos) {
    for (const rule of rules) {
      if (rule.test.test(video.title)) {
        buckets.set(rule.name, (buckets.get(rule.name) ?? 0) + 1);
      }
    }
  }

  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

function hookPatterns(videos) {
  const titles = videos.map((video) => video.title);
  const patterns = [];

  if (titles.some((title) => title.includes("—") || title.includes(" - "))) {
    patterns.push("Lead with a concrete outcome, then use a dash to explain the proof or the context.");
  }

  if (titles.some((title) => /here|insane|might change|can't ignore|dont? let|nobody is ready/i.test(title))) {
    patterns.push("Use curiosity or urgency only when it is paired with a specific artifact, tool, or workflow.");
  }

  if (titles.some((title) => /full workflow|full setup|complete|full free setup/i.test(title))) {
    patterns.push("Package the promise as an end-to-end workflow, not a small tip.");
  }

  if (titles.some((title) => /\bnews #?\d+/i.test(title))) {
    patterns.push("Use the news format when the video is a roundup, but keep the issue number and topic explicit.");
  }

  return patterns.length ? patterns : ["Titles consistently favor specificity over abstraction, so match that discipline in Agent MAXX copy."];
}

function pacingInsights(videos) {
  const durations = videos.map((video) => video.durationSeconds).filter((value) => typeof value === "number");
  const average = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null;
  const short = videos.filter((video) => (video.durationSeconds ?? 0) < 900).length;
  const medium = videos.filter((video) => (video.durationSeconds ?? 0) >= 900 && (video.durationSeconds ?? 0) < 1800).length;
  const long = videos.filter((video) => (video.durationSeconds ?? 0) >= 1800).length;

  return {
    averageSeconds: average,
    short,
    medium,
    long,
  };
}

function visualMotifs(videos) {
  const motifs = [];
  const titles = videos.map((video) => video.title.toLowerCase());

  const checks = [
    ["Blender and DCC tooling", /blender|cursor|claude code/i],
    ["local AI and open source", /local|open source|free/i],
    ["characters, figures, and humanoids", /character|figure|headshot|bones|cloth/i],
    ["3D generation and reconstruction", /3d|splats|shape|rodin|seed3d|trellis/i],
    ["news cadence and launch framing", /news|launch|here|is here|launches/i],
  ];

  for (const [label, regex] of checks) {
    if (titles.some((title) => regex.test(title))) {
      motifs.push(label);
    }
  }

  return motifs.length ? motifs : ["3D workflow proof, tools, and before/after comparisons"];
}

export function analyzeVideoEntries(videos) {
  const themeCounts = topThemes(videos);
  const pacing = pacingInsights(videos);
  const hooks = hookPatterns(videos);
  const motifs = visualMotifs(videos);

  const highestViewed = [...videos]
    .filter((video) => typeof video.viewCount === "number")
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 5);

  const titleWordMap = new Map();
  for (const video of videos) {
    for (const word of video.title.toLowerCase().split(/[^a-z0-9+#]+/i)) {
      if (word.length < 4) {
        continue;
      }
      titleWordMap.set(word, (titleWordMap.get(word) ?? 0) + 1);
    }
  }

  const repeatedTerms = [...titleWordMap.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([term, count]) => ({ term, count }));

  return {
    themeCounts,
    pacing,
    hooks,
    motifs,
    highestViewed,
    repeatedTerms,
    whatToCopy: [
      "Open with the result or the tension first, then explain the tool or workflow second.",
      "Turn every feature into a mission brief: what changed, why it matters, and what proof exists.",
      "Pair each claim with a visible artifact, download, or repeatable process.",
      "Keep titles specific and concrete instead of generic or hype-only.",
    ],
    whatToAvoid: [
      "Feature-name soup without a visible outcome.",
      "Vague claims that do not name the tool, the artifact, or the result.",
      "Long copy before the audience knows why they should care.",
      "One-off demos that do not teach the next step or the reusable workflow.",
    ],
  };
}

function formatVideoRow(video, index) {
  const parts = [
    `${index + 1}. ${video.title}`,
    `   - Rank: #${String(index + 1).padStart(2, "0")}`,
    `   - Duration: ${video.duration || "unknown"}`,
    `   - Published: ${video.publishedRaw || "unknown"}`,
    `   - Views: ${video.viewsRaw || "unknown"}`,
    `   - URL: ${video.url || "unavailable"}`,
  ];

  return parts.join("\n");
}

export function renderVideoDossierMarkdown({
  sourceUrl,
  channelName,
  generatedAt,
  browserProbe,
  videos,
  analysis,
}) {
  const lines = [];
  lines.push(`# MAXX Video Dossier`);
  lines.push("");
  lines.push(`Source: ${sourceUrl}`);
  if (channelName) {
    lines.push(`Channel: ${channelName}`);
  }
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Video count analyzed: ${videos.length}`);
  lines.push("");
  lines.push("## Browser Check");
  if (browserProbe?.ok) {
    lines.push(`- Remote browser: connected`);
    lines.push(`- Page title: ${browserProbe.title || "unknown"}`);
    if (browserProbe.bodyPreview) {
      lines.push(`- Body preview: ${browserProbe.bodyPreview}`);
    }
  } else {
    lines.push(`- Remote browser: not available${browserProbe?.error ? ` (${browserProbe.error})` : ""}`);
  }
  lines.push("");
  lines.push("## Latest 30 Uploads");
  lines.push("");
  videos.forEach((video, index) => {
    lines.push(formatVideoRow(video, index));
    lines.push("");
  });
  lines.push("## Pattern Analysis");
  lines.push("");
  lines.push("### Hook Patterns");
  analysis.hooks.forEach((hook) => lines.push(`- ${hook}`));
  lines.push("");
  lines.push("### Topic Clusters");
  if (analysis.themeCounts.length) {
    analysis.themeCounts.forEach((item) => lines.push(`- ${item.name}: ${item.count}`));
  } else {
    lines.push("- No dominant clusters detected from the current sample.");
  }
  lines.push("");
  lines.push("### Highest Viewed");
  if (analysis.highestViewed.length) {
    analysis.highestViewed.forEach((video) => {
      lines.push(`- ${video.title} — ${video.viewsRaw || "unknown"} — ${video.publishedRaw || "unknown"}`);
    });
  } else {
    lines.push("- No reliable view counts detected in the current sample.");
  }
  lines.push("");
  lines.push("### Pacing");
  lines.push(`- Average runtime: ${analysis.pacing.averageSeconds ? `${Math.round(analysis.pacing.averageSeconds / 60)} min` : "unknown"}`);
  lines.push(`- Short (<15 min): ${analysis.pacing.short}`);
  lines.push(`- Medium (15-30 min): ${analysis.pacing.medium}`);
  lines.push(`- Long (30+ min): ${analysis.pacing.long}`);
  lines.push("");
  lines.push("### Visual Motifs");
  analysis.motifs.forEach((motif) => lines.push(`- ${motif}`));
  lines.push("");
  lines.push("### Repeated Terms");
  if (analysis.repeatedTerms.length) {
    analysis.repeatedTerms.forEach((item) => lines.push(`- ${item.term}: ${item.count}`));
  } else {
    lines.push("- Not enough repetition to score terms confidently.");
  }
  lines.push("");
  lines.push("## What MAXX Should Copy");
  analysis.whatToCopy.forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("## What MAXX Should Avoid");
  analysis.whatToAvoid.forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("## Model Instruction");
  lines.push("- Treat this dossier as a reusable briefing template.");
  lines.push("- Convert the strongest recurring hook into the skill title, the launch copy, and the dashboard launcher.");
  lines.push("- Keep the first screen outcome-first, not feature-first.");
  lines.push("- Package every skill with a written artifact the next model can reuse.");

  return lines.join("\n");
}
