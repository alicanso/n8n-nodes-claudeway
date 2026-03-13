# n8n-nodes-claudeway

This is an n8n community node for [Claudeway](https://github.com/alicansoysal/claudeway) — a high-performance HTTP gateway for the Claude CLI.

Use Claude AI in your n8n workflows through Claudeway's REST API, with full support for one-shot tasks, streaming, persistent multi-turn sessions, and cost tracking.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Prerequisites

You need a running [Claudeway](https://github.com/alicansoysal/claudeway) server with an API key configured.

## Credentials

| Field | Description |
|-------|-------------|
| **Base URL** | Your Claudeway server URL (e.g. `http://localhost:3000`) |
| **API Key** | Bearer token for authentication |

The connection test validates both server reachability and API key validity.

## Operations

### Task

| Operation | Description |
|-----------|-------------|
| **Run Task** | Execute a one-shot Claude prompt and get the response |
| **Run Task (Streaming)** | Execute with SSE streaming — collects all chunks and returns the final response |

### Session

| Operation | Description |
|-----------|-------------|
| **Start Session** | Create a persistent multi-turn conversation session |
| **Continue Session** | Send a message to an existing session |
| **Get Info** | Get session metadata (token counts, cost, task count) |
| **Delete** | Delete a session and clean up its working directory |
| **Approve Permissions** | Approve previously denied tool permissions in a session |

### Admin

| Operation | Description |
|-----------|-------------|
| **Health Check** | Check server status, version, and uptime |
| **List Models** | List available Claude models |

## Example Workflows

### One-shot task

1. Add a **Claudeway** node
2. Set Resource to **Task**, Operation to **Run Task**
3. Enter your prompt
4. The output includes the result, token usage, and cost

### Multi-turn session

1. **Claudeway** (Start Session) — creates a session, outputs `session_id`
2. **Claudeway** (Continue Session) — uses `{{ $json.session_id }}`, sends first message
3. **Claudeway** (Continue Session) — continues the conversation
4. **Claudeway** (Delete) — cleans up when done

### Permission approval flow

1. **Claudeway** (Continue Session) — Claude requests tool permission
2. **IF** node — checks `{{ $json.permission_denials.length > 0 }}`
3. **Claudeway** (Approve Permissions) — approves with `tool_use_id` values from denials
4. Continues the workflow

## Compatibility

- n8n version 1.0.0 or later
- Claudeway server running and accessible

## License

[MIT](LICENSE)
