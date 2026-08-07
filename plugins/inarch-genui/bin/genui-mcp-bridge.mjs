#!/usr/bin/env node
// stdio ⇄ MCP-over-HTTP bridge for the Agent Plugins package.
//
// WHY A BRIDGE AND NOT A DIRECT streamable-http ENTRY. The deployment's /mcp
// endpoint requires `Authorization: Bearer <token>`, and Agent Plugins 1.0.0
// is explicit that configured headers are "literal, visible package data and
// must not contain credentials or secrets" — it defines no portable field for
// a credential reference and leaves authentication client-managed. A plugin
// that shipped a working token would put a corpus credential into every clone
// of the repository it is installed from.
//
// So the transport is stdio, the token is read from the environment at run
// time, and the package itself carries nothing secret. The cost is one Node
// process per session; the alternative is either a leaked token or a plugin
// that cannot authenticate at all.
//
// This file speaks NO MCP semantics. It moves JSON-RPC frames between stdin
// and an HTTP endpoint, so protocol changes on the server need no change here.
//
// .mjs AND NOT .js, because an installed plugin is a bare directory with no
// package.json above it. In this repository `"type": "module"` makes the ES
// syntax below work; at an install path nothing does, and node refuses the
// file with "Make sure to set type: module". Found by copying the package to a
// real plugin cache and running it from there — it worked in the source tree
// the whole time.
//
// Environment:
//   GENUI_MCP_URL     defaults to the production deployment
//   GENUI_MCP_TOKEN   required; issued with bin/genui-token.js
//                     GENUI_TOKEN is accepted as an alias

import { createInterface } from 'node:readline';

const URL_ = process.env.GENUI_MCP_URL
  ?? 'https://genui.intelligence-architects.com/mcp';
const TOKEN = process.env.GENUI_MCP_TOKEN ?? process.env.GENUI_TOKEN ?? '';

const write = (msg) => process.stdout.write(`${JSON.stringify(msg)}\n`);

/**
 * Report a failure as a JSON-RPC error rather than by dying.
 *
 * A bridge that exits on a bad token takes the whole MCP connection down, and
 * the agent sees "server unavailable" — which sends whoever is debugging it
 * looking at the network rather than at their configuration. An error frame
 * carrying the actual reason reaches the model, which can then say what is
 * wrong in words the user can act on.
 */
const fail = (id, code, message) => write({
  jsonrpc: '2.0', id: id ?? null, error: { code, message },
});

if (!TOKEN) {
  // Announced once on stderr as well: a client that logs subprocess stderr
  // shows this at startup, which is where a missing-token problem is cheapest
  // to notice.
  process.stderr.write(
    '[genui] GENUI_MCP_TOKEN is not set — the library cannot be reached.\n'
    + '[genui] Issue a token with bin/genui-token.js and export it, or ask a\n'
    + '[genui] curator for one. Every request will fail until then.\n');
}

const rl = createInterface({ input: process.stdin });

for await (const line of rl) {
  const text = line.trim();
  if (!text) continue;

  let frame;
  try {
    frame = JSON.parse(text);
  } catch {
    fail(null, -32700, 'parse error');
    continue;
  }

  // A notification has no id and expects no reply (JSON-RPC 2.0). Forwarded
  // for its side effects, but nothing is written back — answering one would
  // put an unsolicited frame on the wire that some clients treat as protocol
  // corruption.
  const isNotification = frame.id === undefined || frame.id === null;

  if (!TOKEN) {
    if (!isNotification) {
      fail(frame.id, -32001,
        'GENUI_MCP_TOKEN is not set. Issue one with bin/genui-token.js, or ask '
        + 'a curator of the pattern library for a token, then set it in the '
        + 'environment of this agent.');
    }
    continue;
  }

  try {
    const res = await fetch(URL_, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(frame),
      // Long enough for a cold retrieval on a sleeping deployment, short
      // enough that a hung request does not stall the agent indefinitely.
      signal: AbortSignal.timeout(30_000),
    });

    if (res.status === 401 || res.status === 403) {
      if (!isNotification) {
        fail(frame.id, -32001,
          `the pattern library refused this token (HTTP ${res.status}). It may `
          + 'be expired, revoked, or issued for a different deployment. '
          + 'bin/genui-token.js issues a new one.');
      }
      continue;
    }

    const body = await res.text();
    if (!res.ok) {
      if (!isNotification) {
        fail(frame.id, -32000,
          `the pattern library answered HTTP ${res.status}: ${body.slice(0, 200)}`);
      }
      continue;
    }

    // An empty body is the correct answer to a notification. Writing anything
    // here would be that unsolicited frame.
    if (!body.trim()) continue;
    process.stdout.write(body.endsWith('\n') ? body : `${body}\n`);
  } catch (err) {
    if (isNotification) continue;
    const reason = err.name === 'TimeoutError'
      ? `no answer from ${URL_} within 30s`
      : `${URL_} is unreachable: ${err.message}`;
    fail(frame.id, -32000, reason);
  }
}
