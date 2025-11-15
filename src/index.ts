#!/usr/bin/env node
import express from "express"
import dotenv from "dotenv"
import { Command } from "commander";
import worker from "./cli/worker.js";
import { JobService } from "./services/job.service.js";
import status from "./cli/status.js";
import list from "./cli/list.js";
import { findById  , listByState , resetJob} from "./cli/dlq.js";

dotenv.config();


//variables
const app = express();
const PORT = process.env.PORT || 4000;
const program = new Command();


program.name("queuectl").description("This is the cli based job processor.").version("0.0.1");

program.command('enqueue <job>').description('insert jobs').action(async (job)=>{
    try{
        const data = JSON.parse(job);

        if(!data.command){
            console.error("command required!");
            process.exit(1);
        }
      JobService.create(data);
      
    }catch(e){

    }
})


program
  .command("worker")
  .description("To start workers")
  .command("start")
  .option("-c, --count <number>", "Number of workers to start", "1")
  .action(async (options) => {
    const count = parseInt(options.count, 10);

    if (isNaN(count) || count < 1) {
      console.error("count must be a positive integer");
      process.exit(1);
    }

    console.log(`Starting ${count} workers...`);

    for (let i = 0; i < count; i++) {
      worker("start");  // run worker here
    }
  });

  program.command('status').description('Shows the status of all jobs and workers').action(()=>{
        status()
  })

program
  .command("list")
  .description("List jobs by state")
  .option("-s, --state <state>", "State of jobs (queued|processing|failed|completed|dead)", "queued")
  .action(async (options) => {
    const { state } = options;

    const validStates = ["queued", "processing", "failed", "completed", "dead"];

    if (!validStates.includes(state)) {
      console.error("Invalid state provided!");
      process.exit(1);
    }

    try {
      const jobs = await list(state);

      if (jobs.length === 0) {
        console.log(`No jobs found with state: ${state}`);
        return;
      }

      console.log(`Jobs in state: ${state}`);
      jobs.forEach((job : any)=> {
        console.log(`- ID: ${job.id} | Command: ${job.command} | Attempts: ${job.attempts}`);
      });

    } catch (err) {
      console.error("Error listing jobs", err);
      process.exit(1);
    }
  });


program
  .command("dlq")
  .description("Dead Letter Queue commands")
  .command("list")
  .description("List all jobs in the Dead Letter Queue")
  .action(async () => {
    const jobs = await listByState();

    if (jobs.length === 0) {
      console.log("No jobs in the Dead Letter Queue.");
      return;
    }

    console.table(
      jobs.map((j:any) => ({
        ID: j.id,
        Command: j.command,
        Attempts: j.attempts,
        LastError: j.lastError,
      }))
    );
  });

program
  .command("dlq retry <jobId>")
  .description("Retry a dead letter job")
  .action(async (jobId: string) => {
    try {
      const job = await findById(jobId);

      if (!job || job.state !== "dead") {
        console.error("Job not found in DLQ");
        return;
      }

      await resetJob(jobId);
      console.log(`Job ${jobId} moved back to queue and will retry again.`);
    } catch (err) {
      console.error("Failed to retry DLQ job:", err);
    }
  });



//server routes
app.get("/" , (req , res) =>{
    res.send('Hello Server');
})

app.listen(PORT , () =>{
    console.log("Server Started at port no 3000")
})
