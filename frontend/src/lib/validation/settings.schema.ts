import { z } from 'zod';

export const SETTINGS_TABS = ['users', 'departments', 'tags'] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

/** The tab in `?tab=` of the Settings page. A value that is not valid shows the users. */
export const settingsTabSchema = z.enum(SETTINGS_TABS).catch('users');
