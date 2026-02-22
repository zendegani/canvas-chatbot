# Canvas Sidebar — shadcn Sidebar Component

- **Status**: Confirmed
- **Created:** 2026-02-22
- **Last Updated:** 2026-02-22

## Problem Statement

The Canvas page top bar currently holds **Logout**, **Clear**, and **Settings** buttons alongside the logo and node counter. This crowds the toolbar and provides no space to show user info. The user wants a dedicated sidebar using the **shadcn `<Sidebar>`** component.

---

## Confirmed Solution

Use the official **shadcn Sidebar** (`collapsible="icon"`) — **default collapsed**.

### Layout

```
┌──┬─────────────────────────────────────────────────┐
│✦ │ [☰ trigger]  3/10 Nodes               [🌙]     │  ← top bar (SidebarInset)
│──│─────────────────────────────────────────────────│
│  │                                                 │
│  │           Canvas (existing)                     │
│⚙ │                                                 │
│🗑 │                                                 │
│  │                                                 │
│  │                                                 │
│──│                                                 │
│👤│                                                 │
└──┴─────────────────────────────────────────────────┘
     ↑ collapsed (icon-only) by default
```

**Expanded state** (click trigger):

```
┌──────────┬─────────────────────────────────────────┐
│ ✦ Canvas │ [☰]  3/10 Nodes               [🌙]     │
│    AI    │─────────────────────────────────────────│
│ ──────── │                                         │
│ ⚙ Sett.  │           Canvas (existing)             │
│ 🗑 Clear  │                                         │
│          │                                         │
│          │  (future: chat history sessions here)   │
│ ──────── │                                         │
│ 👤 user  │  ← dropdown: Settings, Log out          │
│  @email  │                                         │
└──────────┴─────────────────────────────────────────┘
```

### Decisions

- **Default state**: Collapsed (icon-only).
- **Sidebar Header**: ✦ Canvas AI icon + text, acts as **Home** button (`onGoHome`). Replaces logo in top bar.
- **Sidebar Content**: Settings, Clear Data menu items.
- **Sidebar Footer**: `NavUser` — avatar + email, dropdown with Settings & Log out.
- **Future**: Chat history sessions will go in `SidebarContent`.

### New shadcn components to install

`sidebar`, `dropdown-menu`, `avatar`

### New files

| File                                              | Purpose                        |
|---------------------------------------------------|--------------------------------|
| `src/features/canvas/components/AppSidebar.tsx`   | Main sidebar composition       |
| `src/features/canvas/components/NavUser.tsx`      | Footer user dropdown           |

### Changes to existing files

| File         | Change                                                                                   |
|--------------|------------------------------------------------------------------------------------------|
| `Canvas.tsx` | Remove Settings/Clear/Logout/Logo from top bar. Wrap with `SidebarProvider` + `SidebarInset`. Add `SidebarTrigger`. Accept `currentUser` prop. |
| `App.tsx`    | Pass `currentUser` to `<Canvas />`.                                                      |

---

## Next Steps

- [x] Confirm approach
- [ ] Install shadcn sidebar, dropdown-menu, avatar
- [ ] Create AppSidebar.tsx, NavUser.tsx
- [ ] Update Canvas.tsx, App.tsx
