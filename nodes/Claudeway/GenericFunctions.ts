import type {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export async function claudewayApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
	query?: IDataObject,
	timeoutMs?: number,
): Promise<JsonObject> {
	const credentials = await this.getCredentials('claudewayApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${path}`,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${credentials.apiKey}`,
		},
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (query && Object.keys(query).length > 0) {
		options.qs = query;
	}

	if (timeoutMs) {
		options.timeout = timeoutMs;
	}

	try {
		return (await this.helpers.httpRequest(options)) as JsonObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `Claudeway API error: ${(error as Error).message}`,
		});
	}
}

export interface SseResult {
	response: JsonObject;
	streamedText: string;
}

export async function claudewayApiRequestSSE(
	this: IExecuteFunctions,
	body: object,
	timeoutMs: number,
): Promise<SseResult> {
	const credentials = await this.getCredentials('claudewayApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: `${baseUrl}/task/stream`,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${credentials.apiKey}`,
			Accept: 'text/event-stream',
		},
		body,
		returnFullResponse: true,
		encoding: 'stream',
		timeout: timeoutMs,
	};

	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await this.helpers.httpRequest(options) as any;
		const stream = response.body ?? response;
		return await parseSseStream(stream);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `Claudeway SSE error: ${(error as Error).message}`,
		});
	}
}

// Exported for testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseSseStream(stream: any): Promise<SseResult> {
	return new Promise((resolve, reject) => {
		let buffer = '';
		let streamedText = '';
		let finalResponse: JsonObject | null = null;

		const processLine = (line: string) => {
			if (line.startsWith('data: ')) {
				const data = line.slice(6);
				// The event type comes from the preceding "event:" line
				if (currentEvent === 'text') {
					streamedText += data;
				} else if (currentEvent === 'done') {
					try {
						finalResponse = JSON.parse(data) as JsonObject;
					} catch {
						// If we can't parse, store as raw text
						finalResponse = { result: data } as unknown as JsonObject;
					}
				}
				// permission_denied events are included in the done response
			} else if (line.startsWith('event: ')) {
				currentEvent = line.slice(7).trim();
			}
		};

		let currentEvent = '';

		stream.on('data', (chunk: Buffer) => {
			buffer += chunk.toString();
			const lines = buffer.split('\n');
			// Keep the last potentially incomplete line in the buffer
			buffer = lines.pop() || '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed) {
					processLine(trimmed);
				}
			}
		});

		stream.on('end', () => {
			// Process any remaining data in buffer
			if (buffer.trim()) {
				processLine(buffer.trim());
			}

			if (finalResponse) {
				resolve({ response: finalResponse, streamedText });
			} else {
				reject(new Error('SSE stream ended without a done event'));
			}
		});

		stream.on('error', (error: Error) => {
			reject(error);
		});
	});
}
