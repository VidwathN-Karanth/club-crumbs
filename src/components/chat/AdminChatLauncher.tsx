'use client';

import { useAdmin } from '@/app/admin/AdminContext';

import ChatLauncher from './ChatLauncher';

/**
 * The admin console's chat launcher. Follows the console's currently-selected
 * club and opens the manager panel with full moderation (an admin may edit or
 * delete anyone's message). Must be mounted inside AdminProvider.
 */
export default function AdminChatLauncher() {
  const { selectedCohort } = useAdmin();
  return <ChatLauncher manage cohort={selectedCohort} isAdmin />;
}
