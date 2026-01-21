'use client';

import Link from 'next/link';
import { SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Satellite } from 'lucide-react';
import type { Project } from '@/lib/types';

type SidebarNavigationProps = {
  projects: Project[];
  activeProjectId: string;
};

export default function SidebarNavigation({ projects, activeProjectId }: SidebarNavigationProps) {
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Satellite className="size-6 text-primary" />
            <h2 className="text-lg font-semibold text-primary">Copernicus Monitor</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {projects.map((project) => (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton asChild isActive={activeProjectId === project.id}>
                <Link href={`/?project=${project.id}`}>{project.name}</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
