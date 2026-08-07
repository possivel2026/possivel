export const PLAN_LIMITS={free:{activeListings:5,storageGb:1,callParticipants:4,callDurationMinutes:30},pro:{activeListings:50,storageGb:10,callParticipants:12,callDurationMinutes:120}} as const;
export type Plan='free'|'pro';
