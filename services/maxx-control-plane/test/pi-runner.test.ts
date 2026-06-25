import assert from "node:assert/strict";
import test from "node:test";
import { buildPiInvocation } from "../src/pi-runner.js";

test("builds a shell-free Pi invocation for a registered skill", () => {
  const invocation = buildPiInvocation({
    executable: "C:/tools/pi.exe",
    skillId: "maxx-code-search",
    input: { query: "Dashboard" },
  });

  assert.equal(invocation.command, "C:/tools/pi.exe");
  assert.deepEqual(invocation.args.slice(0, 2), ["--skill", "maxx-code-search"]);
  assert.equal(invocation.shell, false);
});

test("rejects skills outside the trusted registry", () => {
  assert.throws(
    () =>
      buildPiInvocation({
        executable: "pi",
        skillId: "run-any-command",
        input: {},
      }),
    /Unregistered MAXX skill/,
  );
});
