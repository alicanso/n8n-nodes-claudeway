import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import type { ChatResult } from '@langchain/core/outputs';
import type { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import type { BindToolsInput } from '@langchain/core/language_models/chat_models';
import type { Runnable } from '@langchain/core/runnables';
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import type { AIMessageChunk } from '@langchain/core/messages';

export interface ChatClaudewayInput {
	baseUrl: string;
	apiKey: string;
	model?: string;
	systemPrompt?: string;
	timeoutSecs?: number;
}

export class ChatClaudeway extends BaseChatModel {
	lc_serializable = false;

	// Required for isChatInstance() check in n8n
	static lc_name() {
		return 'ChatClaudeway';
	}

	lc_namespace = ['langchain', 'chat_models', 'claudeway'];

	baseUrl: string;
	apiKey: string;
	model?: string;
	systemPrompt?: string;
	timeoutSecs: number;

	constructor(fields: ChatClaudewayInput) {
		super({});
		this.baseUrl = fields.baseUrl.replace(/\/$/, '');
		this.apiKey = fields.apiKey;
		this.model = fields.model;
		this.systemPrompt = fields.systemPrompt;
		this.timeoutSecs = fields.timeoutSecs ?? 120;
	}

	_llmType(): string {
		return 'claudeway';
	}

	// Required for Tools Agent compatibility
	bindTools(
		_tools: BindToolsInput[],
		_kwargs?: Partial<this['ParsedCallOptions']>,
	): Runnable<BaseLanguageModelInput, AIMessageChunk, this['ParsedCallOptions']> {
		// Claudeway/Claude CLI handles tools internally via --allowedTools
		// We return self since tool binding is handled server-side
		return this as unknown as Runnable<BaseLanguageModelInput, AIMessageChunk, this['ParsedCallOptions']>;
	}

	async _generate(
		messages: BaseMessage[],
		_options: this['ParsedCallOptions'],
		_runManager?: CallbackManagerForLLMRun,
	): Promise<ChatResult> {
		// Convert LangChain messages to a single prompt string for Claudeway
		const prompt = this._messagesToPrompt(messages);

		const body: Record<string, unknown> = { prompt };
		if (this.model) body.model = this.model;
		if (this.systemPrompt) body.system_prompt = this.systemPrompt;
		body.timeout_secs = this.timeoutSecs;

		const response = await fetch(`${this.baseUrl}/task`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify(body),
			signal: AbortSignal.timeout((this.timeoutSecs + 10) * 1000),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Claudeway API error (${response.status}): ${errorText}`);
		}

		const data = (await response.json()) as {
			result?: string;
			success: boolean;
			error?: string;
			tokens?: {
				input: number;
				output: number;
				cache_read: number;
				cache_write: number;
			};
			cost_usd?: number;
		};

		if (!data.success) {
			throw new Error(`Claudeway task failed: ${data.error ?? 'Unknown error'}`);
		}

		const text = data.result ?? '';

		return {
			generations: [
				{
					text,
					message: new AIMessage({ content: text }),
					generationInfo: {
						tokens: data.tokens,
						cost_usd: data.cost_usd,
					},
				},
			],
			llmOutput: {
				tokenUsage: data.tokens
					? {
							promptTokens: data.tokens.input,
							completionTokens: data.tokens.output,
							totalTokens: data.tokens.input + data.tokens.output,
						}
					: undefined,
			},
		};
	}

	private _messagesToPrompt(messages: BaseMessage[]): string {
		return messages
			.map((msg) => {
				const role = msg._getType();
				const content =
					typeof msg.content === 'string'
						? msg.content
						: JSON.stringify(msg.content);

				switch (role) {
					case 'system':
						return `[System]: ${content}`;
					case 'human':
						return `[Human]: ${content}`;
					case 'ai':
						return `[Assistant]: ${content}`;
					default:
						return content;
				}
			})
			.join('\n\n');
	}
}
