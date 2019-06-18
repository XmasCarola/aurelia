import { ILifecycle, Priority } from '@aurelia/runtime';

export interface QueueItem<T> {
  resolve?: ((value?: void | PromiseLike<void>) => void);
  reject?: ((value?: void | PromiseLike<void>) => void);
  cost?: number;
}

export interface IQueueOptions {
  lifecycle: ILifecycle;
  tickLimit: number;
}

export class Queue<T> {
  public isActive: boolean;
  public readonly pending: QueueItem<T>[];
  public processing: QueueItem<T>;
  public tickLimit: number;
  public unticked: number;
  private readonly callback: (item?: QueueItem<T>) => void;
  private lifecycle: ILifecycle;

  constructor(callback: (item?: QueueItem<T>) => void) {
    this.pending = [];
    this.processing = null;
    this.callback = callback;
    this.tickLimit = null;
    this.unticked = 0;
    this.isActive = false;
  }

  public get length(): number {
    return this.pending.length;
  }

  public activate(options: IQueueOptions): void {
    if (this.isActive) {
      throw new Error('Queue has already been activated');
    }
    this.isActive = true;
    this.lifecycle = options.lifecycle;
    this.tickLimit = options.tickLimit;
    this.lifecycle.enqueueRAF(this.dequeue, this, Priority.preempt);
  }
  public deactivate(): void {
    if (!this.isActive) {
      throw new Error('Queue has not been activated');
    }
    this.lifecycle.dequeueRAF(this.dequeue, this);
    this.tickLimit = null;
    this.clear();
    this.isActive = false;
  }

  public enqueue(itemOrItems: T | T[], costOrCosts?: number | number[]): Promise<void> | Promise<void>[] {
    const list = Array.isArray(itemOrItems);
    const items: T[] = list ? itemOrItems as T[] : [itemOrItems as T];
    const costs: number[] = items
      .map((value, index) => !Array.isArray(costOrCosts) ? costOrCosts : costOrCosts[index])
      .map(value => value !== undefined ? value : 1);
    const promises: Promise<void>[] = [];
    for (const item of items) {
      const qItem: QueueItem<T> = { ...item };
      qItem.cost = costs.shift();
      // tslint:disable-next-line:promise-must-complete
      promises.push(new Promise((resolve, reject) => {
        qItem.resolve = () => {
          resolve();
          this.processing = null;
          this.dequeue();
        };
        qItem.reject = (reason: unknown) => {
          reject(reason);
          this.processing = null;
          this.dequeue();
        };
      }));
      this.pending.push(qItem);
    }
    this.dequeue();
    return list ? promises : promises[0];
  }

  public dequeue(delta?: number): void {
    if (this.processing !== null) {
      return;
    }
    if (delta !== undefined) {
      this.unticked = 0;
    }
    if (!this.pending.length) {
      return;
    }
    if (this.tickLimit !== null && delta === undefined && this.unticked + this.pending[0].cost > this.tickLimit) {
      return;
    }
    this.processing = this.pending.shift();
    this.unticked += this.processing.cost;
    this.callback(this.processing);
  }

  public clear(): void {
    this.pending.splice(0, this.pending.length);
  }
}
