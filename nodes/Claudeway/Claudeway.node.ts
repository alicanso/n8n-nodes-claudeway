import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { claudewayApiRequest, claudewayApiRequestSSE } from './GenericFunctions';
import { taskOperations, taskFields } from './descriptions/TaskDescription';
import { sessionOperations, sessionFields } from './descriptions/SessionDescription';
import { adminOperations, adminFields } from './descriptions/AdminDescription';

export class Claudeway implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Claudeway',
		name: 'claudeway',
		icon: 'file:claudeway.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Claudeway - Claude CLI HTTP Gateway',
		defaults: {
			name: 'Claudeway',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'claudewayApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Task',
						value: 'task',
					},
					{
						name: 'Session',
						value: 'session',
					},
					{
						name: 'Admin',
						value: 'admin',
					},
				],
				default: 'task',
			},
			...taskOperations,
			...taskFields,
			...sessionOperations,
			...sessionFields,
			...adminOperations,
			...adminFields,
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const response = await claudewayApiRequest.call(this, 'GET', '/models');
					const models = (response.models as Array<{ id: string; name: string }>) || [];
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (resource === 'task') {
					responseData = await executeTask.call(this, operation, i);
				} else if (resource === 'session') {
					responseData = await executeSession.call(this, operation, i);
				} else if (resource === 'admin') {
					responseData = await executeAdmin.call(this, operation, i);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, { itemIndex: i });
				}

				returnData.push({ json: responseData });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

async function executeTask(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
	const prompt = this.getNodeParameter('prompt', itemIndex) as string;
	const model = this.getNodeParameter('model', itemIndex, '') as string;
	const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as {
		systemPrompt?: string;
		workdir?: string;
		timeoutSecs?: number;
	};

	const body: IDataObject = { prompt };
	if (model) body.model = model;
	if (additionalFields.systemPrompt) body.system_prompt = additionalFields.systemPrompt;
	if (additionalFields.workdir) body.workdir = additionalFields.workdir;

	const timeoutSecs = additionalFields.timeoutSecs || 120;

	if (operation === 'run') {
		return claudewayApiRequest.call(this, 'POST', '/task', body, undefined, (timeoutSecs + 10) * 1000);
	}

	if (operation === 'runStream') {
		const includeStreamingText = this.getNodeParameter('includeStreamingText', itemIndex, false) as boolean;
		const sseResult = await claudewayApiRequestSSE.call(this, body, (timeoutSecs + 10) * 1000);

		const result = { ...sseResult.response };
		if (includeStreamingText) {
			result.streamed_text = sseResult.streamedText;
		}
		return result;
	}

	throw new NodeOperationError(this.getNode(), `Unknown task operation: ${operation}`, { itemIndex });
}

async function executeSession(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
	if (operation === 'start') {
		const model = this.getNodeParameter('model', itemIndex, '') as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as {
			systemPrompt?: string;
			workdir?: string;
		};

		const body: IDataObject = {};
		if (model) body.model = model;
		if (additionalFields.systemPrompt) body.system_prompt = additionalFields.systemPrompt;
		if (additionalFields.workdir) body.workdir = additionalFields.workdir;

		return claudewayApiRequest.call(this, 'POST', '/session/start', body);
	}

	const sessionId = this.getNodeParameter('sessionId', itemIndex) as string;

	if (operation === 'continue') {
		const prompt = this.getNodeParameter('prompt', itemIndex) as string;
		const timeoutSecs = this.getNodeParameter('timeoutSecs', itemIndex, 600) as number;

		return claudewayApiRequest.call(
			this,
			'POST',
			`/session/${sessionId}`,
			{ prompt, timeout_secs: timeoutSecs },
			undefined,
			(timeoutSecs + 10) * 1000,
		);
	}

	if (operation === 'getInfo') {
		return claudewayApiRequest.call(this, 'GET', `/session/${sessionId}`);
	}

	if (operation === 'delete') {
		return claudewayApiRequest.call(this, 'DELETE', `/session/${sessionId}`);
	}

	if (operation === 'approve') {
		const toolUseIdsStr = this.getNodeParameter('toolUseIds', itemIndex) as string;
		const toolUseIds = toolUseIdsStr.split(',').map((id) => id.trim()).filter(Boolean);

		return claudewayApiRequest.call(
			this,
			'POST',
			`/session/${sessionId}/approve`,
			{ tool_use_ids: toolUseIds },
			undefined,
			610 * 1000, // 600s default + 10s buffer
		);
	}

	throw new NodeOperationError(this.getNode(), `Unknown session operation: ${operation}`, { itemIndex });
}

async function executeAdmin(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
	if (operation === 'health') {
		// Health endpoint is public (no auth required), but we send auth anyway
		return claudewayApiRequest.call(this, 'GET', '/health');
	}

	if (operation === 'listModels') {
		return claudewayApiRequest.call(this, 'GET', '/models');
	}

	throw new NodeOperationError(this.getNode(), `Unknown admin operation: ${operation}`, { itemIndex });
}
