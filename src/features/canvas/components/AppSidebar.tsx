import React from 'react';
import { Sparkles, Settings, Trash2, Plus, X, History, ChevronRight } from 'lucide-react';
import { ChatSession } from '../types';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { NavUser } from './NavUser';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    currentUser: string;
    onGoHome: () => void;
    onOpenSettings: () => void;
    onClearData: () => void;
    onLogout: () => void;
    sessions: Omit<ChatSession, 'nodes'>[];
    activeSessionId: string | null;
    onCreateSession: () => void;
    onLoadSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
}

export function AppSidebar({
    currentUser,
    onGoHome,
    onOpenSettings,
    onClearData,
    onLogout,
    sessions,
    activeSessionId,
    onCreateSession,
    onLoadSession,
    onDeleteSession,
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
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={onCreateSession} tooltip="New Chat">
                            <Plus />
                            <span>New Chat</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent>
                {/* Chat History */}
                <SidebarGroup>
                    <SidebarGroupLabel>History</SidebarGroupLabel>
                    <SidebarMenu>
                        <Collapsible defaultOpen className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip="History">
                                        <History />
                                        <span>Recent Chats</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {sessions.map(session => (
                                            <SidebarMenuSubItem key={session.id}>
                                                <SidebarMenuSubButton
                                                    isActive={session.id === activeSessionId}
                                                    onClick={() => onLoadSession(session.id)}
                                                >
                                                    <span>{session.title}</span>
                                                </SidebarMenuSubButton>
                                                <SidebarMenuAction
                                                    showOnHover
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteSession(session.id);
                                                    }}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <X className="size-4" />
                                                    <span className="sr-only">Delete</span>
                                                </SidebarMenuAction>
                                            </SidebarMenuSubItem>
                                        ))}
                                        {sessions.length === 0 && (
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton className="text-muted-foreground opacity-60 pointer-events-none">
                                                    <span>No chats yet</span>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        )}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarSeparator />

                {/* Actions */}
                <SidebarGroup className="mt-auto">
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
                                    tooltip="Clear All Data"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 />
                                    <span>Clear All Data</span>
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
