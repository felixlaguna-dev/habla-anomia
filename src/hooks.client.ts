// Client-side error handler
import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = async ({ error, status }) => {
	console.error('Client error:', status, error);
	return {
		message: error instanceof Error ? error.message : 'Unknown error'
	};
};
