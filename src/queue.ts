
class Queue {
	
	private	_workers: WorkToken[]
	private _waiters: {resolve: (w: WorkToken) => void}[];
	private _emptyWaiters: {resolve: () => void}[];

	constructor(numWorkers: number ) {
		this._workers = Array(numWorkers).fill(null).map( () => new WorkToken(this) );
		this._waiters = [];
		this._emptyWaiters = [];
	}

	private _waitForFreeWorker(): Promise<WorkToken> {
		const freeWorkToken = this._tryGetFreeWorker();
		if (freeWorkToken) return Promise.resolve(freeWorkToken);

		return new Promise((resolve, _reject) => {
			this._waiters.push( {resolve} );
		});
	}

	private _tryGetFreeWorker(): WorkToken | undefined {
		const freeWorkToken = this._workers.find( (worker) => !worker.busy);
		if (! freeWorkToken) return;
		else {
			freeWorkToken.lock();
			return freeWorkToken;
		}
	}

	do(f: () => Promise<any> ): Promise<void>  {
		const waitForWorker = this._waitForFreeWorker();
		waitForWorker
		.then( (worker) => {
			return f()
			.catch( (e) => {})
			.then( () => {
				worker.unlock();
			});
		});

		return waitForWorker.then( () => {});
	}

	doAsync( f: () => any  ): Promise<void>  {
		const waitForWorker = this._waitForFreeWorker();
		waitForWorker
		.then( (worker) => {
			try {
				f();
			} finally {
				worker.unlock();
			}
		});

		return waitForWorker.then( () => {});
	}

	whenEmpty(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this._emptyWaiters.push({resolve});
		});
	}

	_checkWorkers() {
		let waiter;
		while ( this._waiters.length > 0 ) {
			const worker = this._tryGetFreeWorker();
			if (!worker) break;

			const waiter = this._waiters.shift()!;
			waiter.resolve(worker);
		}

		if ((this._waiters.length === 0)) {
			if ( this._workers.find( (w) => w.busy) ) {
				return;
			}
			let emptyWaiter;
			while ( (emptyWaiter = this._emptyWaiters.shift()) ) {
				emptyWaiter.resolve();
			}
		}
	}
}

class WorkToken {
	
	busy: boolean;
	queue: Queue;

	constructor(queue: Queue ) {
		this.queue = queue;
	}

	lock() {
		this.busy = true;
	}

	unlock() {
		this.busy = false;
		this.queue._checkWorkers();
	}
}

export = Queue;

