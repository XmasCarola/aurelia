import { TaskQueue } from '@aurelia/platform';
import { IDisposable, IServiceLocator } from '@aurelia/kernel';
import { type Scope } from '@aurelia/runtime';
import { BindingMode } from '@aurelia/template-compiler';
import { State } from '../templating/controller';

/** @internal */ export const { default: defaultMode, oneTime, toView, fromView, twoWay } = BindingMode;
export { BindingMode } from '@aurelia/template-compiler';

export interface IBindingController {
  readonly state: State;
}

export interface IBinding {
  readonly isBound: boolean;
  bind(scope: Scope): void;
  unbind(): void;
  get: IServiceLocator['get'];
  useScope?(scope: Scope): void;
  limit?(opts: IRateLimitOptions): IDisposable;
}

export interface IRateLimitOptions {
  type: 'throttle' | 'debounce';
  delay: number;
  queue: TaskQueue;
  now: () => number;
  signals: string[];
}
