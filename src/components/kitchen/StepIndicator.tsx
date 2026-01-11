import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
                'flex flex-col items-center gap-2',
                onStepClick && 'cursor-pointer hover:opacity-80',
                !onStepClick && 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'step-indicator',
                  index < currentStep && 'step-complete',
                  index === currentStep && 'step-active',
                  index > currentStep && 'step-inactive'
                )}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  index === currentStep && 'text-primary',
                  index !== currentStep && 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </button>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-12 md:w-20 h-0.5 mx-2',
                  index < currentStep ? 'bg-accent' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}