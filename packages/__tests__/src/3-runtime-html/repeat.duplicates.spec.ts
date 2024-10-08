import { createFixture } from "@aurelia/testing";

describe("3-runtime-html/repeat.duplicates.spec.ts", function () {
  describe('yield correct $index', function () {
    it('duplicate primitive string', function () {
      const { assertText, component, flush } = createFixture(
        `<div repeat.for="i of items">\${$index}-\${i} </div>`,
        class { items = ['a', 'b', 'a']; }
      );
      assertText('0-a 1-b 2-a ');

      component.items.push('a');
      flush();

      assertText('0-a 1-b 2-a 3-a ');
    });

    it('duplicate primitive string + push + sort', function () {
      const { assertText, component, flush } = createFixture(
        `<div repeat.for="i of items">\${$index}-\${i} </div>`,
        class { items = ['a', 'b', 'a']; }
      );
      assertText('0-a 1-b 2-a ');

      component.items.sort();
      flush();

      assertText('0-a 1-a 2-b ');
    });

    it('duplicate primitive number', function () {
      const { assertText, component, flush } = createFixture(
        `<div repeat.for="i of items">\${$index}-\${i} </div>`,
        class { items = [0, 1, 0]; }
      );
      assertText('0-0 1-1 2-0 ');

      component.items.push(0);
      flush();

      assertText('0-0 1-1 2-0 3-0 ');
    });

    it('duplicate primitive number + sort', function () {
      const { assertText, component, flush } = createFixture(
        `<div repeat.for="i of items">\${$index}-\${i} </div>`,
        class { items = [0, 1, 0]; }
      );
      assertText('0-0 1-1 2-0 ');

      component.items.sort();
      flush();

      assertText('0-0 1-0 2-1 ');
    });

    it('duplicate object', function () {
      const obj0 = { toString() { return '0'; } };
      const obj1 = { toString() { return '1'; } };

      const { assertText, component, flush } = createFixture(
        `<div repeat.for="i of items">\${$index}-\${i} </div>`,
        class { items = [obj0, obj1, obj0]; }
      );
      assertText('0-0 1-1 2-0 ');

      component.items.push(obj0);
      flush();

      assertText('0-0 1-1 2-0 3-0 ');
    });

    it('duplicate object + sort', function () {
      const obj0 = { toString() { return '0'; } };
      const obj1 = { toString() { return '1'; } };

      const { assertText, component, flush } = createFixture(
        `<div repeat.for="i of items">\${$index}-\${i} </div>`,
        class { items = [obj0, obj1, obj0]; }
      );
      assertText('0-0 1-1 2-0 ');

      component.items.sort();
      flush();

      assertText('0-0 1-0 2-1 ');
    });

    // TODO: fix contextual props $index when sorting
    // it('primitive string + sort (move to contextual props tests)', function () {
    it('primitive string + sort (move to contextual props tests)', function () {
      const { assertText, component, flush } = createFixture(
        `<div repeat.for="i of items">\${$index}-\${i} </div>`,
        class { items = ['c', 'b', 'a']; }
      );
      assertText('0-c 1-b 2-a ');

      component.items.sort();
      flush();

      assertText('0-a 1-b 2-c ');
    });
  });
});
