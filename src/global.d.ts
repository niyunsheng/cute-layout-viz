/**
 * Global TypeScript type definitions
 */

declare global {
  interface Window {
    /**
     * Flag to ensure Pyodide is only initialized once
     */
    __PYODIDE_INIT_STARTED__?: boolean;
  }
}

export {};
