'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { 
  Users, 
  BarChart3, 
  Upload as UploadIcon,
  Home,
  LogOut,
  FolderKanban,
  Banknote
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: '首页概览', href: '/dashboard', icon: Home },
    { name: '员工管理', href: '/org', icon: Users },
    { name: '项目管理', href: '/projects', icon: FolderKanban },
    { name: '项目回款', href: '/collections', icon: Banknote },
    { name: '奖金分配', href: '/bonus', icon: BarChart3 },
    { name: '数据导入', href: '/upload', icon: UploadIcon },
  ];

  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-4 md:px-6 container mx-auto">
        <div className="flex items-center space-x-2 mr-6">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">
            P
          </div>
          <span className="text-xl font-bold tracking-tight">绩效系统</span>
        </div>
        
        <div className="flex items-center space-x-1 flex-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900" title="退出">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
