export declare const JobService: {
    create: (data: any) => import(".prisma/client").Prisma.Prisma__JobClient<{
        id: string;
        command: string;
        state: string;
        attempts: number;
        maxRetries: number;
        createdAt: Date;
        updatedAt: Date;
        nextRunAt: Date;
    }, never, import("@prisma/client/runtime/library.js").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    getNextJob: () => import(".prisma/client").Prisma.Prisma__JobClient<{
        id: string;
        command: string;
        state: string;
        attempts: number;
        maxRetries: number;
        createdAt: Date;
        updatedAt: Date;
        nextRunAt: Date;
    } | null, null, import("@prisma/client/runtime/library.js").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updateState: (id: string, state: string) => import(".prisma/client").Prisma.Prisma__JobClient<{
        id: string;
        command: string;
        state: string;
        attempts: number;
        maxRetries: number;
        createdAt: Date;
        updatedAt: Date;
        nextRunAt: Date;
    }, never, import("@prisma/client/runtime/library.js").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    incrementAttempts: (id: string, attempts: number) => import(".prisma/client").Prisma.Prisma__JobClient<{
        id: string;
        command: string;
        state: string;
        attempts: number;
        maxRetries: number;
        createdAt: Date;
        updatedAt: Date;
        nextRunAt: Date;
    }, never, import("@prisma/client/runtime/library.js").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    scheduleNextRun: (id: string, delay: number) => import(".prisma/client").Prisma.Prisma__JobClient<{
        id: string;
        command: string;
        state: string;
        attempts: number;
        maxRetries: number;
        createdAt: Date;
        updatedAt: Date;
        nextRunAt: Date;
    }, never, import("@prisma/client/runtime/library.js").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
};
//# sourceMappingURL=job.service.d.ts.map