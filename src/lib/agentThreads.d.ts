export declare function appendAgentMessage<T>(threads: Record<string, T[]>, agentId: string, message: T): Record<string, T[]>;
export declare function ensureAgentThread<T>(threads: Record<string, T[]>, agentId: string, greeting: T): Record<string, T[]>;
