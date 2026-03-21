"use client"

import { ComponentProps, useMemo, useState } from "react"
import * as BasePhoneInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, ChevronsUpDown } from "lucide-react"

type PhoneInputProps = Omit<ComponentProps<"input">, "onChange" | "value" | "ref"> &
  Omit<BasePhoneInput.Props<typeof BasePhoneInput.default>, "onChange"> & {
    onChange?: (value: BasePhoneInput.Value) => void
  }

function PhoneInput({ className, onChange, value, ...props }: PhoneInputProps) {
  return (
    <BasePhoneInput.default
      className={cn("flex", className)}
      flagComponent={FlagComponent}
      countrySelectComponent={CountrySelect}
      inputComponent={InputComponent}
      smartCaret={false}
      defaultCountry="BR"
      value={value || undefined}
      onChange={(v) => onChange?.(v || ("" as BasePhoneInput.Value))}
      {...props}
    />
  )
}

function InputComponent({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn("rounded-s-none h-8 text-sm", className)}
      {...props}
    />
  )
}

type CountryEntry = { label: string; value: BasePhoneInput.Country | undefined }

type CountrySelectProps = {
  disabled?: boolean
  value: BasePhoneInput.Country
  options: CountryEntry[]
  onChange: (country: BasePhoneInput.Country) => void
}

function CountrySelect({ disabled, value: selectedCountry, options, onChange }: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return options.filter((o) => o.value)
    return options.filter(
      (o) => o.value && o.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [options, search])

  const handleSelect = (country: BasePhoneInput.Country) => {
    onChange(country)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch("") }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-s-lg rounded-e-none border-e-0 px-2 h-8 gap-1 hover:bg-transparent focus:z-10"
          disabled={disabled}
        >
          <FlagComponent country={selectedCountry} countryName={selectedCountry} />
          <ChevronsUpDown className="size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Buscar país..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <ScrollArea className="h-64">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-4 text-center">Nenhum país encontrado.</p>
          )}
          {filtered.map((item) =>
            item.value ? (
              <button
                key={item.value}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left",
                  selectedCountry === item.value && "bg-accent"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item.value!)}
              >
                <FlagComponent country={item.value} countryName={item.label} />
                <span className="flex-1 truncate">{item.label}</span>
                <span className="text-muted-foreground text-xs">
                  +{BasePhoneInput.getCountryCallingCode(item.value)}
                </span>
                {selectedCountry === item.value && <Check className="size-3 shrink-0" />}
              </button>
            ) : null
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function FlagComponent({ country, countryName }: BasePhoneInput.FlagProps) {
  const Flag = flags[country]
  return (
    <span className="flex h-4 w-4 items-center justify-center">
      {Flag ? (
        <Flag title={countryName} className="rounded-[2px] size-full" />
      ) : (
        <span className="text-xs">🌐</span>
      )}
    </span>
  )
}

export { PhoneInput }
