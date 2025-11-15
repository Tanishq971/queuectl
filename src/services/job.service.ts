import client from "../client.js";

export const JobService = {
    create : (data : any) => client.job.create({data:{
        command:data.command
    }}),
    getNextJob:()=>
        client.job.findFirst({
            where:{
                state:"pending"
            },
            orderBy:{
                createdAt:"asc"
            }
        })
    ,
    updateState: (id:string , state:string)=>
        client.job.update({
            where:{
                id
            },
            data:{
                state
            }
        }),
    incrementAttempts:(id:string , attempts:number) =>
        client.job.update({
            where:{
                id
            },
            data:{
                attempts
            }
        }),
        scheduleNextRun:(id:string , delay:number)=>
            client.job.update({
                where:{
                    id
                },
                data:{
                    nextRun: new Date(Date.now() + delay*1000)
                }
            })
}