import { toast } from "sonner";

// Global error handler for API responses
export const handleApiError = (error: string, context: string = 'Operation') => {
  console.error(`${context} error:`, error);
  
  // Check for specific error types and provide better messages
  if (error.toLowerCase().includes('network')) {
    toast.error(`${context} Failed`, {
      description: 'Please check your internet connection and try again.',
      duration: 5000
    });
  } else if (error.toLowerCase().includes('token')) {
    toast.error(`${context} Failed`, {
      description: 'Your session has expired. The page will refresh automatically.',
      duration: 3000
    });
    // Auto refresh is handled by the API helper
  } else if (error.toLowerCase().includes('permission') || error.toLowerCase().includes('unauthorized')) {
    toast.error(`${context} Failed`, {
      description: 'You don\'t have permission to perform this action.',
      duration: 5000
    });
  } else if (error.toLowerCase().includes('not found')) {
    toast.error(`${context} Failed`, {
      description: 'The requested resource was not found.',
      duration: 5000
    });
  } else {
    toast.error(`${context} Failed`, {
      description: error || 'An unexpected error occurred.',
      duration: 5000
    });
  }
};

// Loading state manager for consistent loading UX
export class LoadingManager {
  private static loadingStates = new Map<string, boolean>();
  private static callbacks = new Map<string, Set<(loading: boolean) => void>>();

  static setLoading(key: string, loading: boolean) {
    this.loadingStates.set(key, loading);
    const callbacks = this.callbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(loading));
    }
  }

  static isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  static subscribe(key: string, callback: (loading: boolean) => void) {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set());
    }
    this.callbacks.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.callbacks.delete(key);
        }
      }
    };
  }
}

// Utility for retrying failed requests
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context: string = 'Operation'
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      console.warn(`${context} attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      
      // Show toast only on final attempt or if it's a network error
      if (attempt === maxRetries - 1 && lastError.message.toLowerCase().includes('network')) {
        toast.warning(`${context} Retry`, {
          description: `Attempt ${attempt} failed, trying ${maxRetries - attempt} more time(s)...`,
          duration: 2000
        });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    }
  }

  throw lastError!;
};