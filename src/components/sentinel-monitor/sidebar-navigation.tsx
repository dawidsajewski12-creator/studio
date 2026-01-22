'use client';

import Link from 'next/link';
import { SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Satellite, FileText, Mail, Waves } from 'lucide-react';

const navigationItems = [
    { id: 'snow-watch', name: '🏔️ Alpine Snow Watch', href: '/?view=snow-watch', icon: <Satellite /> },
    { id: 'lake-quality', name: '💧 Lake Quality Monitor', href: '/?view=lake-quality', icon: <Waves /> },
    { id: 'research', name: '📄 Methodology & Research', href: '/?view=research', icon: <FileText /> },
    { id: 'contact', name: '📧 Kontakt', href: '/?view=contact', icon: <Mail /> },
]

export default function SidebarNavigation({ activeView, visualProof }: { activeView: string, visualProof: React.ReactNode | null }) {

  return (
    <>
      <SidebarHeader>
        <div className="flex flex-col items-start gap-2">
            <div className='flex items-center gap-2'>
                <Satellite className="size-6 text-primary" />
                <h2 className="text-lg font-semibold text-primary">Satellite Insights</h2>
            </div>
            <p className="text-xs text-muted-foreground ml-1">by a GIS Specialist</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild isActive={activeView === item.id}>
                <Link href={item.href}>{item.icon}{item.name}</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        {visualProof}
      </SidebarContent>
    </>
  );
}
