
import { NavUser } from "../ui/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarHeader,
    SidebarFooter,
} from "../ui/sidebar"
import { data } from "@/lib/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-3 px-4 py-3">
                    {/* Logo */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white font-bold">
                        L
                    </div>

                    {/* Name + Role */}
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-gray-900">My Dashboard</span>
                        <span className="text-xs text-gray-500">Admin</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Main</SidebarGroupLabel>
                    <SidebarMenu>
                        {data.navMain.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton>
                                    {item.icon && <item.icon className="h-5 w-5" />}
                                    <span>{item.title}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
                {/* Projects */}
                <SidebarGroup>
                    <SidebarGroupLabel>Projects</SidebarGroupLabel>
                    <SidebarMenu>
                        {data.projects.map((project) => (
                            <SidebarMenuItem key={project.name}>
                                <SidebarMenuButton>
                                    {project.icon && <project.icon className="h-5 w-5" />}
                                    <span>{project.name}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
        </Sidebar>
    )
}
