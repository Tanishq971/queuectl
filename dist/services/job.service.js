import client from "../client.js";
export const JobService = {
    create: (data) => client.job.create({ data: {
            command: data.command
        } }),
    getNextJob: () => client.job.findFirst({
        where: {
            state: "pending"
        },
        orderBy: {
            createdAt: "asc"
        }
    }),
    updateState: (id, state) => client.job.update({
        where: {
            id
        },
        data: {
            state
        }
    }),
    incrementAttempts: (id, attempts) => client.job.update({
        where: {
            id
        },
        data: {
            attempts
        }
    }),
    scheduleNextRun: (id, delay) => client.job.update({
        where: {
            id
        },
        data: {
            nextRun: new Date(Date.now() + delay * 1000)
        }
    })
};
//# sourceMappingURL=job.service.js.map