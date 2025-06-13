import type { Control, FieldValues } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

interface FormInputProps {
    control: Control<FieldValues, any, FieldValues>;
    name: string;
    label: string;
}

export default function FormInput({ control, name, label }: FormInputProps) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    {/* <FormDescription>
                                                This is your public display name.
                                            </FormDescription> */}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
