QUnit.module("Graph Builder Tests");

QUnit.test("test1", function() {

  graphBuilder = new AskomicsGraphBuilder();

  assert.ok(true, "true is truthy");
  assert.equal(1, true, "1 is truthy");
  assert.notEqual(0, true, "0 is NOT truthy");
});
