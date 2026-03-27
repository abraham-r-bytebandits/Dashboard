
import { ChevronRight } from "lucide-react"
import { NavUser } from "../ui/nav-user"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarHeader,
    SidebarFooter,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "../ui/sidebar"
import { data } from "@/lib/sidebar"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { isAdmin, user } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const currentRoute = location.pathname;

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
        if (url !== "#") {
            e.preventDefault();
            navigate(url);
        }
    };
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-white">My Dashboard</span>
                        <span className="text-xs text-white/70">Admin</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarMenu className="gap-3">
                        {data.navMain.map((item) => {
                            if (!isAdmin && (item.title === "Fixed Costs" || item.title === "Operational Costs")) {
                                return null;
                            }
                            return item.items?.length ? (
                                <Collapsible
                                    key={item.title}
                                    asChild
                                    defaultOpen={item.isActive}
                                    className="group/collapsible"
                                >
                                    <SidebarMenuItem className="gap-3">
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip={item.title}>
                                                {item.icon && <item.icon className="h-5 w-5" />}
                                                <span>{item.title}</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down gap-3">
                                            <SidebarMenuSub className="gap-3">
                                                {item.items.map((subItem) => (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton asChild isActive={currentRoute === subItem.url}>
                                                            <a href={subItem.url} onClick={(e) => handleNavigation(e, subItem.url)}>
                                                                <span>{subItem.title}</span>
                                                            </a>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            ) : (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title} isActive={currentRoute === item.url || (item.url === '/' && currentRoute === '/')}>
                                        <a href={item.url} onClick={(e) => handleNavigation(e, item.url)}>
                                            {item.icon && <item.icon className="h-5 w-5" />}
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                {user?.profile && <NavUser user={user} />}
            </SidebarFooter>
        </Sidebar>
    )
}
