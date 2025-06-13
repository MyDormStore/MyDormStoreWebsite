import { dormSelectList } from "@/data/residence";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

interface SelectDormProps {
    dorm: string;
    setDorm: React.Dispatch<React.SetStateAction<string>>;
}

export function SelectDorm({ dorm, setDorm }: SelectDormProps) {
    return (
        <div className="grid gap-2">
            <Label>What residence are you staying in?</Label>
            <Select onValueChange={setDorm} value={dorm}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose Dorm..." />
                </SelectTrigger>
                <SelectContent>
                    {dormSelectList.map((dorm) => {
                        return (
                            <SelectItem key={dorm.key} value={dorm.key}>
                                {dorm.label}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
}
