import Link from "next/link";
import { BookOpen, LayoutDashboard, Library, Target } from "lucide-react";

import { NavLink } from "@/components/nav-link";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/livros", label: "Livros", icon: Library },
  { href: "/metas", label: "Metas", icon: Target },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Biblioteca Virtual</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href}>
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
