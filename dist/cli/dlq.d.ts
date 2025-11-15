export declare function listByState(): Promise<{
    id: string;
    command: string;
    state: string;
    attempts: number;
    maxRetries: number;
    createdAt: Date;
    updatedAt: Date;
    nextRunAt: Date;
}[]>;
export declare function findById(id: string): Promise<{
    id: string;
    command: string;
    state: string;
    attempts: number;
    maxRetries: number;
    createdAt: Date;
    updatedAt: Date;
    nextRunAt: Date;
} | null>;
export declare function resetJob(id: string): Promise<{
    id: string;
    command: string;
    state: string;
    attempts: number;
    maxRetries: number;
    createdAt: Date;
    updatedAt: Date;
    nextRunAt: Date;
}>;
//# sourceMappingURL=dlq.d.ts.map