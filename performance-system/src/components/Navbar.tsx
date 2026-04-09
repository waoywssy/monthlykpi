'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Upload, Users, DollarSign, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/upload',    label: '导入考核表', icon: Upload },
  { href: '/dashboard', label: '绩效看板',   icon: BarChart3 },
  { href: '/bonus',     label: '提成测算',   icon: DollarSign },
  { href: '/org',       label: '组织架构',   icon: Users },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-6xl flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-4">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm hidden sm:inline-block whitespace-nowrap">
            研发绩效系统
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
