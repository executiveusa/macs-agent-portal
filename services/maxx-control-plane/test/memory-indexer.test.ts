import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileMemoryIndexer, InMemoryMemoryIndexer, createMemoryIndexer } from "../src/memory-indexer.js";

test("InMemoryMemoryIndexer ranks documents containing more query terms higher", async () => {
  const indexer = new InMemoryMemoryIndexer();
  await indexer.indexDocument({
    runId: "run-1",
    missionId: "mission-1",
    source: "test",
    title: "Donor churn analysis",
    content: "Donor churn increased in Q3 due to lapsed monthly gifts",
    tags: ["donor", "churn"],
  });
  await indexer.indexDocument({
    runId: "run-1",
    missionId: "mission-1",
    source: "test",
    title: "Volunteer scheduling",
    content: "Volunteer shifts were reorganized for the gala",
    tags: ["volunteer"],
  });

  const results = await indexer.search("donor churn");
  assert.equal(results.length, 1);
  assert.match(results[0].document.title, /Donor churn/);
});

test("InMemoryMemoryIndexer returns no results for an unmatched query", async () => {
  const indexer = new InMemoryMemoryIndexer();
  await indexer.indexDocument({
    runId: "run-1",
    missionId: "mission-1",
    source: "test",
    title: "Donor churn analysis",
    content: "Donor churn increased in Q3",
    tags: [],
  });
  const results = await indexer.search("unrelated query terms");
  assert.equal(results.length, 0);
});

test("listByRun filters to the requested run", async () => {
  const indexer = new InMemoryMemoryIndexer();
  await indexer.indexDocument({
    runId: "run-1",
    missionId: "mission-1",
    source: "test",
    title: "A",
    content: "content a",
    tags: [],
  });
  await indexer.indexDocument({
    runId: "run-2",
    missionId: "mission-2",
    source: "test",
    title: "B",
    content: "content b",
    tags: [],
  });
  const results = await indexer.listByRun("run-1");
  assert.equal(results.length, 1);
  assert.equal(results[0].title, "A");
});

test("FileMemoryIndexer persists documents across instances", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "maxx-memory-"));
  const indexPath = path.join(dir, "index.jsonl");
  try {
    const first = new FileMemoryIndexer(indexPath);
    await first.indexDocument({
      runId: "run-1",
      missionId: "mission-1",
      source: "test",
      title: "Donor churn analysis",
      content: "Donor churn increased in Q3",
      tags: ["donor"],
    });

    const raw = await readFile(indexPath, "utf8");
    assert.equal(raw.trim().split("\n").length, 1);

    const second = new FileMemoryIndexer(indexPath);
    const results = await second.search("donor churn");
    assert.equal(results.length, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("createMemoryIndexer picks the file-backed indexer only when memory is enabled", () => {
  assert.ok(createMemoryIndexer({ memoryEnabled: false, indexPath: "/tmp/unused.jsonl" }) instanceof InMemoryMemoryIndexer);
  assert.ok(createMemoryIndexer({ memoryEnabled: true, indexPath: "/tmp/unused.jsonl" }) instanceof FileMemoryIndexer);
});
