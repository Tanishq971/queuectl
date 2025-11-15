export default function list(state: string): Promise<{
    id: string;
    command: string;
    state: string;
    attempts: number;
    maxRetries: number;
    createdAt: Date;
    updatedAt: Date;
    nextRunAt: Date;
}[]>;
//# sourceMappingURL=list.d.ts.map