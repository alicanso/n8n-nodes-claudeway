import type {
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	ILoadOptionsFunctions,
	SupplyData,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { ChatClaudeway } from './ChatClaudeway';

export class LmChatClaudeway implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Claudeway Chat Model',
		name: 'lmChatClaudeway',
		icon: 'file:claudeway.svg',
		group: ['transform'],
		version: 1,
		description: 'Chat Model via Claudeway Gateway (Claude CLI)',
		defaults: {
			name: 'Claudeway Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/alicansoysal/claudeway',
					},
				],
			},
			alias: ['claude', 'claudeway', 'claude-cli'],
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'claudewayApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
				default: '',
				description:
					'The Claude model to use. Leave empty for the server default.',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'System Prompt',
						name: 'systemPrompt',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '',
						description: "System prompt to set Claude's behavior",
					},
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeoutSecs',
						type: 'number',
						default: 120,
						description:
							"Maximum time to wait for Claude's response",
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				try {
					const credentials =
						await this.getCredentials('claudewayApi');
					const baseUrl = (credentials.baseUrl as string).replace(
						/\/$/,
						'',
					);

					const options: IHttpRequestOptions = {
						method: 'GET',
						url: `${baseUrl}/models`,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						json: true,
					};

					const response = (await this.helpers.httpRequest(
						options,
					)) as JsonObject;
					const models =
						(response.models as Array<{
							id: string;
							name: string;
						}>) || [];
					return models.map((model) => ({
						name: model.name,
						value: model.id,
					}));
				} catch {
					return [
						{
							name: 'Default (server decides)',
							value: '',
						},
					];
				}
			},
		},
	};

	async supplyData(
		this: ISupplyDataFunctions,
		itemIndex: number,
	): Promise<SupplyData> {
		const credentials = await this.getCredentials('claudewayApi');
		const modelName = this.getNodeParameter('model', itemIndex, '') as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			systemPrompt?: string;
			timeoutSecs?: number;
		};

		const baseUrl = credentials.baseUrl as string;
		const apiKey = credentials.apiKey as string;

		if (!apiKey) {
			throw new NodeOperationError(
				this.getNode(),
				'API key is required. Please configure your Claudeway credentials.',
				{ itemIndex },
			);
		}

		const model = new ChatClaudeway({
			baseUrl,
			apiKey,
			model: modelName || undefined,
			systemPrompt: options.systemPrompt || undefined,
			timeoutSecs: options.timeoutSecs ?? 120,
		});

		return {
			response: model,
		};
	}
}
