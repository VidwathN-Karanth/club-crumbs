/**
 * Product limits, in one place so they can be tuned with a single edit rather
 * than hunted across the codebase. (A DB-backed settings table would let us
 * tune without a redeploy; not worth it until we actually retune these often.)
 */

/** Quick launchers + courses share one workspace, so the cap is combined. */
export const MAX_LAUNCHER_COURSE_ITEMS = 20;

/** Tasks a single user may create in one calendar day. */
export const MAX_TASKS_PER_DAY = 40;

/** Warn the user this many tasks in, before the hard cap blocks them. */
export const TASK_SOFT_WARN = 35;

/** Tasks older than this (days) are archived and purged by the weekly cron. */
export const TASK_RETENTION_DAYS = 7;

/**
 * Chat retention (days), applied by the weekly cron: removed messages are
 * hard-deleted, and images older than this are dropped from Supabase storage.
 * Pinned messages are never touched.
 */
export const CHAT_RETENTION_DAYS = 90;
