import { useState, useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  jsHeapSize: number;
  totalJSHeapSize: number;
  messageCount: number;
  conversationCount: number;
}

interface PerformanceMonitorProps {
  messageCount: number;
  conversationCount: number;
  isVisible?: boolean;
}

function PerformanceMonitor({ 
  messageCount, 
  conversationCount, 
  isVisible = false 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    jsHeapSize: 0,
    totalJSHeapSize: 0,
    messageCount,
    conversationCount
  });
  
  const [showDetails, setShowDetails] = useState(false);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    const updateMetrics = () => {
      const now = performance.now();
      const renderTime = now - lastRenderTime.current;
      lastRenderTime.current = now;

      // Get memory info if available
      const memory = (performance as any).memory;
      const memoryMetrics = memory ? {
        jsHeapSize: memory.usedJSHeapSize / 1024 / 1024, // MB
        totalJSHeapSize: memory.totalJSHeapSize / 1024 / 1024, // MB
        memoryUsage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      } : {
        jsHeapSize: 0,
        totalJSHeapSize: 0,
        memoryUsage: 0
      };

      setMetrics({
        ...memoryMetrics,
        renderTime,
        messageCount,
        conversationCount
      });
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial call

    return () => clearInterval(interval);
  }, [messageCount, conversationCount]);

  if (!isVisible) return null;

  return (
    <div className="performance-monitor">
      <button 
        className="performance-toggle"
        onClick={() => setShowDetails(!showDetails)}
        title="Performance Monitor"
      >
        <Activity size={16} />
        <span className="memory-usage">
          {metrics.memoryUsage.toFixed(0)}%
        </span>
      </button>
      
      {showDetails && (
        <div className="performance-details">
          <h4>Performance Metrics</h4>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Memory Usage</span>
              <span className="metric-value">{metrics.memoryUsage.toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">JS Heap Size</span>
              <span className="metric-value">{metrics.jsHeapSize.toFixed(1)} MB</span>
            </div>
            <div className="metric">
              <span className="metric-label">Total Heap</span>
              <span className="metric-value">{metrics.totalJSHeapSize.toFixed(1)} MB</span>
            </div>
            <div className="metric">
              <span className="metric-label">Render Time</span>
              <span className="metric-value">{metrics.renderTime.toFixed(1)} ms</span>
            </div>
            <div className="metric">
              <span className="metric-label">Messages</span>
              <span className="metric-value">{metrics.messageCount.toLocaleString()}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Conversations</span>
              <span className="metric-value">{metrics.conversationCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceMonitor;