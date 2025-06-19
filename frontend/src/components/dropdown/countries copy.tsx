/* -------------------------------------------------------------------------- */
/*                             External Dependency                            */
/* -------------------------------------------------------------------------- */

import { Check, ChevronsUpDown } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                             Internal Dependency                            */
/* -------------------------------------------------------------------------- */

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { cn, lowerCase } from "@/lib/utils";
import countries from "@/data/countries.json";

import { type CountryProps } from "@/lib/types";
import { useDropdownStore } from "@/lib/store/dropdown";

interface CountryDropdownProps {
    disabled?: boolean;
}

const CountryDropdown = ({ disabled }: CountryDropdownProps) => {
    const {
        countryValue,
        setCountryValue,
        openCountryDropdown,
        setOpenCountryDropdown,
    } = useDropdownStore();
    const C = countries as CountryProps[];

    return (
        <Popover
            open={openCountryDropdown}
            onOpenChange={setOpenCountryDropdown}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCountryDropdown}
                    disabled={disabled}
                >
                    <span>
                        {countryValue ? (
                            <div className="flex items-end gap-2">
                                <span>
                                    {
                                        countries.find(
                                            (country) =>
                                                country.iso2 === countryValue
                                        )?.emoji
                                    }
                                </span>
                                <span>
                                    {
                                        countries.find(
                                            (country) =>
                                                country.iso2 === countryValue
                                        )?.name
                                    }
                                </span>
                            </div>
                        ) : (
                            <span>Select Country</span>
                        )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-max p-0">
                <Command>
                    <CommandInput placeholder="Search country" />
                    <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                            <ScrollArea className="max-h-[300px]">
                                {C.map((country) => (
                                    <CommandItem
                                        key={country.id}
                                        value={country.iso2}
                                        onSelect={(currentValue) => {
                                            setCountryValue(
                                                currentValue === country.iso2
                                                    ? currentValue
                                                    : ""
                                            );
                                            setOpenCountryDropdown(false);
                                        }}
                                        className="flex cursor-pointer items-center justify-between text-xs hover:!bg-[#27272a] hover:!text-white"
                                    >
                                        <div className="flex items-end gap-2">
                                            <span>{country.emoji}</span>
                                            <span className="">
                                                {country.name}
                                            </span>
                                        </div>
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                countryValue === country.iso2
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                                <ScrollBar orientation="vertical" />
                            </ScrollArea>
                        </CommandGroup>
                    </CommandList>
                </Command>
                {/* <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <ScrollArea
                            className={
                                "[&>[data-radix-scroll-area-viewport]]:max-h-[300px]"
                            }>
                            <CommandGroup>
                                {C.map((country) => (
                                    <CommandItem
                                        key={country.id}
                                        value={country.name}
                                        onSelect={(currentValue) => {
                                            console.log(currentValue);
                                            setCountryValue(
                                                currentValue === country.name
                                                    ? currentValue
                                                    : ""
                                            );
                                            setOpenCountryDropdown(false);
                                        }}
                                        className="flex cursor-pointer items-center justify-between text-xs hover:!bg-[#27272a] hover:!text-white">
                                        <div className="flex items-end gap-2">
                                            <span>{country.emoji}</span>
                                            <span className="">
                                                {country.name}
                                            </span>
                                        </div>
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                countryValue === country.iso2
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </ScrollArea>
                    </CommandList>
                </Command> */}
            </PopoverContent>
        </Popover>
    );
};

export default CountryDropdown;
