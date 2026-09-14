'use client';

import { useLeader } from '@/app/leader/LeaderContext';

import ChatLauncher from './ChatLauncher';

/**
 * The leader console's chat launcher. Reads the leader's fixed club from
 * context and opens the manager panel for it (post + edit/delete own messages).
 * Must be mounted inside LeaderProvider.
 */
export default function LeaderChatLauncher() {
  const { cohort } = useLeader();
  return <ChatLauncher manage cohort={cohort} />;
}
