import { useEffect, useRef } from 'react'

let initialLoadCompleted = false

export function usePageLoadTime(pageName: string) {
  const hasLogged = useRef(false)
  const mountTime = useRef(performance.now())

  useEffect(() => {
    if (hasLogged.current) return
    hasLogged.current = true

    const componentRenderTime = performance.now() - mountTime.current

    if (window.performance && window.performance.getEntriesByType) {
      const navigationEntry = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigationEntry) {
        const isInitialLoad = !initialLoadCompleted && navigationEntry.loadEventEnd > 0

        if (isInitialLoad) {
          initialLoadCompleted = true

          const domReady = navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart
          const pageLoadComplete = navigationEntry.loadEventEnd - navigationEntry.fetchStart
          const totalTimeToReact = performance.now()

          console.log(`%c[${pageName}] === Initial Page Load ===`, 'color: #2196F3; font-weight: bold')
          console.log(`[${pageName}] DNS + TCP + Request: ${(navigationEntry.responseEnd - navigationEntry.fetchStart).toFixed(2)}ms`)
          console.log(`[${pageName}] DOM Ready: ${domReady.toFixed(2)}ms`)
          console.log(`[${pageName}] Page Load Complete: ${pageLoadComplete.toFixed(2)}ms`)
          console.log(`[${pageName}] React Component Render: ${componentRenderTime.toFixed(2)}ms`)
          console.log(`[${pageName}] Total Time (to React ready): ${totalTimeToReact.toFixed(2)}ms`)

          const metrics: Record<string, string> = {
            'DNS Lookup': `${(navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart).toFixed(2)}ms`,
            'TCP Connection': `${(navigationEntry.connectEnd - navigationEntry.connectStart).toFixed(2)}ms`,
            'Request Time': `${(navigationEntry.responseStart - navigationEntry.requestStart).toFixed(2)}ms`,
            'Response Time': `${(navigationEntry.responseEnd - navigationEntry.responseStart).toFixed(2)}ms`,
            'DOM Processing': `${(navigationEntry.domComplete - navigationEntry.domInteractive).toFixed(2)}ms`,
          }

          console.log(`[${pageName}] Performance Details:`, metrics)
        } else {
          console.log(`%c[${pageName}] Route Navigation`, 'color: #4CAF50; font-weight: bold')
          console.log(`[${pageName}] Component Render: ${componentRenderTime.toFixed(2)}ms`)
        }
      }
    }
  }, [pageName])
}
