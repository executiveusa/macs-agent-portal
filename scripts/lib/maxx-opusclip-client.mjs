const DEFAULT_BASE_URL = "https://api.opus.pro/api";
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_RETRIES = 2;
const COPYRIGHT_NOTICE =
  "Using video you don't own may violate copyright laws. By continuing, you confirm this is your own original content.";

export class OpusClipConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "OpusClipConfigError";
  }
}

export class OpusClipApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "OpusClipApiError";
    this.status = details.status;
    this.body = details.body;
  }
}

function requireApiKey(apiKey) {
  const value = apiKey?.trim();
  if (!value) {
    throw new OpusClipConfigError(
      "Missing OPUSCLIP_API_KEY. Configure it in the runtime environment before calling OpusClip.",
    );
  }

  return value;
}

function cleanBaseUrl(baseUrl) {
  return (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function clipSuffix(clipId, projectId) {
  const value = requireString(clipId, "clipId");
  const prefix = projectId ? `${projectId}.` : "";
  return prefix && value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function requireString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${fieldName} is required`);
  }

  return value.trim();
}

function normalizeDurations(durations = process.env.MAXX_OPUSCLIP_DEFAULT_DURATIONS ?? "30,60,90") {
  if (Array.isArray(durations)) {
    return durations.map(Number).filter((duration) => Number.isFinite(duration) && duration > 0);
  }

  return String(durations)
    .split(",")
    .map((duration) => Number(duration.trim()))
    .filter((duration) => Number.isFinite(duration) && duration > 0);
}

function buildProjectPayload(options) {
  const sourceUri = requireString(options.url ?? options.sourceUri, "url");
  const clipDurations = normalizeDurations(options.durations);
  if (!clipDurations.length) {
    throw new TypeError("durations must include at least one positive number");
  }

  const payload = {
    sourceUri,
    curationPref: {
      clipDurations,
      aspectRatio: options.aspect ?? process.env.MAXX_OPUSCLIP_DEFAULT_ASPECT ?? "portrait",
      model: options.model ?? process.env.MAXX_OPUSCLIP_DEFAULT_MODEL ?? "ClipBasic",
    },
  };

  if (options.prompt) payload.curationPref.prompt = options.prompt;
  if (options.keywords) payload.curationPref.keywords = splitCsv(options.keywords);
  if (options.rangeStart || options.rangeEnd) {
    payload.curationPref.selectedRanges = [
      {
        start: Number(options.rangeStart ?? 0),
        end: Number(options.rangeEnd ?? 0),
      },
    ].filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start);
  }
  if (options.template) payload.brandTemplateId = options.template;
  if (options.genre) payload.genre = options.genre;
  if (options.lang) payload.language = options.lang;
  if (options.title) payload.title = options.title;
  if (options.webhook) payload.webhookUrl = options.webhook;
  if (options.skipCurate) payload.skipCurate = true;
  if (options.removeFiller) payload.removeFillerWords = true;

  return payload;
}

function splitCsv(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPostDetail(options) {
  const title = options.title?.trim();
  if (!title) {
    throw new TypeError("title is required for publishing or scheduling");
  }

  return {
    title,
    custom: {
      description: options.description ?? "",
      privacy: options.privacy ?? "public",
    },
  };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createOpusClipClient({
  apiKey = process.env.OPUSCLIP_API_KEY,
  baseUrl = process.env.OPUSCLIP_BASE_URL,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRIES,
} = {}) {
  const token = requireApiKey(apiKey);
  if (typeof fetchImpl !== "function") {
    throw new OpusClipConfigError("Global fetch is unavailable. Use Node.js 18 or newer.");
  }

  const root = cleanBaseUrl(baseUrl);

  async function request(path, options = {}) {
    const method = options.method ?? "GET";
    const body = options.body === undefined ? undefined : JSON.stringify(options.body);
    const url = `${root}${path.startsWith("/") ? path : `/${path}`}`;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetchImpl(url, {
          method,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
          },
          body,
          signal: controller.signal,
        });

        const responseBody = await readResponseBody(response);

        if (response.ok) {
          return responseBody;
        }

        if (response.status === 429 && attempt < retries) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "0");
          await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1500 * (attempt + 1));
          continue;
        }

        throw new OpusClipApiError(`OpusClip API request failed with HTTP ${response.status}`, {
          status: response.status,
          body: responseBody,
        });
      } catch (error) {
        if (error instanceof OpusClipApiError || attempt >= retries) {
          throw error;
        }

        await sleep(1000 * (attempt + 1));
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new OpusClipApiError("OpusClip API request failed after retries");
  }

  return {
    notice: COPYRIGHT_NOTICE,
    createProjectFromUrl(options) {
      return request("/clip-projects", {
        method: "POST",
        body: buildProjectPayload(options),
      });
    },
    getClipsByProjectId(projectId) {
      return request(`/exportable-clips?q=findByProjectId&projectId=${encodeURIComponent(requireString(projectId, "projectId"))}`);
    },
    async describeClip(projectId, clipId) {
      const clips = await this.getClipsByProjectId(projectId);
      const list = Array.isArray(clips) ? clips : clips?.items ?? clips?.data ?? clips?.clips ?? [];
      const suffix = clipSuffix(clipId, projectId);
      const found = list.find((clip) => {
        const candidate = String(clip.clip_id ?? clip.clipId ?? clip.id ?? clip.contentId ?? "");
        return candidate === suffix || candidate === clipId || candidate.endsWith(`.${suffix}`);
      });

      if (!found) {
        throw new OpusClipApiError(`Clip not found for project ${projectId}: ${clipId}`, { body: { projectId, clipId } });
      }

      return found;
    },
    listProjects({ page = 0, pageSize = 20 } = {}) {
      return request(`/clip-projects?q=mine&page=${Number(page)}&pageSize=${Number(pageSize)}`);
    },
    getTranscript(projectId) {
      return request(`/transcripts?q=findByProjectId&projectId=${encodeURIComponent(requireString(projectId, "projectId"))}`);
    },
    listBrandTemplates() {
      return request("/brand-templates?q=mine");
    },
    shareProject(projectId) {
      return request(`/clip-projects/${encodeURIComponent(requireString(projectId, "projectId"))}/update-visibility`, {
        method: "POST",
        body: { visibility: "PUBLIC" },
      });
    },
    listSocialAccounts() {
      return request("/social-accounts?q=mine");
    },
    generateSocialCopy(options) {
      return request("/social-copy-jobs", {
        method: "POST",
        body: {
          projectId: requireString(options.projectId, "projectId"),
          clipId: clipSuffix(options.clipId, options.projectId),
          postAccountId: requireString(options.accountId, "accountId"),
          prompt: options.prompt ?? "",
        },
      });
    },
    getSocialCopyJob(jobId) {
      return request(`/social-copy-jobs/${encodeURIComponent(requireString(jobId, "jobId"))}`);
    },
    publishPost(options) {
      return request("/post-tasks", {
        method: "POST",
        body: {
          projectId: requireString(options.projectId, "projectId"),
          clipId: clipSuffix(options.clipId, options.projectId),
          postAccountId: requireString(options.accountId, "accountId"),
          subAccountId: options.subAccountId,
          postDetail: buildPostDetail(options),
        },
      });
    },
    schedulePost(options) {
      return request("/publish-schedules", {
        method: "POST",
        body: {
          projectId: requireString(options.projectId, "projectId"),
          clipId: clipSuffix(options.clipId, options.projectId),
          postAccountId: requireString(options.accountId, "accountId"),
          subAccountId: options.subAccountId,
          publishAt: requireString(options.publishAt, "publishAt"),
          postDetail: buildPostDetail(options),
        },
      });
    },
    cancelScheduledPost(scheduleId) {
      return request(`/publish-schedules/${encodeURIComponent(requireString(scheduleId, "scheduleId"))}`, {
        method: "DELETE",
      });
    },
    createCollection(name) {
      return request("/collections", {
        method: "POST",
        body: { name: requireString(name, "name") },
      });
    },
    listCollections() {
      return request("/collections?q=mine");
    },
    addClipToCollection(collectionId, contentId) {
      return request(`/collections/${encodeURIComponent(requireString(collectionId, "collectionId"))}/contents`, {
        method: "POST",
        body: { contentId: requireString(contentId, "contentId") },
      });
    },
    exportCollection(collectionId) {
      return request(`/collections/${encodeURIComponent(requireString(collectionId, "collectionId"))}/export`, {
        method: "POST",
      });
    },
    createThumbnailJob(options) {
      return request("/generative-jobs", {
        method: "POST",
        body: {
          jobType: "thumbnail",
          sourceUri: requireString(options.url ?? options.sourceUri, "url"),
          prompt: options.prompt ?? "",
        },
      });
    },
    getThumbnailJob(jobId) {
      return request(`/generative-jobs/${encodeURIComponent(requireString(jobId, "jobId"))}`);
    },
    createCensorJob(options) {
      return request("/censor-jobs", {
        method: "POST",
        body: {
          projectId: requireString(options.projectId, "projectId"),
          clipId: clipSuffix(options.clipId, options.projectId),
          options: {
            beepSound: Boolean(options.beepSound),
          },
        },
      });
    },
    getCensorJob(jobId) {
      return request(`/censor-jobs/${encodeURIComponent(requireString(jobId, "jobId"))}`);
    },
    getUsage() {
      return request("/api-usage?q=mine");
    },
  };
}

export { COPYRIGHT_NOTICE, clipSuffix, normalizeDurations };
