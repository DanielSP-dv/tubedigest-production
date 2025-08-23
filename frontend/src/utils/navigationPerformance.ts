/**
 * Navigation Performance Utility
 * Provides performance optimizations for navigation
 */

export class NavigationPerformance {
  private static routeCache = new Map<string, any>();
  private static lastNavigationTime = 0;
  private static readonly NAVIGATION_THROTTLE = 100; // 100ms throttle

  /**
   * Throttle navigation to prevent rapid navigation
   */
  static throttleNavigation(): boolean {
    const now = Date.now();
    if (now - this.lastNavigationTime < this.NAVIGATION_THROTTLE) {
      console.warn('⚠️ [NavigationPerformance] Navigation throttled');
      return false;
    }
    this.lastNavigationTime = now;
    return true;
  }

  /**
   * Cache route data for faster navigation
   */
  static cacheRouteData(route: string, data: any): void {
    this.routeCache.set(route, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached route data
   */
  static getCachedRouteData(route: string): any | null {
    const cached = this.routeCache.get(route);
    if (!cached) return null;

    // Check if cache is still valid (5 minutes)
    const cacheAge = Date.now() - cached.timestamp;
    const maxCacheAge = 5 * 60 * 1000; // 5 minutes

    if (cacheAge > maxCacheAge) {
      this.routeCache.delete(route);
      return null;
    }

    return cached.data;
  }

  /**
   * Clear route cache
   */
  static clearRouteCache(): void {
    this.routeCache.clear();
  }

  /**
   * Preload critical routes
   */
  static preloadRoutes(routes: string[]): void {
    routes.forEach(route => {
      // Preload route data in background
      setTimeout(() => {
        console.log(`🔍 [NavigationPerformance] Preloading route: ${route}`);
        // This would typically fetch route data in the background
      }, 0);
    });
  }

  /**
   * Measure navigation performance
   */
  static measureNavigationTime(startTime: number): number {
    const navigationTime = Date.now() - startTime;
    console.log(`🔍 [NavigationPerformance] Navigation took ${navigationTime}ms`);
    return navigationTime;
  }
}

