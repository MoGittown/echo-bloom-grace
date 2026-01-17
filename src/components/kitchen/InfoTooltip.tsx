import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTooltipProps {
  title?: string;
  description: string;
  recommendation?: string;
}

export function InfoTooltip({ title, description, recommendation }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button" 
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3 text-sm bg-popover border shadow-lg"
        >
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="text-muted-foreground">{description}</p>
          {recommendation && (
            <p className="mt-2 text-primary font-medium text-xs">
              💡 Empfehlung: {recommendation}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
