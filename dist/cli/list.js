import client from "../client.js";
export default async function list(state) {
    const data = await client.job.findMany({
        where: {
            state
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return data;
}
//# sourceMappingURL=list.js.map