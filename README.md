# QueueCTL — Complete Project (TypeScript, Express, Prisma)

This document contains the complete project files for **QueueCTL**, a CLI-based background job queue written in TypeScript using Express and Prisma. Copy each file into your project and run the install/build steps in the README (below).

---

## File: package.json

```json
{
  "name": "one",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "queuectl": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init"
  },
  "dependencies": {
    "commander": "^14.0.2",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "@prisma/client": "^6.19.0"
  },
  "devDependencies": {
    "prisma": "^6.19.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.9.3",
    "@types/node": "^24.10.1",
    "@types/express": "^5.0.5"
  }
}
```

---

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "preserveShebang": true
  },
  "include": ["src"]
}
```

---

## File: .env.example

```
PORT=4000
DATABASE_URL="file:./dev.db"
BACKOFF_BASE=2
DEFAULT_MAX_RETRIES=3
```

---

## File: prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Job {
  id         String   @id @default(cuid())
  command    String
  state      String   @default("pending")
  attempts   Int      @default(0)
  maxRetries Int      @default(3)
  lastError  String?  
  nextRunAt  DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

## File: src/client.ts

```ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
```

---

## File: src/utils/exec.ts

```ts
import { exec } from "child_process";

export default function runCommand(cmd: string, timeoutMs?: number): Promise<{ stdout: string; stderr: string }>{
  return new Promise((resolve, reject) => {
    const p = exec(cmd, { shell: '/bin/bash', timeout: timeoutMs ?? 0 }, (error, stdout, stderr) => {
      if (error) return reject({ error, stdout: stdout.toString(), stderr: stderr.toString() });
      resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
    });
  });
}
```

---

## File: src/services/job.service.ts

```ts
import { prisma } from "../client";
import { Job } from "@prisma/client";

export const JobService = {
  async create(data: Partial<Job>) {
    return prisma.job.create({ data: {
      command: data.command as string,
      maxRetries: data.maxRetries ?? Number(process.env.DEFAULT_MAX_RETRIES ?? 3),
    }});
  },

  async getNextJob(): Promise<Job | null> {
    // pick the oldest pending job whose nextRunAt <= now
    return prisma.job.findFirst({
      where: {
        state: "pending",
        nextRunAt: { lte: new Date() }
      },
      orderBy: { createdAt: 'asc' }
    });
  },

  async updateState(id: string, state: string) {
    return prisma.job.update({ where: { id }, data: { state } });
  },

  async incrementAttempts(id: string, attempts: number) {
    return prisma.job.update({ where: { id }, data: { attempts } });
  },

  async scheduleNextRun(id: string, delaySec: number) {
    return prisma.job.update({ where: { id }, data: { nextRunAt: new Date(Date.now() + delaySec * 1000) } });
  },

  async listByState(state: string) {
    return prisma.job.findMany({ where: { state }, orderBy: { createdAt: 'desc' } });
  },

  async findById(id: string) {
    return prisma.job.findUnique({ where: { id } });
  },

  async resetJob(id: string) {
    return prisma.job.update({ where: { id }, data: { state: 'pending', attempts: 0, nextRunAt: new Date(), lastError: null } });
  }
};
```

---

## File: src/workers/worker-process.ts

```ts
import { JobService } from "../services/job.service";
import runCommand from "../utils/exec";

const BACKOFF_BASE = Number(process.env.BACKOFF_BASE ?? 2);
const POLL_INTERVAL_MS = 1000;

async function processOne() {
  const job = await JobService.getNextJob();
  if (!job) return;

  // set processing (optimistic; in production you'd want row locking)
  await JobService.updateState(job.id, 'processing');

  try {
    await runCommand(job.command);
    await JobService.updateState(job.id, 'completed');
    console.log(`[worker:${process.pid}] completed ${job.id}`);
  } catch (err: any) {
    const attempts = (job.attempts ?? 0) + 1;

    const reason = err?.error?.message ?? err?.stderr ?? String(err);

    if (attempts > job.maxRetries) {
      await JobService.updateState(job.id, 'dead');
      await JobService.incrementAttempts(job.id, attempts);
      console.log(`[worker:${process.pid}] moved ${job.id} to DLQ; reason: ${reason}`);
      return;
    }

    await JobService.incrementAttempts(job.id, attempts);
    const delay = BACKOFF_BASE ** attempts; // exponential backoff
    await JobService.scheduleNextRun(job.id, delay);
    await prisma.job.update({ where: { id: job.id }, data: { lastError: reason, state: 'failed' } });

    console.log(`[worker:${process.pid}] job ${job.id} failed, will retry in ${delay}s`);
  }
}

setInterval(processOne, POLL_INTERVAL_MS);

console.log(`Worker process started pid=${process.pid}`);
```

---

## File: src/cli/worker.ts

```ts
import { spawn } from 'child_process';
import path from 'path';

export default function worker(action: string) {
  if (action === 'start') {
    // spawn a child node process that runs the compiled worker file
    const workerPath = path.join(process.cwd(), 'dist', 'workers', 'worker-process.js');
    const w = spawn(process.execPath, [workerPath], { stdio: 'inherit' });
    console.log(`Worker started PID: ${w.pid}`);
  }
}
```

---

## File: src/cli/enqueue.ts

```ts
import { JobService } from "../services/job.service";

export default async function enqueue(raw: string) {
  const data = JSON.parse(raw);
  if (!data.command) throw new Error('command required');
  const job = await JobService.create({ command: data.command, maxRetries: data.max_retries });
  console.log('Enqueued', job.id);
}
```

---

## File: src/cli/list.ts

```ts
import { JobService } from "../services/job.service";
export default async function list(state: string) {
  return JobService.listByState(state);
}
```

---

## File: src/cli/status.ts

```ts
import { prisma } from "../client";

export default async function status() {
  const counts = await prisma.job.groupBy({ by: ['state'], _count: { id: true } });
  console.table(counts.map(c => ({ state: c.state, count: c._count.id })));
}
```

---

## File: src/cli/dlq.ts

```ts
import { JobService } from "../services/job.service";

export async function listByState() {
  return JobService.listByState('dead');
}

export async function findById(id: string) {
  return JobService.findById(id);
}

export async function resetJob(id: string) {
  return JobService.resetJob(id);
}
```

---

## File: src/index.ts

```ts
#!/usr/bin/env node
import express from 'express';
import dotenv from 'dotenv';
import { Command } from 'commander';
import enqueueCmd from './cli/enqueue';
import workerCmd from './cli/worker';
import listCmd from './cli/list';
import statusCmd from './cli/status';
import { listByState, findById, resetJob } from './cli/dlq';
import { prisma } from './client';
import { JobService } from './services/job.service';

dotenv.config();

const app = express();
const program = new Command();

program.name('queuectl').description('CLI job queue').version('0.0.1');

program.command('enqueue <job>').description('Insert a job JSON').action(async (job) => {
  try {
    await enqueueCmd(job);
  } catch (err: any) {
    console.error('enqueue failed:', err.message ?? err);
  }
});

program.command('worker').description('worker commands')
  .command('start')
  .option('-c, --count <number>', 'number of workers', '1')
  .action(async (options) => {
    const cnt = parseInt(options.count, 10);
    if (isNaN(cnt) || cnt < 1) { console.error('invalid count'); process.exit(1); }
    for (let i=0;i<cnt;i++) workerCmd('start');
  });

program.command('list')
  .option('-s, --state <state>', 'state to filter', 'pending')
  .action(async (opts) => {
    const jobs = await listCmd(opts.state);
    if (!jobs.length) console.log('no jobs');
    else console.table(jobs.map(j => ({ id: j.id, command: j.command, state: j.state, attempts: j.attempts })));
  });

program.command('status').action(async ()=> await statusCmd());

program.command('dlq')
  .command('list')
  .action(async () => {
    const rows = await listByState();
    console.table(rows.map(r=>({ id: r.id, command: r.command, attempts: r.attempts, lastError: r.lastError })));
  });

program.command('dlq-retry <id>').description('retry dead job').action(async (id)=>{
  const job = await findById(id);
  if (!job || job.state !== 'dead') { console.error('not in dlq'); return; }
  await resetJob(id);
  console.log('moved to pending');
});

// start express only if not invoked as CLI? We can run server always in background for monitoring
app.get('/', (req, res) => res.send('QueueCTL server running'));
const PORT = process.env.PORT ?? 4000;
app.listen(PORT, ()=>console.log(`server ${PORT}`));

program.parse(process.argv);
```

---

## README / Quick start (copy to README.md)

(See earlier README content included in project root. Use the README the assistant generated previously.)

---

## Notes & gotchas

1. After building, `dist` must contain the compiled files. Use `npm link` or create a symlink to `/usr/local/bin/queuectl` to run globally.
2. When running workers via `worker-start` we spawn `dist/workers/worker-process.js`. Ensure you `yarn build` before spawning.
3. Prisma generate must be run: `yarn prisma generate` then `yarn prisma migrate dev` (if using migrations).

---

If you want, I can also create a zip of the repository or push it to a new GitHub repo for you.```}
