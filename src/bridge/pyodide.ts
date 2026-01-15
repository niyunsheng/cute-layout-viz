/**
 * Pyodide Initialization and Management
 *
 * This module handles:
 * - Loading and initializing Pyodide
 * - Loading Python files from the python/ directory
 * - Caching the Pyodide instance
 */

import type { PyodideInterface } from 'pyodide';

let pyodideInstance: PyodideInterface | null = null;
let initializationPromise: Promise<PyodideInterface> | null = null;

// Performance logging utility
class PerformanceLogger {
  private startTime: number;
  private steps: Array<{ name: string; duration: number }> = [];

  constructor() {
    this.startTime = performance.now();
  }

  checkpoint(stepName: string, lastTime: number = this.startTime): number {
    const now = performance.now();
    const duration = now - lastTime;
    this.steps.push({ name: stepName, duration });
    return now;
  }

  summary() {
    const totalTime = performance.now() - this.startTime;

    // Find the most time-consuming steps
    const majorSteps = this.steps.filter(s => s.duration > 50);

    console.log(`\n🚀 Pyodide initialized in ${totalTime.toFixed(0)}ms`);

    if (majorSteps.length > 0) {
      console.log('   Key steps:');
      majorSteps.forEach(step => {
        console.log(`   • ${step.name}: ${step.duration.toFixed(0)}ms`);
      });
    }
    console.log('');
  }
}

/**
 * Initialize Pyodide and load Python modules
 * Uses singleton pattern to ensure only one instance
 */
export async function initPyodide(): Promise<PyodideInterface> {
  // Return existing instance if already initialized
  if (pyodideInstance) {
    return pyodideInstance;
  }

  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Create performance logger
  const perfLogger = new PerformanceLogger();

  initializationPromise = (async () => {
    let t1 = performance.now();
    const { loadPyodide } = await import('pyodide');
    t1 = perfLogger.checkpoint('Import pyodide module', t1);

    // Load Pyodide
    const pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.1/full/',
      fullStdLib: false,
    });
    t1 = perfLogger.checkpoint('Load & initialize runtime', t1);

    // Get base URL for the app (handles both dev and production)
    const baseUrl = import.meta.env.BASE_URL || '/';

    // Fetch Python files
    const pythonFiles = [
      'utils.py',
      'layout.py',
      'composition.py',
      'layout_string_parser.py',
    ];

    // Create a virtual Python package in Pyodide's filesystem
    try {
      pyodide.FS.mkdir('/cute_layout');
    } catch {
      // Directory might already exist, ignore error
    }

    pyodide.FS.writeFile('/cute_layout/__init__.py', '');

    // Load files into the virtual package
    for (const fileName of pythonFiles) {
      try {
        const fileUrl = `${baseUrl}python/${fileName}`;
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to load ${fileName}: ${response.statusText}`);
        }

        let code = await response.text();

        // Replace relative imports with absolute imports
        code = code.replace(/from \.([a-z_]+) import/g, 'from cute_layout.$1 import');
        code = code.replace(/from \. import/g, 'from cute_layout import');

        // Write to virtual filesystem
        pyodide.FS.writeFile(`/cute_layout/${fileName}`, code);
      } catch (error) {
        console.error(`[Pyodide] Error loading ${fileName}:`, error);
        throw error;
      }
    }

    t1 = perfLogger.checkpoint('Load Python files', t1);

    // Set up Python path
    pyodide.runPython(`
import sys
sys.path.insert(0, '/')
    `);

    // Verify module can be imported
    try {
      pyodide.runPython('from cute_layout import layout_string_parser');
    } catch (error) {
      console.error('[Pyodide] Failed to import cute_layout:', error);
      throw error;
    }

    // Output performance summary
    perfLogger.summary();

    pyodideInstance = pyodide;
    return pyodide;
  })();

  return initializationPromise;
}

/**
 * Get the current Pyodide instance
 * Throws if not initialized
 */
export function getPyodide(): PyodideInterface {
  if (!pyodideInstance) {
    throw new Error('Pyodide not initialized. Call initPyodide() first.');
  }
  return pyodideInstance;
}

/**
 * Check if Pyodide is initialized
 */
export function isPyodideReady(): boolean {
  return pyodideInstance !== null;
}
