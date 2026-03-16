import type { INodeProperties } from 'n8n-workflow';

export const taskOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['task'],
			},
		},
		options: [
			{
				name: 'Run Task',
				value: 'run',
				description: 'Execute a one-shot Claude prompt',
				action: 'Run a task',
			},
			{
				name: 'Run Task (Streaming)',
				value: 'runStream',
				description: 'Execute a Claude prompt with SSE streaming',
				action: 'Run a task with streaming',
			},
		],
		default: 'run',
	},
];

export const taskFields: INodeProperties[] = [
	// --- Prompt (shared by both operations) ---
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
				resource: ['task'],
				operation: ['run', 'runStream'],
			},
		},
		description: 'The prompt to send to Claude',
	},

	// --- Model (shared) ---
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
				resource: ['task'],
				operation: ['run', 'runStream'],
			},
		},
		description: 'The Claude model to use. Leave empty for the server default.',
	},

	// --- Working Directory Source ---
	{
		displayName: 'Working Directory',
		name: 'workdirSource',
		type: 'options',
		default: 'none',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['run', 'runStream'],
			},
		},
		options: [
			{
				name: 'Default (Server Decides)',
				value: 'none',
			},
			{
				name: 'Git Repository',
				value: 'gitRepo',
			},
			{
				name: 'Custom Path',
				value: 'customPath',
			},
		],
		description: 'Where Claude should run: a git repo (auto clone/pull), a custom path, or the server default',
	},
	{
		displayName: 'Repository URL',
		name: 'repoUrl',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://github.com/user/repo.git',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['run', 'runStream'],
				workdirSource: ['gitRepo'],
			},
		},
		description: 'Git repository URL. Will be cloned if not present, or pulled if already synced.',
	},
	{
		displayName: 'Branch',
		name: 'repoBranch',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['run', 'runStream'],
				workdirSource: ['gitRepo'],
			},
		},
		description: 'Branch to checkout. Leave empty for the repository default branch.',
	},
	{
		displayName: 'Path',
		name: 'workdir',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['run', 'runStream'],
				workdirSource: ['customPath'],
			},
		},
		description: 'Absolute path on the Claudeway server where Claude should run',
	},

	// --- Additional Fields ---
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['run', 'runStream'],
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
				displayName: 'Timeout (Seconds)',
				name: 'timeoutSecs',
				type: 'number',
				default: 120,
				description: 'Maximum time to wait for Claude\'s response',
			},
		],
	},

	// --- Include Streaming Text (streaming only) ---
	{
		displayName: 'Include Streaming Text',
		name: 'includeStreamingText',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['task'],
				operation: ['runStream'],
			},
		},
		description: 'Whether to include the concatenated partial text chunks in the output',
	},
];
