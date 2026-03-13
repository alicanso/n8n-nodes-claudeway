import type { INodeProperties } from 'n8n-workflow';

export const sessionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['session'],
			},
		},
		options: [
			{
				name: 'Start Session',
				value: 'start',
				description: 'Create a new persistent multi-turn session',
				action: 'Start a session',
			},
			{
				name: 'Continue Session',
				value: 'continue',
				description: 'Send a message to an existing session',
				action: 'Continue a session',
			},
			{
				name: 'Get Info',
				value: 'getInfo',
				description: 'Get session metadata, token counts, and cost',
				action: 'Get session info',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a session and clean up its working directory',
				action: 'Delete a session',
			},
			{
				name: 'Approve Permissions',
				value: 'approve',
				description: 'Approve previously denied tool permissions',
				action: 'Approve permissions',
			},
		],
		default: 'start',
	},
];

export const sessionFields: INodeProperties[] = [
	// --- Start Session fields ---
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getModels',
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['session'],
				operation: ['start'],
			},
		},
		description: 'The Claude model to use. Leave empty for the server default.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['session'],
				operation: ['start'],
			},
		},
		options: [
			{
				displayName: 'System Prompt',
				name: 'systemPrompt',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'System prompt to set Claude\'s behavior',
			},
			{
				displayName: 'Working Directory',
				name: 'workdir',
				type: 'string',
				default: '',
				description: 'Working directory for the session',
			},
		],
	},

	// --- Session ID (shared by continue, getInfo, delete, approve) ---
	{
		displayName: 'Session ID',
		name: 'sessionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['session'],
				operation: ['continue', 'getInfo', 'delete', 'approve'],
			},
		},
		description: 'The UUID of the session',
	},

	// --- Continue Session fields ---
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['session'],
				operation: ['continue'],
			},
		},
		description: 'The message to send to Claude in this session',
	},
	{
		displayName: 'Timeout (Seconds)',
		name: 'timeoutSecs',
		type: 'number',
		default: 600,
		displayOptions: {
			show: {
				resource: ['session'],
				operation: ['continue'],
			},
		},
		description: 'Maximum time to wait for Claude\'s response',
	},

	// --- Approve Permissions fields ---
	{
		displayName: 'Tool Use IDs',
		name: 'toolUseIds',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['session'],
				operation: ['approve'],
			},
		},
		description: 'Comma-separated list of tool_use_id values from permission denials to approve',
	},
];
