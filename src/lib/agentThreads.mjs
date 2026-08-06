export function appendAgentMessage(threads, agentId, message) {
  return {
    ...threads,
    [agentId]: [...(threads[agentId] ?? []), message],
  };
}

export function ensureAgentThread(threads, agentId, greeting) {
  if (threads[agentId]?.length) return threads;
  return { ...threads, [agentId]: [greeting] };
}
