import client from "../client.js";
export async function listByState() {
    return client.job.findMany({
        where: { state: "dead" },
        orderBy: { createdAt: "desc" },
    });
}
export async function findById(id) {
    return client.job.findUnique({ where: { id } });
}
export async function resetJob(id) {
    return client.job.update({
        where: { id },
        data: {
            state: "pending",
            attempts: 0,
            lastError: null,
            runAt: new Date(),
        },
    });
}
//# sourceMappingURL=dlq.js.map