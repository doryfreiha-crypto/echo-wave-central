import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

// Component wrapper for scroll animations
interface ScrollAnimateProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'blur';
}

export function ScrollAnimate({ 
  children, 
  className = '', 
  delay = 0,
  animation = 'fade-up'
}: ScrollAnimateProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  const baseStyles = 'transition-all duration-700 ease-out';
  
  const animationStyles = {
    'fade-up': {
      hidden: 'opacity-0 translate-y-8',
      visible: 'opacity-100 translate-y-0',
    },
    'fade-down': {
      hidden: 'opacity-0 -translate-y-8',
      visible: 'opacity-100 translate-y-0',
    },
    'fade-left': {
      hidden: 'opacity-0 translate-x-8',
      visible: 'opacity-100 translate-x-0',
    },
    'fade-right': {
      hidden: 'opacity-0 -translate-x-8',
      visible: 'opacity-100 translate-x-0',
    },
    'scale': {
      hidden: 'opacity-0 scale-95',
      visible: 'opacity-100 scale-100',
    },
    'blur': {
      hidden: 'opacity-0 blur-sm',
      visible: 'opacity-100 blur-0',
    },
  };

  const currentAnimation = animationStyles[animation];

  return (
    <div
      ref={ref}
      className={`${baseStyles} ${isVisible ? currentAnimation.visible : currentAnimation.hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
