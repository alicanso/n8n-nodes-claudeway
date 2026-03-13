import type { INodeProperties } from 'n8n-workflow';

export const repoOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['repo'],
			},
		},
		options: [
			{
				name: 'Sync',
				value: 'sync',
				description: 'Clone or pull a git repository on the Claudeway server',
				action: 'Sync a repo',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all synced repositories',
				action: 'List repos',
			},
		],
		default: 'sync',
	},
];

export const repoFields: INodeProperties[] = [
	// --- Sync: Repository URL ---
	{
		displayName: 'Repository URL',
		name: 'repoUrl',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://github.com/user/repo.git',
		displayOptions: {
			show: {
				resource: ['repo'],
				operation: ['sync'],
			},
		},
		description: 'Git repository URL to clone or pull',
	},

	// --- Sync: Branch (optional) ---
	{
		displayName: 'Branch',
		name: 'branch',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['repo'],
				operation: ['sync'],
			},
		},
		description: 'Branch to checkout. Leave empty for the repository default branch.',
	},
];
