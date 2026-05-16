import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = async ({ error, event }) => {
	console.error('=== SVELTEKIT ERROR ===');
	console.error('URL:', event.url.pathname);
	console.error('Error:', error);
	console.error('Stack:', error instanceof Error ? error.stack : 'no stack');
	return {
		message: error instanceof Error ? error.message : 'Unknown error'
	};
};
