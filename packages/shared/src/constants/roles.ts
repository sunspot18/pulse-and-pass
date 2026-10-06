export const ROLES = ['attendee', 'organizer', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  attendee: 'ATTENDEE PASS',
  organizer: 'EVENT ORGANIZER',
  admin: 'SYSTEM ADMINISTRATOR',
};
