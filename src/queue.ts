import { queue } from 'async';

import { delay } from './delay';
import { retry } from './retry';

export type ProvidersQueueResult<P, T> = {
  running: () => number;
  finish: () => Promise<void>;
  kill: () => void;
  push: (task: P) => Promise<void>;
};

export function providersQueue<P, T>(
  handle: (task: P, provider: T) => Promise<unknown>,
  providers: T[]
): ProvidersQueueResult<P, T> {
  if (!providers.length) throw new Error('No providers');

  let counter = 0;
  let goodProviders = [...providers];
  let availableProviders = [...providers];
  let unfinishedTasks: P[] = [];

  const queueObject = queue<{
    task: P;
    provider: T;
  }>((task, callback) => {
    retry(() => handle(task.task, task.provider), { wait: 30 * 1000, attempts: 3 })
      .then(() => callback())
      .catch((e) => callback(e));
  }, providers.length);

  async function push(task: P) {
    unfinishedTasks = [...unfinishedTasks, task];

    let provider: T;

    // wait until provider is released
    while (true) {
      if (goodProviders.length === 0) {
        throw new Error('No good providers any more');
      }

      provider = availableProviders[counter % availableProviders.length];
      availableProviders = availableProviders.filter((p) => p !== provider);
      if (provider) {
        counter++;
        break;
      }
      await delay(5);
    }

    queueObject.push({ task, provider }, (err) => {
      if (err) {
        console.error('Excluding provider due to max number of attempts', err);
        goodProviders = goodProviders.filter((p) => p !== provider);
        availableProviders = availableProviders.filter((p) => p !== provider);
        queueObject.concurrency = goodProviders.length;
      } else {
        availableProviders.push(provider);
        unfinishedTasks = unfinishedTasks.filter((t) => t !== task);
      }
    });
  }

  async function finish() {
    if (queueObject.running()) {
      await queueObject.drain();
    }

    while (unfinishedTasks.length > 0) {
      await delay(500);
    }
  }

  return {
    push: push,
    finish: finish,
    kill: () => queueObject.kill(),
    running: () => queueObject.running(),
  };
}
