/**
 * Animation Performance Testing Utilities
 * Tools to measure and optimize animation performance
 */

interface PerformanceMetrics {
  fps: number;
  frameDrops: number;
  averageFrameTime: number;
  jankFrames: number;
  totalFrames: number;
}

interface AnimationTestResult {
  animationName: string;
  duration: number;
  metrics: PerformanceMetrics;
  passed: boolean;
  issues: string[];
}

/**
 * Performance thresholds for animations
 */
const PERFORMANCE_THRESHOLDS = {
  MIN_FPS: 55, // Target 60fps, allow some variance
  MAX_FRAME_TIME: 16.67, // 60fps = 16.67ms per frame
  MAX_JANK_PERCENTAGE: 5, // Max 5% of frames can be janky
  MAX_FRAME_DROPS: 3, // Max 3 consecutive dropped frames
} as const;

/**
 * Animation Performance Monitor
 * Measures FPS and frame timing during animations
 */
export class AnimationPerformanceMonitor {
  private frameCount = 0;
  private startTime = 0;
  private lastFrameTime = 0;
  private frameTimes: number[] = [];
  private jankFrames = 0;
  private frameDrops = 0;
  private consecutiveDrops = 0;
  private isMonitoring = false;
  private animationId: number | null = null;

  /**
   * Start monitoring animation performance
   */
  start(): void {
    if (this.isMonitoring) {
      this.stop();
    }

    this.reset();
    this.isMonitoring = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    
    this.measureFrame();
  }

  /**
   * Stop monitoring and return results
   */
  stop(): PerformanceMetrics {
    this.isMonitoring = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    return this.calculateMetrics();
  }

  /**
   * Reset all counters
   */
  private reset(): void {
    this.frameCount = 0;
    this.startTime = 0;
    this.lastFrameTime = 0;
    this.frameTimes = [];
    this.jankFrames = 0;
    this.frameDrops = 0;
    this.consecutiveDrops = 0;
  }

  /**
   * Measure frame performance
   */
  private measureFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    
    this.frameCount++;
    this.frameTimes.push(frameTime);

    // Check for jank (frames taking longer than 16.67ms)
    if (frameTime > PERFORMANCE_THRESHOLDS.MAX_FRAME_TIME) {
      this.jankFrames++;
      this.consecutiveDrops++;
      
      if (this.consecutiveDrops > PERFORMANCE_THRESHOLDS.MAX_FRAME_DROPS) {
        this.frameDrops++;
      }
    } else {
      this.consecutiveDrops = 0;
    }

    this.lastFrameTime = currentTime;
    this.animationId = requestAnimationFrame(this.measureFrame);
  };

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(): PerformanceMetrics {
    const totalTime = this.lastFrameTime - this.startTime;
    const fps = this.frameCount / (totalTime / 1000);
    const averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    return {
      fps: Math.round(fps * 100) / 100,
      frameDrops: this.frameDrops,
      averageFrameTime: Math.round(averageFrameTime * 100) / 100,
      jankFrames: this.jankFrames,
      totalFrames: this.frameCount,
    };
  }
}

/**
 * Test animation performance for a specific element
 */
export async function testAnimationPerformance(
  _element: HTMLElement,
  animationName: string,
  duration: number = 1000
): Promise<AnimationTestResult> {
  const monitor = new AnimationPerformanceMonitor();
  const issues: string[] = [];

  // Start monitoring
  monitor.start();

  // Wait for animation to complete
  await new Promise(resolve => setTimeout(resolve, duration));

  // Stop monitoring and get metrics
  const metrics = monitor.stop();

  // Analyze results
  let passed = true;

  if (metrics.fps < PERFORMANCE_THRESHOLDS.MIN_FPS) {
    passed = false;
    issues.push(`Low FPS: ${metrics.fps} (target: ${PERFORMANCE_THRESHOLDS.MIN_FPS}+)`);
  }

  if (metrics.averageFrameTime > PERFORMANCE_THRESHOLDS.MAX_FRAME_TIME) {
    passed = false;
    issues.push(`High frame time: ${metrics.averageFrameTime}ms (target: <${PERFORMANCE_THRESHOLDS.MAX_FRAME_TIME}ms)`);
  }

  const jankPercentage = (metrics.jankFrames / metrics.totalFrames) * 100;
  if (jankPercentage > PERFORMANCE_THRESHOLDS.MAX_JANK_PERCENTAGE) {
    passed = false;
    issues.push(`High jank: ${jankPercentage.toFixed(1)}% (target: <${PERFORMANCE_THRESHOLDS.MAX_JANK_PERCENTAGE}%)`);
  }

  if (metrics.frameDrops > PERFORMANCE_THRESHOLDS.MAX_FRAME_DROPS) {
    passed = false;
    issues.push(`Frame drops: ${metrics.frameDrops} (target: <${PERFORMANCE_THRESHOLDS.MAX_FRAME_DROPS})`);
  }

  return {
    animationName,
    duration,
    metrics,
    passed,
    issues,
  };
}

/**
 * Test multiple animations and return a performance report
 */
export async function testAnimationSuite(
  animations: Array<{ element: HTMLElement; name: string; duration?: number }>
): Promise<{
  results: AnimationTestResult[];
  overallPassed: boolean;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    averageFps: number;
    totalIssues: number;
  };
}> {
  const results: AnimationTestResult[] = [];

  for (const animation of animations) {
    const result = await testAnimationPerformance(
      animation.element,
      animation.name,
      animation.duration
    );
    results.push(result);
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const averageFps = results.reduce((sum, r) => sum + r.metrics.fps, 0) / results.length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  return {
    results,
    overallPassed: failed === 0,
    summary: {
      totalTests: results.length,
      passed,
      failed,
      averageFps: Math.round(averageFps * 100) / 100,
      totalIssues,
    },
  };
}

/**
 * Check if device supports hardware acceleration
 */
export function checkHardwareAcceleration(): {
  supported: boolean;
  webgl: boolean;
  canvas2d: boolean;
  css3d: boolean;
} {
  // Check WebGL support
  const canvas = document.createElement('canvas');
  const webgl = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));

  // Check Canvas 2D acceleration
  const ctx = canvas.getContext('2d');
  const canvas2d = !!(ctx && 'imageSmoothingEnabled' in ctx);

  // Check CSS 3D transforms
  const testElement = document.createElement('div');
  testElement.style.transform = 'translateZ(0)';
  const css3d = testElement.style.transform === 'translateZ(0)';

  return {
    supported: webgl || canvas2d || css3d,
    webgl,
    canvas2d,
    css3d,
  };
}

/**
 * Optimize element for GPU acceleration
 */
export function optimizeForGPU(element: HTMLElement): void {
  // Force GPU layer creation
  element.style.transform = element.style.transform || 'translateZ(0)';
  element.style.willChange = 'transform';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
}

/**
 * Remove GPU optimization (to prevent memory leaks)
 */
export function removeGPUOptimization(element: HTMLElement): void {
  element.style.willChange = 'auto';
  if (element.style.transform === 'translateZ(0)') {
    element.style.transform = '';
  }
}

/**
 * Detect if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get optimal animation duration based on user preferences
 */
export function getOptimalAnimationDuration(baseDuration: number): number {
  if (prefersReducedMotion()) {
    return Math.min(baseDuration * 0.1, 50); // Very short or instant
  }
  return baseDuration;
}

/**
 * Performance-aware animation utility
 */
export class PerformantAnimation {
  private element: HTMLElement;
  private monitor: AnimationPerformanceMonitor;
  private isRunning = false;

  constructor(element: HTMLElement) {
    this.element = element;
    this.monitor = new AnimationPerformanceMonitor();
  }

  /**
   * Start animation with performance monitoring
   */
  async start(
    animationName: string,
    duration: number,
    onComplete?: () => void
  ): Promise<AnimationTestResult> {
    if (this.isRunning) {
      throw new Error('Animation already running');
    }

    this.isRunning = true;
    optimizeForGPU(this.element);
    
    const adjustedDuration = getOptimalAnimationDuration(duration);
    
    this.monitor.start();
    
    // Apply animation
    this.element.style.animationName = animationName;
    this.element.style.animationDuration = `${adjustedDuration}ms`;
    
    // Wait for completion
    await new Promise(resolve => {
      setTimeout(() => {
        this.element.style.animationName = '';
        this.element.style.animationDuration = '';
        resolve(void 0);
      }, adjustedDuration);
    });

    const metrics = this.monitor.stop();
    removeGPUOptimization(this.element);
    this.isRunning = false;

    if (onComplete) {
      onComplete();
    }

    return {
      animationName,
      duration: adjustedDuration,
      metrics,
      passed: metrics.fps >= PERFORMANCE_THRESHOLDS.MIN_FPS,
      issues: metrics.fps < PERFORMANCE_THRESHOLDS.MIN_FPS 
        ? [`Low FPS: ${metrics.fps}`] 
        : [],
    };
  }
}

/**
 * Log performance results to console
 */
export function logPerformanceResults(results: AnimationTestResult[]): void {
  console.group('🎬 Animation Performance Results');
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.group(`${status} ${result.animationName}`);
    console.log(`FPS: ${result.metrics.fps}`);
    console.log(`Frame Time: ${result.metrics.averageFrameTime}ms`);
    console.log(`Jank Frames: ${result.metrics.jankFrames}/${result.metrics.totalFrames}`);
    
    if (result.issues.length > 0) {
      console.warn('Issues:', result.issues);
    }
    
    console.groupEnd();
  });
  
  console.groupEnd();
}