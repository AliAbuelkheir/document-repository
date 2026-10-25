'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsAdmin } from '@/hooks/use-auth';
import { settingsTabSchema } from '@/lib/validation/settings.schema';

import { DepartmentsTab } from './departments-tab';
import { TagsTab } from './tags-tab';
import { UsersTab } from './users-tab';

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
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Settings</h1>
        {!isAdmin && (
          <p className="text-sm text-muted-foreground">
            Only admins can change the settings. You can see them.
          </p>
        )}
      </div>
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="flex flex-col gap-4 pt-2">
          <UsersTab />
        </TabsContent>
        <TabsContent value="departments" className="flex flex-col gap-4 pt-2">
          <DepartmentsTab />
        </TabsContent>
        <TabsContent value="tags" className="flex flex-col gap-4 pt-2">
          <TagsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
