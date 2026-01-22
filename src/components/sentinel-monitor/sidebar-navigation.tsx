'use client';

import Link from 'next/link';
import { SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar';
import { Satellite, FileText, Mail, Waves, Leaf } from 'lucide-react';
import { PROJECTS } from '@/lib/projects';

const staticItems = [
    { id: 'research', name: 'Methodology & Research', href: '/?view=research', icon: <FileText /> },
    { id: 'contact', name: 'Kontakt', href: '/?view=contact', icon: <Mail /> },
]

export default function SidebarNavigation({ activeView, visualProof }: { activeView: string, visualProof: React.ReactNode | null }) {
  const snowProject = PROJECTS.find(p => p.id === 'snow-watch');
  const lakeProjects = PROJECTS.filter(p => p.id.includes('lake'));
  const vineyardProjects = PROJECTS.filter(p => p.id.includes('vineyard'));

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
          {snowProject && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={activeView === snowProject.id}>
                <Link href={`/?view=${snowProject.id}`}>
                  <Satellite />{snowProject.name}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          
          <SidebarSeparator className="my-2" />

          <div className="px-3 py-2">
            <h3 className="text-sm font-semibold text-sidebar-foreground/70 flex items-center gap-2">
              <Waves className="size-4" />
              Lake Quality Monitor
            </h3>
          </div>
          {lakeProjects.map(project => (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton asChild isActive={activeView === project.id} size="sm" className="ml-4">
                <Link href={`/?view=${project.id}`}>
                  {project.name}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          <SidebarSeparator className="my-2" />

            <div className="px-3 py-2">
                <h3 className="text-sm font-semibold text-sidebar-foreground/70 flex items-center gap-2">
                <Leaf className="size-4" />
                Vineyard Precision Guard
                </h3>
            </div>
            {vineyardProjects.map(project => (
                <SidebarMenuItem key={project.id}>
                <SidebarMenuButton asChild isActive={activeView === project.id} size="sm" className="ml-4">
                    <Link href={`/?view=${project.id}`}>
                    {project.name}
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            ))}


          <SidebarSeparator className="my-2" />

          {staticItems.map((item) => (
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
