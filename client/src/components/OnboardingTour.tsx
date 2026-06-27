import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
  run: boolean;
}

export function OnboardingTour({ steps, onComplete, run }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const updatePosition = useCallback(() => {
    if (!run || steps.length === 0 || currentStep >= steps.length) return;
    
    const step = steps[currentStep];
    const element = document.getElementById(step.targetId);
    
    if (element) {
      // Scroll into view gently
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      
      // Wait a tiny bit for scrolling to finish before grabbing rect
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      }, 300);
    } else {
      // If element not found on screen yet, retry after a short delay
      setTimeout(() => {
        const el = document.getElementById(step.targetId);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        } else {
           // Skip step if it really doesn't exist
           handleNext();
        }
      }, 500);
    }
  }, [currentStep, run, steps]);

  useEffect(() => {
    if (run) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, { passive: true });
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [run, currentStep, updatePosition]);

  if (!run || steps.length === 0 || currentStep >= steps.length) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setTargetRect(null); // Temporarily hide while moving
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];
  const padding = 12; // Padding around the highlighted element

  // Calculate Popover Position based on targetRect
  let popoverStyle: React.CSSProperties = {};
  if (targetRect) {
    const isMobile = window.innerWidth < 768;
    // Default to bottom or center if no space
    if (isMobile) {
        // On mobile, just put it at the bottom of the screen to avoid covering the item
        popoverStyle = {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '350px'
        };
    } else {
        const placement = step.placement || 'bottom';
        popoverStyle = { position: 'fixed' };
        
        switch (placement) {
            case 'bottom':
                popoverStyle.top = targetRect.bottom + padding + 16;
                popoverStyle.left = Math.max(180, Math.min(targetRect.left + (targetRect.width / 2), window.innerWidth - 180));
                popoverStyle.transform = 'translateX(-50%)';
                break;
            case 'top':
                popoverStyle.bottom = window.innerHeight - targetRect.top + padding + 16;
                popoverStyle.left = Math.max(180, Math.min(targetRect.left + (targetRect.width / 2), window.innerWidth - 180));
                popoverStyle.transform = 'translateX(-50%)';
                break;
            case 'right':
                popoverStyle.top = targetRect.top + (targetRect.height / 2);
                popoverStyle.left = targetRect.right + padding + 16;
                popoverStyle.transform = 'translateY(-50%)';
                break;
            case 'left':
                popoverStyle.top = targetRect.top + (targetRect.height / 2);
                popoverStyle.right = window.innerWidth - targetRect.left + padding + 16;
                popoverStyle.transform = 'translateY(-50%)';
                break;
            case 'center':
            default:
                popoverStyle.top = '50%';
                popoverStyle.left = '50%';
                popoverStyle.transform = 'translate(-50%, -50%)';
                break;
        }

        // Keep on screen constraints
        if (typeof popoverStyle.top === 'number' && popoverStyle.top > window.innerHeight - 200) {
            popoverStyle.top = undefined;
            popoverStyle.bottom = '24px';
        }
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <AnimatePresence>
        {targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* The Spotlight (Cutout) */}
            <motion.div
              className="absolute rounded-xl pointer-events-auto"
              style={{
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.85), 0 0 40px rgba(236,72,153,0.5)',
                border: '2px solid rgba(255,255,255,0.2)',
                zIndex: 9999
              }}
              animate={{
                top: targetRect.top - padding,
                left: targetRect.left - padding,
                width: targetRect.width + padding * 2,
                height: targetRect.height + padding * 2,
              }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {/* Optional glowing effect inside the box */}
              <div className="absolute inset-0 rounded-xl bg-primary/10 animate-pulse pointer-events-none" />
            </motion.div>

            {/* The Dialog */}
            <motion.div
              className="absolute z-[10000] pointer-events-auto w-[320px] bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl"
              style={popoverStyle}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 15 }}
            >
              {/* Skip Button */}
              <button 
                onClick={onComplete}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress Indicator */}
              <div className="flex gap-1 mb-4">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 flex-1 rounded-full ${i <= currentStep ? 'bg-primary' : 'bg-white/10'}`}
                  />
                ))}
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {step.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                {step.content}
              </p>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                  Step {currentStep + 1} of {steps.length}
                </span>
                
                <Button 
                  onClick={handleNext} 
                  className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20"
                >
                  {currentStep === steps.length - 1 ? (
                    <>Get Started <Check className="w-4 h-4 ml-2" /></>
                  ) : (
                    <>Next <ChevronRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
