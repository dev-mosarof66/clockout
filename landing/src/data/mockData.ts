import { WorkApp } from '../types';

export const INITIAL_WORK_APPS: WorkApp[] = [
  { id: 'slack', name: 'Slack', iconName: 'Slack', category: 'Chat & Communication', isSelected: true },
  { id: 'teams', name: 'MS Teams', iconName: 'MessageSquareText', category: 'Chat & Communication', isSelected: true },
  { id: 'gmail', name: 'Gmail', iconName: 'Mail', category: 'Mail', isSelected: true },
  { id: 'outlook', name: 'Outlook', iconName: 'Inbox', category: 'Mail', isSelected: false },
  { id: 'jira', name: 'Jira', iconName: 'Layers', category: 'Project Management', isSelected: false },
  { id: 'notion', name: 'Notion', iconName: 'Notebook', category: 'Knowledge Base', isSelected: true },
  { id: 'github', name: 'GitHub', iconName: 'Github', category: 'Developer Tools', isSelected: false },
];

export const SMART_SUGGESTIONS: WorkApp[] = [
  { id: 'figma', name: 'Figma', iconName: 'Palette', category: 'Design', isSelected: false, isSuggested: true },
  { id: 'linear', name: 'Linear', iconName: 'CheckSquare', category: 'Project Management', isSelected: false, isSuggested: true },
  { id: 'zoom', name: 'Zoom', iconName: 'Video', category: 'Meetings', isSelected: false, isSuggested: true },
  { id: 'calendar', name: 'Google Calendar', iconName: 'Calendar', category: 'Calendar', isSelected: false, isSuggested: true },
];

// NOTE: No seeded "waitlist" here. Phase 0 social proof must reflect REAL signups
// only (playbook §2.1, §7) — fabricated subscribers are a false-validation trap and
// a reputational/legal risk. The live "Join N" counter starts from VITE_WAITLIST_BASE.
