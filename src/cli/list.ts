import client from "../client.js";

export default async function list(state : string){
    const data = await client.job.findMany({
        where:{
            state
        },
        orderBy:{
            createdAt:'desc'
        }
    })

    return data;
}