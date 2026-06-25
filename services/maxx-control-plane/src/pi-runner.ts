import { spawn } from "node:child_process";
import { TRUSTED_SKILLS } from "./skills.js";

export function buildPiInvocation(input: {
  executable: string;
  skillId: string;
  input: Record<string, unknown>;
}) {
  if (!TRUSTED_SKILLS.some((skill) => skill.id === input.skillId)) {
    throw new Error("Unregistered MAXX skill");
  }

  return {
    command: input.executable,
    args: ["--skill", input.skillId, "--input-json", JSON.stringify(input.input)],
    shell: false as const,
  };
}

export async function runPiSkill(input: {
  executable: string;
  skillId: string;
  payload: Record<string, unknown>;
  timeoutMs?: number;
}) {
  const invocation = buildPiInvocation({
    executable: input.executable,
    skillId: input.skillId,
    input: input.payload,
  });

  return new Promise<{ exitCode: number; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, {
      shell: invocation.shell,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const outputLimit = 1_000_000;
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Pi skill execution timed out"));
    }, input.timeoutMs ?? 120_000);

    child.stdout.on("data", (chunk) => {
      if (stdout.length < outputLimit) stdout += String(chunk).slice(0, outputLimit - stdout.length);
    });
    child.stderr.on("data", (chunk) => {
      if (stderr.length < outputLimit) stderr += String(chunk).slice(0, outputLimit - stderr.length);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode: exitCode ?? 1, stdout, stderr });
    });
  });
}
