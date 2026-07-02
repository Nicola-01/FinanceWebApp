export interface ToastData {
  message: string;
  success: boolean;
}

let toastEvent: ((data: ToastData) => void) | null = null;

export const triggerToast = (message: string, success: boolean) => {
  toastEvent?.({ message, success });
};

/**
 * Registers the toast host handler. Returns an unsubscribe function that only
 * clears the handler if it is still the one registered (avoids clobbering a
 * newer host during fast-refresh / remount).
 */
export const registerToastHandler = (handler: (data: ToastData) => void) => {
  toastEvent = handler;
  return () => {
    if (toastEvent === handler) toastEvent = null;
  };
};
