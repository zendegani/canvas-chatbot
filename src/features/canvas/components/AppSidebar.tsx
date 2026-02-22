import React from 'react';
import { Sparkles, Settings, Trash2, Plus, MessageSquare, X } from 'lucide-react';
import { ChatSession } from '../types';
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
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {sessions.map(session => (
                                <SidebarMenuItem key={session.id}>
                                    <SidebarMenuButton
                                        isActive={session.id === activeSessionId}
                                        onClick={() => onLoadSession(session.id)}
                                        tooltip={session.title}
                                    >
                                        <MessageSquare />
                                        <span>{session.title}</span>
                                    </SidebarMenuButton>
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
                                </SidebarMenuItem>
                            ))}
                            {sessions.length === 0 && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton disabled className="text-muted-foreground opacity-60">
                                        <MessageSquare />
                                        <span>No chats yet</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                {/* Actions */}
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
