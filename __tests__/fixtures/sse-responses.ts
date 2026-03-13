import { EventEmitter } from 'events';

export function createMockStream(events: Array<{ event: string; data: string }>): EventEmitter {
	const stream = new EventEmitter();

	// Simulate async SSE delivery
	setTimeout(() => {
		for (const { event, data } of events) {
			const chunk = `event: ${event}\ndata: ${data}\n\n`;
			stream.emit('data', Buffer.from(chunk));
		}
		stream.emit('end');
	}, 10);

	return stream;
}

export const taskResponseJson = {
	session_id: 'test-session-123',
	result: 'Hello from Claude!',
	success: true,
	duration_ms: 1500,
	tokens: {
		input: 100,
		output: 50,
		cache_read: 20,
		cache_write: 0,
	},
	cost_usd: 0.005,
	error: null,
};

export const taskResponseWithDenialsJson = {
	session_id: 'test-session-456',
	result: null,
	success: true,
	duration_ms: 800,
	tokens: {
		input: 80,
		output: 30,
		cache_read: 0,
		cache_write: 0,
	},
	cost_usd: 0.003,
	error: null,
	permission_denials: [
		{
			tool_name: 'Bash',
			tool_use_id: 'tool-use-abc',
			tool_input: { command: 'rm -rf /' },
		},
	],
};

export const errorResponseJson = {
	session_id: 'test-session-789',
	result: null,
	success: false,
	duration_ms: 0,
	tokens: null,
	cost_usd: null,
	error: 'Claude CLI returned an error',
};
