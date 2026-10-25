'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsAdmin } from '@/hooks/use-auth';
import { settingsTabSchema } from '@/lib/validation/settings.schema';

import { DepartmentsTab } from './departments-tab';
import { TagsTab } from './tags-tab';
import { UsersTab } from './users-tab';

// On desktop, the panel fills the page height and the table scrolls inside it.
const PANEL_CLASS =
  'flex flex-col overflow-hidden rounded-xl border bg-card md:min-h-0';

/** The Settings page. The tab is in `?tab=users|departments|tags`. */
export function SettingsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = useIsAdmin();
  const tab = settingsTabSchema.parse(searchParams.get('tab') ?? undefined);

  function changeTab(nextTab: string) {
    // Each tab has its own filters, so the other query parameters are not kept.
    router.replace(`/settings?tab=${nextTab}`, { scroll: false });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:min-h-0">
      <PageHeader
        title="Settings"
        description={
          isAdmin
            ? 'Manage the users, departments and tags of EEMW Documents.'
            : 'Only admins can change the settings. You can see them.'
        }
      />
      <Tabs value={tab} onValueChange={changeTab} className="gap-4 md:min-h-0 md:flex-1">
        <TabsList variant="line" className="h-9 gap-4 border-b border-border">
          <TabsTrigger value="users" className="px-0.5">
            Users
          </TabsTrigger>
          <TabsTrigger value="departments" className="px-0.5">
            Departments
          </TabsTrigger>
          <TabsTrigger value="tags" className="px-0.5">
            Tags
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className={PANEL_CLASS}>
          <UsersTab />
        </TabsContent>
        <TabsContent value="departments" className={PANEL_CLASS}>
          <DepartmentsTab />
        </TabsContent>
        <TabsContent value="tags" className={PANEL_CLASS}>
          <TagsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
