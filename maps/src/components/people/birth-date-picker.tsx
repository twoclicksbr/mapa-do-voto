import {
  Dispatch,
  HTMLAttributes,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfYear,
  format,
  isAfter,
  isBefore,
  parse,
  startOfYear,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import type { CaptionLabelProps, MonthGridProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"

interface BirthDatePickerProps {
  id?: string
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  className?: string
  inputSize?: "sm" | "md"
}

export function BirthDatePicker({
  id,
  value,
  onChange,
  className,
  inputSize = "md",
}: BirthDatePickerProps) {
  const today = new Date()
  const parsedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined

  const [month, setMonth] = useState(parsedDate ?? today)
  const [date, setDate] = useState<Date | undefined>(parsedDate)
  const [isYearView, setIsYearView] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const startDate = startOfYear(new Date(1920, 0))
  const endDate = endOfYear(new Date(today.getFullYear(), 11))

  const years = eachYearOfInterval({ start: startDate, end: endDate })

  const handleSelect = (selected: Date | undefined) => {
    setDate(selected)
    onChange(selected ? format(selected, "yyyy-MM-dd") : "")
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "group/pick-date w-full justify-between font-normal",
            inputSize === "sm" ? "h-8 text-sm px-3" : "h-8.5 text-[0.8125rem] px-3",
            className
          )}
        >
          <span className={cn("truncate", !date && "text-muted-foreground")}>
            {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
          </span>
          <CalendarIcon
            aria-hidden="true"
            className="text-muted-foreground/80 group-hover/pick-date:text-foreground shrink-0 transition-colors size-4"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 z-[200] w-auto">
            <Calendar
              locale={ptBR}
              formatters={{
                formatWeekdayName: (date) =>
                  ["D", "S", "T", "Q", "Q", "S", "S"][date.getDay()],
              }}
              classNames={{
                month_caption: "justify-start",
                nav: "flex items-center w-full absolute inset-x-0 justify-end pointer-events-none [&>button]:pointer-events-auto",
              }}
              components={{
                CaptionLabel: (props: CaptionLabelProps) => (
                  <CaptionLabelComp
                    isYearView={isYearView}
                    setIsYearView={(val) => {
                      setIsYearView(val)
                      if (!val) setSelectedYear(null)
                    }}
                    {...props}
                  />
                ),
                MonthGrid: (props: MonthGridProps) => (
                  <MonthGridComp
                    className={props.className}
                    currentMonth={month.getMonth()}
                    currentYear={month.getFullYear()}
                    endDate={endDate}
                    isYearView={isYearView}
                    onMonthSelect={(selectedMonth: Date) => {
                      setMonth(selectedMonth)
                      setIsYearView(false)
                      setSelectedYear(null)
                    }}
                    setIsYearView={setIsYearView}
                    startDate={startDate}
                    years={years}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                  >
                    {props.children}
                  </MonthGridComp>
                ),
              }}
              defaultMonth={parsedDate ?? today}
              endMonth={endDate}
              mode="single"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleSelect}
              selected={date}
              startMonth={startDate}
            />
      </PopoverContent>
    </Popover>
  )
}

function MonthGridComp({
  className,
  children,
  isYearView,
  years,
  currentYear,
  currentMonth,
  onMonthSelect,
  selectedYear,
  setSelectedYear,
  startDate,
  endDate,
}: {
  className?: string
  children: ReactNode
  isYearView: boolean
  setIsYearView: Dispatch<SetStateAction<boolean>>
  startDate: Date
  endDate: Date
  years: Date[]
  currentYear: number
  currentMonth: number
  onMonthSelect: (date: Date) => void
  selectedYear: number | null
  setSelectedYear: Dispatch<SetStateAction<number | null>>
}) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isYearView && scrollAreaRef.current) {
      const activeElement = scrollAreaRef.current.querySelector(
        "[data-active='true']"
      ) as HTMLElement | null
      if (activeElement) {
        activeElement.scrollIntoView({ block: "center" })
      }
    }
  }, [isYearView, selectedYear])

  return (
    <div className="relative">
      <table className={className}>{children}</table>
      {isYearView && (
        <div className="bg-background absolute inset-0 z-20 -m-2">
          <div className="h-full" ref={scrollAreaRef}>
            <ScrollArea className="h-full">
              <div className="px-3 pt-1 pb-3">
                {selectedYear === null ? (
                  <div className="grid grid-cols-4 gap-2">
                    {years.map((year) => {
                      const y = year.getFullYear()
                      const isCurrent = y === currentYear
                      return (
                        <Button
                          key={y}
                          variant={isCurrent ? "default" : "outline"}
                          size="sm"
                          className="h-8"
                          data-active={isCurrent}
                          onClick={() => setSelectedYear(y)}
                        >
                          {y}
                        </Button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-2"
                        onClick={() => setSelectedYear(null)}
                      >
                        <ChevronDownIcon className="mr-1 size-4 rotate-90" />
                        {selectedYear}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {eachMonthOfInterval({
                        start: startOfYear(new Date(selectedYear, 0)),
                        end: endOfYear(new Date(selectedYear, 0)),
                      }).map((m) => {
                        const isCurrent =
                          m.getMonth() === currentMonth &&
                          selectedYear === currentYear
                        const isDisabled =
                          isBefore(m, startOfYear(startDate)) ||
                          isAfter(m, endOfYear(endDate))
                        return (
                          <Button
                            key={m.getTime()}
                            variant={isCurrent ? "default" : "outline"}
                            size="sm"
                            className="h-8"
                            data-active={isCurrent}
                            disabled={isDisabled}
                            onClick={() => onMonthSelect(m)}
                          >
                            {format(m, "MMM", { locale: ptBR })}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  )
}

function CaptionLabelComp({
  children,
  isYearView,
  setIsYearView,
}: {
  isYearView: boolean
  setIsYearView: Dispatch<SetStateAction<boolean>>
} & HTMLAttributes<HTMLSpanElement>) {
  return (
    <Button
      className="data-[state=open]:text-muted-foreground/80 -ms-2 flex items-center gap-2 text-sm font-medium hover:bg-transparent [&[data-state=open]>svg]:rotate-180"
      data-state={isYearView ? "open" : "closed"}
      onClick={() => setIsYearView((prev) => !prev)}
      size="sm"
      variant="ghost"
    >
      {children}
      <ChevronDownIcon
        aria-hidden="true"
        className="text-muted-foreground/80 shrink-0 transition-transform duration-200"
      />
    </Button>
  )
}
