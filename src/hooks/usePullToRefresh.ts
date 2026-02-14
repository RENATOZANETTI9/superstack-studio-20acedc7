import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
}

export const usePullToRefresh = ({ onRefresh, threshold = 80, enabled = true }: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullIndicator, setPullIndicator] = useState(0);
  const pullStartY = useRef(0);
  const pullDistance = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh();
    toast.success('Dados atualizados!');
    setIsRefreshing(false);
    setPullIndicator(0);
  }, [onRefresh]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, [enabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || pullStartY.current === 0 || isRefreshing) return;
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop > 0) return;
    const currentY = e.touches[0].clientY;
    pullDistance.current = Math.max(0, currentY - pullStartY.current);
    setPullIndicator(Math.min(pullDistance.current / threshold, 1));
  }, [enabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;
    if (pullDistance.current > threshold && !isRefreshing) {
      handleRefresh();
    } else {
      setPullIndicator(0);
    }
    pullStartY.current = 0;
    pullDistance.current = 0;
  }, [enabled, isRefreshing, threshold, handleRefresh]);

  return {
    containerRef,
    isRefreshing,
    pullIndicator,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};
