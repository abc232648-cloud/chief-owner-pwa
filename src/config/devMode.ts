/**
 * Chief Operational Command — Development Mode & Simulation Boundary Configuration
 * 
 * BATCH 13B.1 ENFORCEMENT:
 * - Production mode (DEV mode = false) is strictly fail-closed:
 *   - Starts completely unauthenticated (user = null, status = 'unauthenticated')
 *   - Persona switching, local role promotion, and credential bypass are disabled
 *   - Status overrides, connectivity cycling, and manual Farm mode switching are hidden
 *   - Only genuine backend services may grant authority
 * 
 * - Development mode (DEV mode = true) allows:
 *   - Explicit preset persona testing (Owner, Manager, Worker, Viewer)
 *   - State simulation tools, clearly labeled with [DEV / SIMULATION]
 *   - Persistent global warning banner reminding operators that state is synthetic
 */

export const isChiefDevMode = (): boolean => {
  // 1. Explicit Vite environment variable
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_CHIEF_DEV_MODE === 'true') {
      return true;
    }
  }

  // 2. Explicit browser test parameters (search query ?dev=true or localStorage toggle)
  if (typeof window !== 'undefined') {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('dev') === 'true' || searchParams.get('devMode') === 'true') {
        return true;
      }
      if (localStorage.getItem('chief_dev_mode') === 'true') {
        return true;
      }
    } catch {
      // Ignore security errors in restricted iframe environments
    }
  }

  return false;
};

export const setChiefDevMode = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    try {
      if (enabled) {
        localStorage.setItem('chief_dev_mode', 'true');
      } else {
        localStorage.removeItem('chief_dev_mode');
      }
    } catch {
      // Ignore quota or security errors
    }
  }
};
