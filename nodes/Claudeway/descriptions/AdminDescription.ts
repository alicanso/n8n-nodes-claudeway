import type { INodeProperties } from 'n8n-workflow';

export const adminOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['admin'],
			},
		},
		options: [
			{
				name: 'Health Check',
				value: 'health',
				description: 'Check server status, version, and uptime',
				action: 'Health check',
			},
			{
				name: 'List Models',
				value: 'listModels',
				description: 'List available Claude models',
				action: 'List models',
			},
		],
		default: 'health',
	},
];

export const adminFields: INodeProperties[] = [];
