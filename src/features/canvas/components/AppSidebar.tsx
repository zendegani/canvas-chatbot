import React from 'react';
import { Sparkles, Settings, Trash2 } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import { NavUser } from './NavUser';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    currentUser: string;
    onGoHome: () => void;
    onOpenSettings: () => void;
    onClearData: () => void;
    onLogout: () => void;
}

export function AppSidebar({
    currentUser,
    onGoHome,
    onOpenSettings,
    onClearData,
    onLogout,
    ...props
}: AppSidebarProps) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            onClick={onGoHome}
                            tooltip="Go Home"
                            className="cursor-pointer"
                        >
                            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                <Sparkles className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Canvas AI</span>
                                <span className="truncate text-xs text-muted-foreground">Workspace</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Actions</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={onOpenSettings} tooltip="Settings">
                                    <Settings />
                                    <span>Settings</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={onClearData}
                                    tooltip="Clear Data"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 />
                                    <span>Clear Data</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser
                    email={currentUser}
                    onOpenSettings={onOpenSettings}
                    onLogout={onLogout}
                />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
