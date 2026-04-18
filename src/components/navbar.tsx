import Link from "next/link";
import { BookOpen, LayoutDashboard, Library, Target, Upload } from "lucide-react";

import { NavLink } from "@/components/nav-link";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/livros", label: "Livros", icon: Library },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/livros/importar", label: "Importar", icon: Upload },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="font-heading hidden text-xl font-semibold tracking-tight sm:inline">
            Biblioteca Virtual
          </span>
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
