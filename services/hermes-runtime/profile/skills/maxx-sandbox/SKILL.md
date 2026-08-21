# MAXX Sandbox

Use MAXX Sandbox when a Pup needs a safe scratch computer for shell/file work without touching the VPS host, production repositories, customer credentials, or provider secrets.

## What it replaces

This is the MAXX-owned replacement for the useful part of Orgo's shared cloud computer:
- a persistent place for agent-created files,
- a shell for bounded computation and transforms,
- a workspace that survives browser/laptop disconnects,
- one shared service behind MAXX with separate per-Pup directories.

It deliberately does **not** replace MAXX governance, browser approval policy, production connectors, hosting credentials, or customer systems.

## Available MCP tools

- `sandbox_status()` — inspect the self-hosted sandbox capability contract.
- `sandbox_list_files(pup_name, path=".")`
- `sandbox_read_file(pup_name, path)`
- `sandbox_write_file(pup_name, path, content)`
- `sandbox_exec(pup_name, command, cwd=".")`

## Use it for

- scratch Python/Node/shell calculations,
- parsing and transforming files,
- local git inspection or generated code experiments,
- preparing artifacts before an approved deployment,
- repeatable tests that should not run inside the Hermes profile home,
- handoffs where one Pup needs a durable workspace without sharing its conversation memory.

## Do not use it for

- storing API keys, passwords, tokens, or private customer credentials,
- direct production mutation,
- sending messages or publishing,
- bypassing MAXX approval gates,
- accessing the host Docker socket or VPS filesystem,
- pretending a sandbox result proves a production system changed.

## Proof rule

Sandbox proof means the command/file operation happened **inside the MAXX sandbox only**. If the desired outcome is external (website deployed, email sent, post published), use the dedicated MAXX connector/hosting/browser capability and collect target-environment proof.

## Pup isolation

Built-in Pups map to separate persistent workspace directories:
- Scout / Chief Pup → `chief-pup`
- Doer / Superdoer → `superdoer`
- Biz Pup → `business-pup`

Do not infer that filesystem isolation grants separate business authority. MAXX/ICM/Supabase remain the policy and truth layers.
