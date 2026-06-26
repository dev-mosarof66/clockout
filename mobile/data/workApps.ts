export type WorkApp = {
  id: string;
  name: string;
  category: string;
  color: string; // brand-ish tile color for recognizability
  pkg?: string; // Android package name (so the engine can detect it)
  preselected?: boolean;
};

// Pre-seeded common work apps the user confirms/edits during onboarding.
export const WORK_APPS: WorkApp[] = [
  { id: 'slack', name: 'Slack', category: 'Chat', color: '#4A154B', pkg: 'com.Slack', preselected: true },
  { id: 'teams', name: 'Microsoft Teams', category: 'Chat', color: '#5059C9', pkg: 'com.microsoft.teams', preselected: true },
  { id: 'gmail', name: 'Gmail', category: 'Email', color: '#EA4335', pkg: 'com.google.android.gm', preselected: true },
  { id: 'outlook', name: 'Outlook', category: 'Email', color: '#0F6CBD', pkg: 'com.microsoft.office.outlook' },
  { id: 'jira', name: 'Jira', category: 'Project management', color: '#2684FF', pkg: 'com.atlassian.android.jira.core' },
  { id: 'notion', name: 'Notion', category: 'Docs', color: '#111111', pkg: 'notion.id' },
  { id: 'github', name: 'GitHub', category: 'Development', color: '#1F2328', pkg: 'com.github.android' },
  { id: 'zoom', name: 'Zoom', category: 'Meetings', color: '#2D8CFF', pkg: 'us.zoom.videomeetings' },
  { id: 'linear', name: 'Linear', category: 'Project management', color: '#5E6AD2' },
  { id: 'gcal', name: 'Google Calendar', category: 'Calendar', color: '#1A73E8', pkg: 'com.google.android.calendar' },
];

// package name → friendly name (for labelling engine-detected events).
export const PKG_TO_NAME: Record<string, string> = Object.fromEntries(
  WORK_APPS.filter((a) => a.pkg).map((a) => [a.pkg as string, a.name]),
);
