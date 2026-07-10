import { mkdir, appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type MemoryDocument = {
  id: string;
  runId: string;
  missionId: string;
  source: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
};

export type MemorySearchResult = {
  document: MemoryDocument;
  score: number;
};

export interface MemoryIndexer {
  indexDocument(input: Omit<MemoryDocument, "id" | "createdAt">): Promise<MemoryDocument>;
  search(query: string, limit?: number): Promise<MemorySearchResult[]>;
  listByRun(runId: string): Promise<MemoryDocument[]>;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

// Keyword term-frequency scoring, not semantic search. No embedding provider
// is configured in this environment (no OPENAI/COHERE-style API key), so a
// vector index would be dishonest to build without something to call. This
// gives useful recall over mission history today and can be swapped for an
// embedding-backed indexer later without changing the MemoryIndexer contract.
function scoreDocument(queryTerms: string[], document: MemoryDocument): number {
  const haystack = tokenize(`${document.title} ${document.content} ${document.tags.join(" ")}`);
  if (haystack.length === 0 || queryTerms.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const token of haystack) counts.set(token, (counts.get(token) ?? 0) + 1);
  let score = 0;
  for (const term of queryTerms) score += counts.get(term) ?? 0;
  return score / haystack.length;
}

export class FileMemoryIndexer implements MemoryIndexer {
  private documents: MemoryDocument[] = [];
  private loaded: Promise<void> | undefined;

  constructor(private readonly indexPath: string) {}

  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) this.loaded = this.load();
    await this.loaded;
  }

  private async load(): Promise<void> {
    try {
      const raw = await readFile(this.indexPath, "utf8");
      this.documents = raw
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as MemoryDocument);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      this.documents = [];
    }
  }

  async indexDocument(input: Omit<MemoryDocument, "id" | "createdAt">): Promise<MemoryDocument> {
    await this.ensureLoaded();
    const document: MemoryDocument = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
    this.documents.push(document);
    await mkdir(path.dirname(this.indexPath), { recursive: true });
    await appendFile(this.indexPath, `${JSON.stringify(document)}\n`, "utf8");
    return document;
  }

  async search(query: string, limit = 10): Promise<MemorySearchResult[]> {
    await this.ensureLoaded();
    const queryTerms = tokenize(query);
    return this.documents
      .map((document) => ({ document, score: scoreDocument(queryTerms, document) }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async listByRun(runId: string): Promise<MemoryDocument[]> {
    await this.ensureLoaded();
    return this.documents.filter((document) => document.runId === runId);
  }
}

export class InMemoryMemoryIndexer implements MemoryIndexer {
  private documents: MemoryDocument[] = [];

  async indexDocument(input: Omit<MemoryDocument, "id" | "createdAt">): Promise<MemoryDocument> {
    const document: MemoryDocument = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
    this.documents.push(document);
    return document;
  }

  async search(query: string, limit = 10): Promise<MemorySearchResult[]> {
    const queryTerms = tokenize(query);
    return this.documents
      .map((document) => ({ document, score: scoreDocument(queryTerms, document) }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async listByRun(runId: string): Promise<MemoryDocument[]> {
    return this.documents.filter((document) => document.runId === runId);
  }
}

export function createMemoryIndexer(config: { memoryEnabled: boolean; indexPath: string }): MemoryIndexer {
  return config.memoryEnabled ? new FileMemoryIndexer(config.indexPath) : new InMemoryMemoryIndexer();
}
