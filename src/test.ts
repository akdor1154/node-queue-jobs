///<reference types="mocha" />

import Queue = require('./queue');
import assert = require('assert');

function wait(ms: number) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, ms);
	});
}

describe('Queue', () => {
	it('should execute all immediate tasks sequentially', () => {
		const q = new Queue(1);

		const results: number[] = [];
		for (let i = 0; i < 10; i++) {
			q.doAsync(() => results.push(i));
		}

		return q.whenEmpty()
		.then( () => {
			assert.deepStrictEqual(results, [0,1,2,3,4,5,6,7,8,9]);
		});
	})

	it('should execute all asynchronous tasks sequentially', () => {
		const q = new Queue(1);

		const timeStart = Date.now();

		const results: number[] = [];
		for (let i = 0; i < 10; i++) {
			q.do(() =>
				wait(5)
				.then( () => {
					results.push(i)
				}
			));
		}


		return q.whenEmpty()
		.then( () => {
			const timeEnd = Date.now();
			const timeElapsed = timeEnd - timeStart;

			assert(timeElapsed > 5*10, 'too fast to have been sequential');
			assert.deepStrictEqual(results, [0,1,2,3,4,5,6,7,8,9]);
		});
	});

	it('should execute a mix of immediate and async tasks sequentially', () => {
		const q = new Queue(1);

		const results: number[] = [];
		for (let i = 0; i < 10; i++) {
			if (i % 2 === 0) {
				q.doAsync(() => results.push(i));
			} else {
				q.do(() =>
					Promise.resolve()
					.then( () => {
						results.push(i)
					}
				));
			}

		}

		return q.whenEmpty()
		.then( () => {
			assert.deepStrictEqual(results, [0,1,2,3,4,5,6,7,8,9]);
		});
	})

	it('should execute async tasks in parallel', () => {
		const q = new Queue(4);

		const timeStart = Date.now();
		const results: number[] = [];
		for (let i = 0; i < 10; i++) {
			q.do(() =>
				wait(5)
				.then( () => {
					results.push(i)
				}
			));
		}

		return q.whenEmpty()
		.then( () => {
			const timeEnd = Date.now();	
			const timeElapsed = timeEnd - timeStart;

			// each task takes 5 ms to complete, so if our total time for 10 tasks is much less
			// than 5 ms * 10 tasks then we can be sure there was some execution happening in
			// parallel.
			assert(timeElapsed < 5*10 * 0.5, 'Executed too slow to be sure it was in parallel');

			assert.deepStrictEqual(results.sort(), [0,1,2,3,4,5,6,7,8,9]);
		});
	})
})