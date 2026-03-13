import { parseSseStream } from '../nodes/Claudeway/GenericFunctions';
import {
	createMockStream,
	taskResponseJson,
	taskResponseWithDenialsJson,
	errorResponseJson,
} from './fixtures/sse-responses';

describe('parseSseStream', () => {
	it('should parse a normal SSE stream with text events and done event', async () => {
		const stream = createMockStream([
			{ event: 'text', data: 'Hello' },
			{ event: 'text', data: ' from Claude!' },
			{ event: 'done', data: JSON.stringify(taskResponseJson) },
		]);

		const result = await parseSseStream(stream);

		expect(result.streamedText).toBe('Hello from Claude!');
		expect(result.response).toEqual(taskResponseJson);
	});

	it('should handle a stream with only a done event (no text)', async () => {
		const stream = createMockStream([
			{ event: 'done', data: JSON.stringify(taskResponseJson) },
		]);

		const result = await parseSseStream(stream);

		expect(result.streamedText).toBe('');
		expect(result.response.success).toBe(true);
		expect(result.response.result).toBe('Hello from Claude!');
	});

	it('should handle permission_denied events before done', async () => {
		const denials = taskResponseWithDenialsJson.permission_denials;
		const stream = createMockStream([
			{ event: 'text', data: 'Working on it...' },
			{ event: 'permission_denied', data: JSON.stringify(denials) },
			{ event: 'done', data: JSON.stringify(taskResponseWithDenialsJson) },
		]);

		const result = await parseSseStream(stream);

		expect(result.streamedText).toBe('Working on it...');
		expect(result.response.permission_denials).toEqual(denials);
	});

	it('should handle error responses in done event', async () => {
		const stream = createMockStream([
			{ event: 'done', data: JSON.stringify(errorResponseJson) },
		]);

		const result = await parseSseStream(stream);

		expect(result.response.success).toBe(false);
		expect(result.response.error).toBe('Claude CLI returned an error');
	});

	it('should reject if stream ends without done event', async () => {
		const stream = createMockStream([
			{ event: 'text', data: 'Some text' },
		]);

		await expect(parseSseStream(stream)).rejects.toThrow('SSE stream ended without a done event');
	});

	it('should reject on stream error', async () => {
		const stream = createMockStream([]);

		// Override the default behavior to emit an error instead
		const errorStream = Object.create(stream);
		const originalOn = stream.on.bind(stream);
		let errorHandler: ((err: Error) => void) | null = null;

		errorStream.on = (event: string, handler: (...args: unknown[]) => void) => {
			if (event === 'error') {
				errorHandler = handler as (err: Error) => void;
			}
			originalOn(event, handler);
			return errorStream;
		};

		const promise = parseSseStream(errorStream);

		setTimeout(() => {
			if (errorHandler) {
				errorHandler(new Error('Connection reset'));
			}
		}, 5);

		await expect(promise).rejects.toThrow('Connection reset');
	});

	it('should handle chunked data that splits across boundaries', async () => {
		const { EventEmitter } = require('events');
		const stream = new EventEmitter();

		// Manually emit data in chunks that split mid-line
		setTimeout(() => {
			stream.emit('data', Buffer.from('event: text\nda'));
			stream.emit('data', Buffer.from('ta: Hello World\n\n'));
			stream.emit('data', Buffer.from(`event: done\ndata: ${JSON.stringify(taskResponseJson)}\n\n`));
			stream.emit('end');
		}, 10);

		const result = await parseSseStream(stream);

		expect(result.streamedText).toBe('Hello World');
		expect(result.response.session_id).toBe('test-session-123');
	});
});
