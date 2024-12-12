// src/lib/services/errorService.ts
export class ErrorService {
    static categorizeError(error: unknown): {
        type: string;
        message: string;
        recoverable: boolean;
    } {
        if (error instanceof Error) {
            if (error.name === 'NetworkError') {
                return {
                    type: 'Network',
                    message: 'Connection failed. Check your internet.',
                    recoverable: true
                };
            }

            if (error.name === 'AuthenticationError') {
                return {
                    type: 'Authentication',
                    message: 'Failed to authenticate. Check credentials.',
                    recoverable: false
                };
            }
        }

        return {
            type: 'Unknown',
            message: 'An unexpected error occurred.',
            recoverable: false
        };
    }

    static logError(error: unknown) {
        // Could integrate with logging service
        console.error('Detailed Error:', error);
    }
}
