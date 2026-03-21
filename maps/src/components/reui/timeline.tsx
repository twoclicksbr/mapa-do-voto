import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineContextValue {
  value: number
  orientation: "horizontal" | "vertical"
}

const TimelineContext = React.createContext<TimelineContextValue>({
  value: 0,
  orientation: "horizontal",
})

interface TimelineItemContextValue {
  step: number
  status: "completed" | "current" | "upcoming"
}

const TimelineItemContext = React.createContext<TimelineItemContextValue>({
  step: 0,
  status: "upcoming",
})

interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  defaultValue?: number
  orientation?: "horizontal" | "vertical"
}

function Timeline({
  defaultValue = 0,
  orientation = "horizontal",
  className,
  children,
  ...props
}: TimelineProps) {
  return (
    <TimelineContext.Provider value={{ value: defaultValue, orientation }}>
      <ol
        data-orientation={orientation}
        className={cn(
          "group/timeline",
          orientation === "horizontal" && "flex w-full items-start",
          orientation === "vertical" && "flex flex-col",
          className
        )}
        {...props}
      >
        {children}
      </ol>
    </TimelineContext.Provider>
  )
}

interface TimelineItemProps extends React.HTMLAttributes<HTMLLIElement> {
  step: number
}

function TimelineItem({ step, className, children, ...props }: TimelineItemProps) {
  const { value, orientation } = React.useContext(TimelineContext)
  const status: "completed" | "current" | "upcoming" =
    step < value ? "completed" : step === value ? "current" : "upcoming"

  return (
    <TimelineItemContext.Provider value={{ step, status }}>
      <li
        data-orientation={orientation}
        data-status={status}
        className={cn(
          "group/timeline-item relative",
          orientation === "horizontal" && "flex-1",
          className
        )}
        {...props}
      >
        {children}
      </li>
    </TimelineItemContext.Provider>
  )
}

function TimelineHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group-data-[orientation=horizontal]/timeline-item:flex group-data-[orientation=horizontal]/timeline-item:flex-col group-data-[orientation=horizontal]/timeline-item:items-start",
        className
      )}
      {...props}
    />
  )
}

function TimelineSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { status } = React.useContext(TimelineItemContext)
  return (
    <div
      className={cn(
        "absolute h-0.5 top-3 left-6 right-0",
        status === "completed" ? "bg-primary" : "bg-input",
        "group-last/timeline-item:hidden",
        className
      )}
      {...props}
    />
  )
}

function TimelineIndicator({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative z-10 flex size-6 items-center justify-center rounded-full border-2 border-input bg-background mb-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function TimelineTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  )
}

function TimelineDate({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-muted-foreground mb-1", className)}
      {...props}
    />
  )
}

function TimelineContent({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-muted-foreground mt-1", className)}
      {...props}
    />
  )
}

export {
  Timeline,
  TimelineItem,
  TimelineHeader,
  TimelineSeparator,
  TimelineIndicator,
  TimelineTitle,
  TimelineDate,
  TimelineContent,
}
