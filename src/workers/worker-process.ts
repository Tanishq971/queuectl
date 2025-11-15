import { JobService } from "../services/job.service";
import runCommand from "../utils/exec";

async function processJob() {
  const job = await JobService.getNextJob();

  if (!job) return;

  await JobService.updateState(job.id, "processing");

  try {
    await runCommand(job.command);
    await JobService.updateState(job.id, "completed");
  } catch (e) {

    const attempts = job.attempts + 1;

    if (attempts > job.maxRetries) {
      await JobService.updateState(job.id, "dead");
      console.log("Moved to DLQ:", job.id);
      return;
    }

    await JobService.incrementAttempts(job.id, attempts);

    const delay = 2 ** attempts;
    await JobService.scheduleNextRun(job.id, delay);

    await JobService.updateState(job.id, "failed");

    console.log(`Retry in ${delay}s`);
  }
}

// run job every 1 second
setInterval(processJob, 1000);
