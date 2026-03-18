import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator, AvatarStatus } from "@/components/ui/avatar";
import { Clock, User, Settings, Shield, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useLoginModal } from "@/components/auth/login-modal-context";
import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Tenant {
  id: number;
  name: string;
  slug: string;
}

function getTenantName(): string {
  const parts = window.location.hostname.split('.');
  if (parts.length >= 3) {
    const sub = parts[0];
    return sub.charAt(0).toUpperCase() + sub.slice(1);
  }
  return 'Master';
}

export function UserDropdownMenu() {
  const { theme, setTheme } = useTheme();
  const tenantName = getTenantName();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const { logout, user } = useLoginModal();

  useEffect(() => {
    api.get<Tenant[]>('/tenants').then(res => setTenants(res.data)).catch(() => {});
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <DropdownMenu>
		<DropdownMenuTrigger className="cursor-pointer">
			<Avatar className="size-7">
				<AvatarImage src={user?.people?.photo_sm ?? undefined} />
				<AvatarFallback>{user?.people?.name?.charAt(0) ?? '?'}</AvatarFallback>
				<AvatarIndicator className="-end-2 -top-2">
					<AvatarStatus variant="online" className="size-2.5" />
				</AvatarIndicator>
			</Avatar>
		</DropdownMenuTrigger>
		<DropdownMenuContent className="w-56" side="bottom" align="end" sideOffset={11}>
			{/* User Information Section */}
			<div className="flex items-center gap-3 px-3 py-2">
				<Avatar>
					<AvatarImage src={user?.people?.photo_sm ?? undefined} />
					<AvatarFallback>{user?.people?.name?.charAt(0) ?? '?'}</AvatarFallback>
					<AvatarIndicator className="-end-1.5 -top-1.5">
						<AvatarStatus variant="online" className="size-2.5" />
					</AvatarIndicator>
				</Avatar>
				<div className="flex flex-col items-start">
					<span className="text-sm font-semibold text-foreground">{user?.people?.name ?? '—'}</span>
					<span className="text-xs text-muted-foreground">{user?.email ?? '—'}</span>
				</div>
			</div>

			<DropdownMenuSub>
				<DropdownMenuSubTrigger className="cursor-pointer py-1 rounded-md border border-border hover:bg-muted">
					<Clock/>
					<span>Gabinete: {tenantName}</span>
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent className="w-48">
					{tenants.map(t => (
						<DropdownMenuItem key={t.id}>{t.name}</DropdownMenuItem>
					))}
				</DropdownMenuSubContent>
			</DropdownMenuSub>

			<DropdownMenuSeparator />

			{/* Settings */}
			<DropdownMenuItem>
				<User/>
				<span>Meu Perfil</span>
			</DropdownMenuItem>

			<DropdownMenuItem>
				<Settings/>
				<span>Preferências</span>
			</DropdownMenuItem>

			<DropdownMenuItem>
				<Shield/>
				<span>Segurança</span>
			</DropdownMenuItem>

			<DropdownMenuSeparator />

			{/* Theme Toggle */}
			<DropdownMenuItem onClick={toggleTheme}>
				{theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
				<span>{theme === "light" ? "Modo Dark" : "Modo Light"}</span>
			</DropdownMenuItem>

			<DropdownMenuSeparator />

			{/* Action Items */}
			<DropdownMenuItem onClick={logout}>
				<LogOut/>
				<span>Sair</span>
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
  );
}
