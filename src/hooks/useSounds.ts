import { useEffect } from 'react';
import soundManager from '../utils/sounds';

export function useSounds() {
  // Initialize sound on mount
  useEffect(() => {
    // Preload sound context (needs user gesture)
    const initSound = () => {
      soundManager.click(); // Initialize AudioContext
      document.removeEventListener('click', initSound);
      document.removeEventListener('keydown', initSound);
    };

    document.addEventListener('click', initSound);
    document.addEventListener('keydown', initSound);

    return () => {
      document.removeEventListener('click', initSound);
      document.removeEventListener('keydown', initSound);
    };
  }, []);

  return soundManager;
}

// Wrapper hooks for specific actions
export function useClickSound() {
  return () => soundManager.click();
}

export function useHoverSound() {
  return () => soundManager.hover();
}

export function useSuccessSound() {
  return () => soundManager.success();
}

export function useErrorSound() {
  return () => soundManager.error();
}

export function useNotificationSound() {
  return () => soundManager.notification();
}

export function useMessageSentSound() {
  return () => soundManager.messageSent();
}

export function useMessageReceivedSound() {
  return () => soundManager.messageReceived();
}

export function useNavigateSound() {
  return () => soundManager.navigate();
}

export function useSelectSound() {
  return () => soundManager.select();
}

export function useWarningSound() {
  return () => soundManager.warning();
}
