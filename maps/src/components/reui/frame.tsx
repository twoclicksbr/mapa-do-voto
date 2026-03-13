import * as React from 'react';
import { cn } from '@/lib/utils';

interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
  stacked?: boolean;
  dense?: boolean;
  spacing?: 'sm' | 'md' | 'lg';
}

function Frame({ stacked, dense, spacing, className, ...props }: FrameProps) {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden',
        stacked && 'flex flex-col',
        dense && 'text-sm',
        spacing === 'sm' && 'gap-0',
        spacing === 'md' && 'gap-2',
        spacing === 'lg' && 'gap-4',
        className,
      )}
      {...props}
    />
  );
}

function FrameHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-3 py-2.5', className)}
      {...props}
    />
  );
}

function FrameTitle({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('text-sm font-medium text-gray-800', className)}
      {...props}
    />
  );
}

function FramePanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-3 pb-3', className)}
      {...props}
    />
  );
}

export { Frame, FrameHeader, FrameTitle, FramePanel };
