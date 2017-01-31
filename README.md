# Queue-Jobs

### A simple in-memory job queue with arbitrary concurrency.

Queue any number of jobs, execute *n* of them at a time, and by notified when the queue is empty.

## Installation

```sh
# npm install queue-jobs
```

## Quick usage

```ts

const Queue = require('queue-jobs');

const q = new Queue(3); // execute at most 3 jobs concurrently;

for (let i = 0; i < 100; i++ ) {
	q.do( () =>  // make sure your job returns a promise.
		doSomethingSlow(i)
		.then( () => { console.log('slow job done!') })
	);
}

q.whenDone()
.then( () => {
	console.log('all jobs completed!');
})

```

## API

### constructor()

```ts
new Queue(concurrency: number): Queue
```

Returns a new job queue that will run jobs with the specified concurrency.

### Queue#do()

```ts
queue.do( job: () => Promise ): Promise
```

Schedules a job on the queue. Your job should return a promise; this is how the
queue knows when it is finished.

Returns a promise that resolves when your job has been *dispatched*. This is useful
for using in the `_write` method of a WritableStream implementation.

### Queue#doSync()

```ts
queue.doAsync( job: () => any ): Promise
```

Schedules a job on the queue. Your job will be considered to be finished as soon as
it returns (the queue won't wait for a returned promise to resolve).

Returns a promise that resolves when your job has been dispatched.

### Queue#whenEmpty()

```ts
queue.whenEmpty(): Promise
```

Returns a promise that resolves when the queue has finished all jobs and no jobs remain to process.
This only waits for the queue to be completely empty, it does not keep track of the jobs that were
schedules when `whenEmpty` was called. To illustrate:

```ts

t = 0;

for (let i = 0; i < 50; i++ ) {
	queue.do( () =>
		doSomethingSlow(i)
		.then( () => {
			t++;
		})
	);
}

queue.whenEmpty()
.then( () => console.log(`t is ${t}`));

for (let i = 50; i < 100; i++ ) {
	queue.do( () =>
		doSomethingSlow(i)
		.then( () => {
			t++;
		})
	);
}

// prints 't is 100';

```
