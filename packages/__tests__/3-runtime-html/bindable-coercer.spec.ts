/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Class } from '@aurelia/kernel';
import { Aurelia, bindable, customElement, CustomElement, IPlatform, coercer } from '@aurelia/runtime-html';
import { assert, TestContext } from '@aurelia/testing';
import { createSpecFunction, TestExecutionContext, TestFunction } from '../util.js';

describe('bindable-coercer.spec.ts', function () {
  interface TestSetupContext<TApp> {
    template: string;
    registrations: any[];
    app: Class<TApp>;
  }
  const $it = createSpecFunction(testRepeatForCustomElement);
  async function testRepeatForCustomElement<TApp>(
    testFunction: TestFunction<TestExecutionContext<TApp>>,
    {
      template,
      registrations = [],
      app,
    }: Partial<TestSetupContext<TApp>>
  ) {
    const ctx = TestContext.create();
    const host = ctx.doc.createElement('div');
    ctx.doc.body.appendChild(host);

    const container = ctx.container;
    const au = new Aurelia(container);
    await au
      .register(
        ...registrations
      )
      .app({
        host,
        component: CustomElement.define({ name: 'app', isStrictBinding: true, template }, app ?? class { })
      })
      .start();
    const component = au.root.controller.viewModel as any;

    await testFunction({ app: component, container, ctx, host, platform: container.get(IPlatform) });

    await au.stop();

    assert.strictEqual(host.textContent, '', `host.textContent`);

    ctx.doc.body.removeChild(host);
  }

  function getTypeSpecification(type: unknown) {
    return type === undefined ? 'implicit type from TS metadata' : 'explicit type';
  }
  for (const type of [undefined, Number]) {
    {
      @customElement({ name: 'my-el', template: 'irrelevant' })
      class MyEl {
        @bindable({ type }) public num: number;
      }

      class App {
        public readonly myEl!: MyEl;
        public prop: any;
      }

      $it(`number - numeric string literal - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, 42);
      }, { app: App, template: `<my-el view-model.ref="myEl" num="42"></my-el>`, registrations: [MyEl] });

      $it(`number - numeric string literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, 42);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="'42'"></my-el>`, registrations: [MyEl] });

      $it(`number - numeric literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, 42);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="42"></my-el>`, registrations: [MyEl] });

      $it(`number - non-numeric string literal - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(Number.isNaN(ctx.app.myEl.num), true);
      }, { app: App, template: `<my-el view-model.ref="myEl" num="forty-two"></my-el>`, registrations: [MyEl] });

      $it(`number - non-numeric string literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(Number.isNaN(ctx.app.myEl.num), true);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="'forty-two'"></my-el>`, registrations: [MyEl] });

      $it(`number - boolean true - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, 1);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="true"></my-el>`, registrations: [MyEl] });

      $it(`number - boolean false - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, 0);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="false"></my-el>`, registrations: [MyEl] });

      $it(`number - undefined - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, undefined);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="undefined"></my-el>`, registrations: [MyEl] });

      $it(`number - null - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, null);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="null"></my-el>`, registrations: [MyEl] });

      $it(`number - object - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(Number.isNaN(ctx.app.myEl.num), true);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="{}"></my-el>`, registrations: [MyEl] });

      $it(`number - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
        const app = ctx.app;
        const myEl = app.myEl;
        assert.strictEqual(myEl.num, undefined);

        app.prop = null;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, null);

        app.prop = '0';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, 0);

        app.prop = '42';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, 42);

        app.prop = 0;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, 0);

        app.prop = 84;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, 84);

        app.prop = true;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, 1);

        app.prop = 'true';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(Number.isNaN(myEl.num), true);

        app.prop = {};
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(Number.isNaN(myEl.num), true);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="prop"></my-el>`, registrations: [MyEl] });
    }

    {
      @customElement({ name: 'my-el', template: 'irrelevant' })
      class MyEl {
        @bindable({ nullable: false, type }) public num: number;
      }
      class App {
        public readonly myEl!: MyEl;
        public prop: any;
      }
      $it(`not-nullable number - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
        const app = ctx.app;
        const myEl = app.myEl;
        assert.strictEqual(Number.isNaN(myEl.num), true);

        app.prop = null;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, 0);

        app.prop = '42';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, 42);

        app.prop = 0;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, 0);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="prop"></my-el>`, registrations: [MyEl] });
    }
  }

  for (const type of [undefined, String]) {
    {
      @customElement({ name: 'my-el', template: 'irrelevant' })
      class MyEl {
        @bindable({ type }) public str: string;
      }
      class App {
        public readonly myEl!: MyEl;
        public prop: any;
      }

      $it(`string - string literal - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.str, '42');
      }, { app: App, template: `<my-el view-model.ref="myEl" str="42"></my-el>`, registrations: [MyEl] });

      $it(`string - string literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.str, '42');
      }, { app: App, template: `<my-el view-model.ref="myEl" str.bind="'42'"></my-el>`, registrations: [MyEl] });

      $it(`string - numeric literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.str, '42');
      }, { app: App, template: `<my-el view-model.ref="myEl" str.bind="42"></my-el>`, registrations: [MyEl] });

      $it(`string - boolean true - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.str, 'true');
      }, { app: App, template: `<my-el view-model.ref="myEl" str.bind="true"></my-el>`, registrations: [MyEl] });

      $it(`string - boolean false - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.str, 'false');
      }, { app: App, template: `<my-el view-model.ref="myEl" str.bind="false"></my-el>`, registrations: [MyEl] });

      $it(`string - undefined - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.str, undefined);
      }, { app: App, template: `<my-el view-model.ref="myEl" str.bind="undefined"></my-el>`, registrations: [MyEl] });

      $it(`string - null - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.str, null);
      }, { app: App, template: `<my-el view-model.ref="myEl" str.bind="null"></my-el>`, registrations: [MyEl] });

      $it(`string - object - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.str, '[object Object]');
      }, { app: App, template: `<my-el view-model.ref="myEl" str.bind="{}"></my-el>`, registrations: [MyEl] });

      $it(`string - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
        const app = ctx.app;
        const myEl = app.myEl;
        assert.strictEqual(myEl.str, undefined);

        app.prop = null;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.str, null);

        app.prop = '0';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.str, '0');

        app.prop = '42';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.str, '42');

        app.prop = 0;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.str, '0');

        app.prop = 42;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.str, '42');

        app.prop = true;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.str, 'true');

        app.prop = false;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.str, 'false');

        app.prop = {};
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.str, '[object Object]');
      }, { app: App, template: `<my-el view-model.ref="myEl" str.bind="prop"></my-el>`, registrations: [MyEl] });
    }

    {
      @customElement({ name: 'my-el', template: 'irrelevant' })
      class MyEl {
        @bindable({ nullable: false, type }) public str: string;
      }
      class App {
        public readonly myEl!: MyEl;
        public prop: any;
      }
      $it(`not-nullable string - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
        const app = ctx.app;
        const myEl = app.myEl;
        assert.strictEqual(myEl.str, 'undefined');

        app.prop = null;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.str, 'null');

        app.prop = '42';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.str, '42');

        app.prop = 0;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.str, '0');
      }, { app: App, template: `<my-el view-model.ref="myEl" str.bind="prop"></my-el>`, registrations: [MyEl] });
    }
  }

  for (const type of [undefined, Boolean]) {
    {
      @customElement({ name: 'my-el', template: 'irrelevant' })
      class MyEl {
        @bindable({ type }) public bool: boolean;
      }
      class App {
        public readonly myEl!: MyEl;
        public prop: any;
      }

      $it(`string - boolean true string literal - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, true);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool="true"></my-el>`, registrations: [MyEl] });

      $it(`string - boolean false string literal - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, true);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool="false"></my-el>`, registrations: [MyEl] });

      $it(`string - boolean true string literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, true);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool.bind="true"></my-el>`, registrations: [MyEl] });

      $it(`string - boolean false string literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, false);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool.bind="false"></my-el>`, registrations: [MyEl] });

      $it(`string - number 1 literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, true);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool.bind="1"></my-el>`, registrations: [MyEl] });

      $it(`string -number 0 literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, false);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool.bind="0"></my-el>`, registrations: [MyEl] });

      $it(`string - numeric string literal - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, true);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool="42"></my-el>`, registrations: [MyEl] });

      $it(`string - string literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, true);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool.bind="'42'"></my-el>`, registrations: [MyEl] });

      $it(`string - numeric literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, true);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool.bind="42"></my-el>`, registrations: [MyEl] });

      $it(`string - undefined - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, undefined);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool.bind="undefined"></my-el>`, registrations: [MyEl] });

      $it(`string - null - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, null);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool.bind="null"></my-el>`, registrations: [MyEl] });

      $it(`string - object - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.bool, true);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool.bind="{}"></my-el>`, registrations: [MyEl] });

      $it(`string - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
        const app = ctx.app;
        const myEl = app.myEl;
        assert.strictEqual(myEl.bool, undefined);

        app.prop = null;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, null);

        app.prop = '0';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, true);

        app.prop = '1';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, true);

        app.prop = '42';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, true);

        app.prop = 0;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, false);

        app.prop = 1;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, true);

        app.prop = 42;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, true);

        app.prop = true;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, true);

        app.prop = false;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, false);

        app.prop = 'true';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, true);

        app.prop = 'false';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, true);

        app.prop = {};
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, true);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool.bind="prop"></my-el>`, registrations: [MyEl] });
    }

    {
      @customElement({ name: 'my-el', template: 'irrelevant' })
      class MyEl {
        @bindable({ nullable: false, type }) public bool: boolean;
      }
      class App {
        public readonly myEl!: MyEl;
        public prop: any;
      }
      $it(`not-nullable boolean - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
        const app = ctx.app;
        const myEl = app.myEl;
        assert.strictEqual(myEl.bool, false);

        app.prop = null;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, false);

        app.prop = '42';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, true);

        app.prop = 0;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.bool, false);
      }, { app: App, template: `<my-el view-model.ref="myEl" bool.bind="prop"></my-el>`, registrations: [MyEl] });
    }
  }

  for (const type of [undefined, BigInt]) {
    {
      @customElement({ name: 'my-el', template: 'irrelevant' })
      class MyEl {
        @bindable({ type }) public num: bigint;
      }

      class App {
        public readonly myEl!: MyEl;
        public prop: any;
      }

      $it(`bigint - numeric string literal - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, BigInt(42));
      }, { app: App, template: `<my-el view-model.ref="myEl" num="42"></my-el>`, registrations: [MyEl] });

      $it(`bigint - numeric string literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, BigInt(42));
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="'42'"></my-el>`, registrations: [MyEl] });

      $it(`bigint - numeric literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, BigInt(42));
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="42"></my-el>`, registrations: [MyEl] });

      $it(`bigint - boolean true - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, BigInt(1));
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="true"></my-el>`, registrations: [MyEl] });

      $it(`bigint - boolean false - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, BigInt(0));
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="false"></my-el>`, registrations: [MyEl] });

      $it(`bigint - undefined - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, undefined);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="undefined"></my-el>`, registrations: [MyEl] });

      $it(`bigint - null - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
        assert.strictEqual(ctx.app.myEl.num, null);
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="null"></my-el>`, registrations: [MyEl] });

      $it(`bigint - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
        const app = ctx.app;
        const myEl = app.myEl;
        assert.strictEqual(myEl.num, undefined);

        app.prop = null;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, null);

        app.prop = '0';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, BigInt(0));

        app.prop = '42';
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, BigInt(42));

        app.prop = 0;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, BigInt(0));

        app.prop = 84;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, BigInt(84));

        app.prop = true;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, BigInt(1));

        assert.throws(() => {
          app.prop = 'true';
        });
        assert.throws(() => {
          app.prop = {};
        });
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="prop"></my-el>`, registrations: [MyEl] });
    }

    {
      @customElement({ name: 'my-el', template: 'irrelevant' })
      class MyEl {
        @bindable({ nullable: false, type }) public num: bigint;
      }
      class App {
        public readonly myEl!: MyEl;
        public prop: any = 42;
      }
      $it(`not-nullable number - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
        const app = ctx.app;
        const myEl = app.myEl;
        assert.strictEqual(myEl.num, BigInt(42));

        assert.throws(() => {
          app.prop = null;
        });

        assert.throws(() => {
          app.prop = undefined;
        });

        app.prop = 0;
        await ctx.platform.domWriteQueue.yield();
        assert.strictEqual(myEl.num, BigInt(0));
      }, { app: App, template: `<my-el view-model.ref="myEl" num.bind="prop"></my-el>`, registrations: [MyEl] });
    }
  }

  class Person {
    public static coerced: number = 0;
    public constructor(
      public readonly name: string,
      public readonly age: number,
    ) { }
  }
  function createPerson(this: typeof Person, value: unknown): Person {
    this.coerced++;
    if (typeof value === 'string') {
      try {
        const json = JSON.parse(value) as Person;
        return new this(json.name, json.age);
      } catch {
        return new this(value, null!);
      }
    }
    if (typeof value === 'number') {
      return new this(null!, value);
    }
    if (typeof value === 'object' && value != null) {
      return new this((value as any).name, (value as any).age);
    }
    return new this(null!, null!);
  }
  /* eslint-disable no-useless-escape */
  {
    class Person1 extends Person {
      public static coercer = createPerson.bind(Person1);
    }
    for (const type of [undefined, Person1]) {
      @customElement({ name: 'my-el', template: 'irrelevant' })
      class MyEl {
        @bindable({ type }) public person: Person1;
      }

      {
        class App {
          public readonly myEl!: MyEl;
          public prop: any;
        }

        $it(`class with static coercer - string literal - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person1('john', null!));
        }, { app: App, template: `<my-el view-model.ref="myEl" person="john"></my-el>`, registrations: [MyEl] });

        $it(`class with static coercer - numeric literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person1(null!, 42));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="42"></my-el>`, registrations: [MyEl] });

        $it(`class with static coercer - json string - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person1('john', 42));
        }, { app: App, template: `<my-el view-model.ref="myEl" person='{\"name\":\"john\",\"age\":42}'></my-el>`, registrations: [MyEl] });

        $it(`class with static coercer - object literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person1('john', 42));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="{name:'john',age:42}"></my-el>`, registrations: [MyEl] });

        $it(`class with static coercer - boolean true - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person1(null!, null!));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="true"></my-el>`, registrations: [MyEl] });

        $it(`class with static coercer - boolean false - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person1(null!, null!));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="false"></my-el>`, registrations: [MyEl] });

        $it(`class with static coercer - undefined - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, undefined);
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="undefined"></my-el>`, registrations: [MyEl] });

        $it(`class with static coercer - null - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, null);
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="null"></my-el>`, registrations: [MyEl] });

        $it(`class with static coercer - object - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person1(void 0, void 0));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="{}"></my-el>`, registrations: [MyEl] });

        $it(`class with static coercer - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
          const app = ctx.app;
          const myEl = app.myEl;
          assert.strictEqual(myEl.person, undefined);

          app.prop = null;
          await ctx.platform.domWriteQueue.yield();
          assert.strictEqual(myEl.person, null);

          app.prop = 'john';
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person1('john', null!));

          app.prop = JSON.stringify(new Person1('john', 42));
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person1('john', 42));

          app.prop = 42;
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person1(null!, 42));

          app.prop = { name: 'john', age: 42 };
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person1('john', 42));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="prop"></my-el>`, registrations: [MyEl] });
      }

      {
        @customElement({ name: 'my-el', template: 'irrelevant' })
        class MyEl {
          @bindable({ nullable: false, type }) public person: Person1;
        }
        class App {
          public readonly myEl!: MyEl;
          public prop: any;
        }
        $it(`not-nullable - class with static coercer - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
          const app = ctx.app;
          const myEl = app.myEl;
          assert.deepStrictEqual(myEl.person, new Person1(null!, null!));

          app.prop = null;
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person1(null!, null!));

          app.prop = { name: 'john', age: 42 };
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person1('john', 42));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="prop"></my-el>`, registrations: [MyEl] });
      }
    }
  }
  {
    class Person2 extends Person {
      @coercer
      public static createPerson(value: unknown) { return createPerson.bind(Person2)(value) as Person2; }
    }
    for (const type of [undefined, Person2]) {
      @customElement({ name: 'my-el', template: 'irrelevant' })
      class MyEl {
        @bindable({ type }) public person: Person2;
      }

      {
        class App {
          public readonly myEl!: MyEl;
          public prop: any;
        }

        $it(`class with coercer decorator - string literal - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person2('john', null!));
        }, { app: App, template: `<my-el view-model.ref="myEl" person="john"></my-el>`, registrations: [MyEl] });

        $it(`class with coercer decorator - numeric literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person2(null!, 42));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="42"></my-el>`, registrations: [MyEl] });

        $it(`class with coercer decorator - json string - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person2('john', 42));
        }, { app: App, template: `<my-el view-model.ref="myEl" person='{\"name\":\"john\",\"age\":42}'></my-el>`, registrations: [MyEl] });

        $it(`class with coercer decorator - object literal bind - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person2('john', 42));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="{name:'john',age:42}"></my-el>`, registrations: [MyEl] });

        $it(`class with coercer decorator - boolean true - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person2(null!, null!));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="true"></my-el>`, registrations: [MyEl] });

        $it(`class with coercer decorator - boolean false - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person2(null!, null!));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="false"></my-el>`, registrations: [MyEl] });

        $it(`class with coercer decorator - undefined - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, undefined);
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="undefined"></my-el>`, registrations: [MyEl] });

        $it(`class with coercer decorator - null - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, null);
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="null"></my-el>`, registrations: [MyEl] });

        $it(`class with coercer decorator - object - ${getTypeSpecification(type)}`, function (ctx: TestExecutionContext<App>) {
          assert.deepStrictEqual(ctx.app.myEl.person, new Person2(void 0, void 0));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="{}"></my-el>`, registrations: [MyEl] });

        $it(`class with coercer decorator - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
          const app = ctx.app;
          const myEl = app.myEl;
          assert.strictEqual(myEl.person, undefined);

          app.prop = null;
          await ctx.platform.domWriteQueue.yield();
          assert.strictEqual(myEl.person, null);

          app.prop = 'john';
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person2('john', null!));

          app.prop = JSON.stringify(new Person2('john', 42));
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person2('john', 42));

          app.prop = 42;
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person2(null!, 42));

          app.prop = { name: 'john', age: 42 };
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person2('john', 42));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="prop"></my-el>`, registrations: [MyEl] });
      }

      {
        @customElement({ name: 'my-el', template: 'irrelevant' })
        class MyEl {
          @bindable({ nullable: false, type }) public person: Person2;
        }
        class App {
          public readonly myEl!: MyEl;
          public prop: any;
        }
        $it(`not-nullable - class with coercer decorator - bound property - ${getTypeSpecification(type)}`, async function (ctx: TestExecutionContext<App>) {
          const app = ctx.app;
          const myEl = app.myEl;
          assert.deepStrictEqual(myEl.person, new Person2(null!, null!));

          app.prop = null;
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person2(null!, null!));

          app.prop = { name: 'john', age: 42 };
          await ctx.platform.domWriteQueue.yield();
          assert.deepStrictEqual(myEl.person, new Person2('john', 42));
        }, { app: App, template: `<my-el view-model.ref="myEl" person.bind="prop"></my-el>`, registrations: [MyEl] });
      }
    }
  }
  /* eslint-enable no-useless-escape */

});
