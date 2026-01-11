import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Step {
  title: string;
  icon: React.ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full py-4 overflow-x-auto no-print">
      <div className="flex items-center justify-center min-w-max px-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <button
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick}
              className={cn(
                'flex flex-col items-center gap-2 transition-all',
                onStepClick && 'cursor-pointer hover:opacity-80',
                !onStepClick && 'cursor-default'
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: index === currentStep ? 1.1 : 1,
                  backgroundColor: index < currentStep 
                    ? 'hsl(var(--accent))' 
                    : index === currentStep 
                      ? 'hsl(var(--primary))' 
                      : 'hsl(var(--muted))',
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  'step-indicator relative',
                  index < currentStep && 'step-complete',
                  index === currentStep && 'step-active',
                  index > currentStep && 'step-inactive'
                )}
              >
                {index < currentStep ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                ) : (
                  step.icon
                )}
                {index === currentStep && (
                  <motion.div
                    layoutId="activeRing"
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ margin: '-3px' }}
                  />
                )}
              </motion.div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap transition-colors duration-300',
                  index === currentStep && 'text-primary',
                  index !== currentStep && 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </button>

            {index < steps.length - 1 && (
              <div className="w-12 md:w-20 h-0.5 mx-2 bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: index < currentStep ? '100%' : '0%' 
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}