Below is a polished **README.md** that includes exactly the 4 things required:

✅ Setup Instructions
✅ Usage Examples
✅ Architecture Overview
✅ Assumptions & Trade-Offs

Everything is written clearly and professionally for an internship submission.

---

# 🚀 **QueueCTL — Background Job Queue System**

QueueCTL is a command-line background job queue system built in **Node.js + TypeScript + Prisma (SQLite)**.
It supports job persistence, parallel workers, retries with exponential backoff, and a Dead Letter Queue (DLQ).

This project is part of the **Backend Developer Internship Assignment**.

---

# 📥 **1. Setup Instructions**

### **Prerequisites**

* Node.js 18+
* npm or yarn
* SQLite (bundled, no installation needed)

---

### **Clone Repository**

```bash
git clone https://github.com/<your-username>/queuectl
cd queuectl
```

---

### **Install Dependencies**

```bash
npm install
```

---

### **Setup Database**

```bash
npx prisma migrate dev
```

(Optional: view DB)

```bash
npx prisma studio
```

---

### **Build the Project**

```bash
npm run build
```

---

### **Link CLI Globally**

```bash
npm link
```

---

### **Test Installation**

```bash
queuectl --help
```

If you see the CLI help menu, your installation is correct.

---

# 🧪 **2. Usage Examples**

Below are working, tested CLI examples for QueueCTL.

---

## **Enqueue a Job**

```bash
queuectl enqueue '{"command":"echo Hello World"}'
```

Output:

```
Job enqueued with ID: job_1731591102
```

---

## **Start Workers**

Start 3 workers:

```bash
queuectl worker start --count 3
```

Worker log example:

```
[Worker 1] Processing job job_1
[Worker 1] Job completed
```

---

## **Stop Workers**

```bash
queuectl worker stop
```

---

## **Show System Status**

```bash
queuectl status
```

Output:

```
Pending: 4
Processing: 1
Completed: 10
Failed: 0
Dead (DLQ): 2
Active Workers: 3
```

---

## **List Jobs by State**

```bash
queuectl list --state pending
```

---

## **Dead Letter Queue**

### List DLQ jobs:

```bash
queuectl dlq list
```

### Retry a DLQ Job:

```bash
queuectl dlq retry job_17221
```

---

## **Update Config**

```bash
queuectl config set maxRetries 5
queuectl config set backoffBase 2
```

---

# 🧩 **3. Architecture Overview**

QueueCTL internally consists of **four main subsystems**.

---

## **(A) Job Storage Layer (Prisma + SQLite)**

Tables:

| Table    | Purpose                                          |
| -------- | ------------------------------------------------ |
| `Job`    | Stores active/pending/processing/completed jobs  |
| `DLQJob` | Permanently failed jobs                          |
| `Config` | Runtime config (retry count, backoff base, etc.) |

Each job contains:

* command
* attempts count
* max retries
* state
* timestamps

---

## **(B) Worker Engine**

Each worker is an independent process that:

1. Pulls the next **pending** job

2. Acquires a lock by updating state → `processing`

3. Executes job using `child_process.exec`

4. Handles completion or failure

5. Applies exponential backoff:

   ```
   delay = backoffBase ^ attempts
   ```

6. Moves job to DLQ after final failure

7. Waits & polls again

Workers run in parallel safely because they lock jobs atomically via DB.

---

## **(C) Retry + Backoff System**

Successful job → `completed`
Failed job:

* `attempts++`
* If attempts < max → rescheduled with delay
* Else → moved to DLQ (state `dead`)

---

## **(D) CLI Layer**

Built on **Commander.js**, the CLI wraps all features:

* queuectl enqueue
* queuectl worker start
* queuectl list
* queuectl dlq
* queuectl status
* queuectl config

The CLI calls the service layer which interacts with Prisma.

---

# 📌 **4. Assumptions & Trade-Offs**

To keep this project clean, realistic, and within internship scope, the following choices were made:

---

## **Assumptions**

### **1. SQLite is sufficient for persistence**

* For a local CLI tool, SQLite offers reliability without external dependencies.

### **2. Commands are simple shell commands**

* Unlike full distributed systems like Celery, this CLI assumes local shell commands (echo, sleep, node scripts).

### **3. Workers run locally**

* No cluster/distributed worker environment required unless extended.

### **4. Queue is FIFO**

* No priority queues unless implemented as bonus.

---

## **Trade-Offs**

### **1. SQLite chosen over PostgreSQL**

**Trade-off:**
✔ Simpler setup
✔ Fast for local apps
✖ Less suitable for high-concurrency or distributed scaling

---

### **2. Polling-based worker scheduling**

Workers use interval polling instead of real message broker like Redis.

**Trade-off:**
✔ Easy to understand
✔ No additional infra
✖ Slightly higher latency compared to pub/sub

---

### **3. Child process execution**

Using `exec()` is simple but not ideal for:

* memory-heavy commands
* long-running system tasks

---

### **4. No priority queue**

Kept intentionally simple unless bonus features are required.

---

### **5. No sandboxing for commands**

Commands run on host machine — safe for local testing but not for multi-tenant systems.

--