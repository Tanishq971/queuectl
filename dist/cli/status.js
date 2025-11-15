import client from "../client.js";
export default async function status() {
    const counts = await client.job.groupBy({
        by: ["state"],
        _count: { id: true }
    });
    console.table(counts);
}
//# sourceMappingURL=status.js.map