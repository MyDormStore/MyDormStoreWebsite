import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "../ui/navigation-menu";

export default function NavBar() {
    return (
        <NavigationMenu className="border-b-2 w-screen">
            <NavigationMenuList className="w-screen">
                <NavigationMenuItem>
                    <NavigationMenuLink>
                        <img src="/Logo.png" className="h-8" />
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
