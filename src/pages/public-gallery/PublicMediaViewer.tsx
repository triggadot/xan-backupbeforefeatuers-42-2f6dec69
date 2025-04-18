import React, { useCallback, useEffect, useRef, useState } from "react";
import { PublicMediaDetailSheet } from "./PublicMediaDetailSheet";
import { Message } from "./types";

export interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroup: Message[];
  initialIndex?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onShare?: () => void;
  onShowOriginal?: () => void;
  className?: string;
}

export function PublicMediaViewer({
  isOpen,
  onClose,
  currentGroup,
  initialIndex = 0,
  onPrevious,
  onNext,
  onShare,
  onShowOriginal,
}: MediaViewerProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMessage =
    currentGroup && currentGroup.length > 0 ? currentGroup[currentIndex] : null;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, currentGroup]);

  // Touch swipe navigation
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    },
    []
  );
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance && onNext) onNext();
    else if (distance < -minSwipeDistance && onPrevious) onPrevious();
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, onNext, onPrevious]);

  // Attach global touch event listeners when the viewer is open
  useEffect(() => {
    const containerElement = containerRef.current;
    if (isOpen && containerElement) {
      containerElement.addEventListener(
        "touchstart",
        handleTouchStart as unknown as EventListener
      );
      containerElement.addEventListener(
        "touchmove",
        handleTouchMove as unknown as EventListener
      );
      containerElement.addEventListener(
        "touchend",
        handleTouchEnd as unknown as EventListener
      );
      return () => {
        containerElement.removeEventListener(
          "touchstart",
          handleTouchStart as unknown as EventListener
        );
        containerElement.removeEventListener(
          "touchmove",
          handleTouchMove as unknown as EventListener
        );
        containerElement.removeEventListener(
          "touchend",
          handleTouchEnd as unknown as EventListener
        );
      };
    }
  }, [isOpen, handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!isOpen || !currentGroup || currentGroup.length === 0 || !currentMessage)
    return null;

  return (
    <div
      ref={containerRef}
      className="touch-action-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {currentMessage && (
        <PublicMediaDetailSheet
          message={currentMessage}
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
          onShowOriginal={onShowOriginal}
          onShare={onShare}
        >
          <div /> {/* Empty element as trigger, controlled by isOpen prop */}
        </PublicMediaDetailSheet>
      )}
    </div>
  );
}
