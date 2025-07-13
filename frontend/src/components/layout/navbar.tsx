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
                    <NavigationMenuLink
                        href="https://mydormstore.ca/"
                        onClick={() =>
                            (window.location.href = "https://mydormstore.ca/")
                        }
                    >
                        <img
                            src="/Logo.png"
                            className="h-8"
                            onClick={() =>
                                (window.location.href =
                                    "https://mydormstore.ca/")
                            }
                        />
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
