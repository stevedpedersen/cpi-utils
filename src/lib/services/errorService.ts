// src/lib/services/errorService.ts
export interface ErrorDetails {
    type: 'Network' | 'Authentication' | 'Unknown';
    message: string;
    recoverable: boolean;
    originalError?: unknown;
}

export class ErrorService {
    static categorizeError(error: unknown): ErrorDetails {
        if (error instanceof Error) {
            switch (error.name) {
                case 'NetworkError':
                    return {
                        type: 'Network',
                        message: 'Connection failed. Check your internet.',
                        recoverable: true,
                        originalError: error
                    };

                case 'AuthenticationError':
                    return {
                        type: 'Authentication',
                        message: 'Failed to authenticate. Check credentials.',
                        recoverable: false,
                        originalError: error
                    };

                default:
                    return {
                        type: 'Unknown',
                        message: error.message || 'An unexpected error occurred.',
                        recoverable: false,
                        originalError: error
                    };
            }
        }

        if (typeof error === 'string') {
            return {
                type: 'Unknown',
                message: error,
                recoverable: false
            };
        }

        return {
            type: 'Unknown',
            message: 'An unrecognized error occurred.',
            recoverable: false,
            originalError: error
        };
    }

    static logError(error: unknown): void {
        const errorDetails = this.categorizeError(error);

        // Centralized error logging mechanism
        console.error('Error Logging:', {
            type: errorDetails.type,
            message: errorDetails.message,
            recoverable: errorDetails.recoverable,
            timestamp: new Date().toISOString()
        });

        // Optional: Could integrate with external logging service
        // this.sendToLoggingService(errorDetails);
    }

    // Optional method for potential future logging service integration
    private static sendToLoggingService?(errorDetails: ErrorDetails): void {
    // Placeholder for potential external logging service
    // Could send error to services like Sentry, LogRocket, etc.
    }
}
