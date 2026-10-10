"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AuthUser } from "./authClient";

export interface UserMenuProps {
  user: AuthUser;
  onLogout: () => void;
}

/** Header control shown when someone is logged in: name/email plus a Log out action. */
export function UserMenu({ user, onLogout }: UserMenuProps) {
  const label = user.name && user.name.trim() ? user.name.trim() : user.email;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="max-w-40 truncate text-sm text-graphite">{label}</span>
      <Button variant="outline" size="sm" onClick={onLogout}>
        <LogOut className="mr-1.5 size-3.5" aria-hidden="true" />
        Log out
      </Button>
    </div>
  );
}
