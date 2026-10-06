/**
 * Chief Operational Command — Development Mode & Simulation Boundary Configuration
 * 
 * BATCH 13B.1 ENFORCEMENT:
 * - DEV mode is controlled STRICTLY AND ONLY by build/environment configuration:
 *   import.meta.env.VITE_CHIEF_DEV_MODE === 'true'
 * 
 * - NO browser-side activation mechanisms are permitted:
 *   - NO URL query parameters (?dev=true, ?devMode=true)
 *   - NO localStorage overrides (chief_dev_mode)
 *   - NO in-app toggles, switches, or setter functions
 * 
 * - When VITE_CHIEF_DEV_MODE is false or unset:
 *   - Application is strictly in PRODUCTION mode
 *   - Starts unauthenticated with null user
 *   - No personas can be activated
 *   - All simulation controls are hidden and non-functional
 */

export const isChiefDevMode = (): boolean => {
  return (
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env !== 'undefined' &&
    import.meta.env.VITE_CHIEF_DEV_MODE === 'true'
  );
};
