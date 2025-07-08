import { dormSelectList, school, schoolSelectList } from "@/data/residence";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { useState, useEffect } from "react";
import { ChevronsUpDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils"; // Or use plain template strings
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SelectDormProps {
    dorm: string;
    setDorm: React.Dispatch<React.SetStateAction<string>>;
}

export function SelectDorm({ dorm, setDorm }: SelectDormProps) {
    const [school, setSchool] = useState<string>("");

    useEffect(() => {
        setDorm("");
    }, [school, setDorm]);
    return (
        <div className="flex gap-4 flex-col">
            <div className="grid gap-2">
                <Label>What school are you attending? (Optional)</Label>
                <SearchSelect
                    dataList={schoolSelectList}
                    setValue={setSchool}
                    value={school}
                />
                {/* <Select onValueChange={setSchool} value={school}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose Dorm..." />
                    </SelectTrigger>
                    <SelectContent>
                        {schoolSelectList.map((school) => {
                            return (
                                <SelectItem key={school.key} value={school.key}>
                                    {school.label}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select> */}
            </div>
            <div className="grid gap-2">
                <Label>What residence are you staying in? (Optional)</Label>
                <SearchSelect
                    dataList={dormSelectList.filter((dorm) => {
                        if (school) {
                            return dorm.school === school;
                        }
                        return true;
                    })}
                    setValue={setDorm}
                    value={dorm}
                    disabled={!school}
                />
                {/* <Select onValueChange={setDorm} value={dorm} disabled={!school}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose Dorm..." />
                    </SelectTrigger>
                    <SelectContent>
                        {dormSelectList
                            .filter((dorm) => {
                                if (school) {
                                    return dorm.school === school;
                                }
                                return true;
                            })
                            .map((dorm) => {
                                return (
                                    <SelectItem
                                        key={dorm.key + dorm.school}
                                        value={dorm.key}
                                    >
                                        {dorm.label}
                                    </SelectItem>
                                );
                            })}
                    </SelectContent>
                </Select> */}
            </div>{" "}
        </div>
    );
}

export function SearchSelect({
    dataList,
    value,
    setValue,
    disabled,
}: {
    dataList: { key: string; label: string }[];
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {value
                        ? dataList.find((data) => data.key === value)?.label
                        : "Select..."}
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        className="w-full"
                    />
                    <CommandList>
                        <CommandEmpty>List is empty.</CommandEmpty>
                        <CommandGroup className="w-full">
                            <ScrollArea>
                                {dataList.map((data) => (
                                    <CommandItem
                                        key={data.key}
                                        value={data.key}
                                        onSelect={(currentValue) => {
                                            setValue(
                                                currentValue === value
                                                    ? ""
                                                    : currentValue
                                            );
                                            setOpen(false);
                                        }}
                                    >
                                        <CheckIcon
                                            className={`mr-2 h-4 w-4 ${
                                                value === data.key
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            }`}
                                        />
                                        {data.label}
                                    </CommandItem>
                                ))}
                                <ScrollBar orientation="vertical" />
                            </ScrollArea>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
