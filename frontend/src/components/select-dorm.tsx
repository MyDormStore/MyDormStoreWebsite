import { dormSelectList, school, schoolSelectList } from "@/data/residence";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { useEffect, useState } from "react";

interface SelectDormProps {
    dorm: string;
    setDorm: React.Dispatch<React.SetStateAction<string>>;
}

export function SelectDorm({ dorm, setDorm }: SelectDormProps) {
    const [school, setSchool] = useState<school | string>("");

    useEffect(() => {
        setDorm("");
    }, [school, setDorm]);
    return (
        <div className="flex gap-4 flex-col">
            <div className="grid gap-2">
                <Label>What school are you attending? (Optional)</Label>
                <Select onValueChange={setSchool} value={school}>
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
                </Select>
            </div>
            <div className="grid gap-2">
                <Label>What residence are you staying in? (Optional)</Label>
                <Select onValueChange={setDorm} value={dorm} disabled={!school}>
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
                                    <SelectItem key={dorm.key} value={dorm.key}>
                                        {dorm.label}
                                    </SelectItem>
                                );
                            })}
                    </SelectContent>
                </Select>
            </div>{" "}
        </div>
    );
}
