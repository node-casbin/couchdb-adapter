import { Enforcer, Util } from "casbin";
import { CouchdbAdapter } from "../src/adapter.js";

async function testGetPolicy(e: Enforcer, res: string[][]) {
  const myRes = await e.getPolicy();

  console.log(myRes);
  console.log(Util.array2DEquals(res, myRes));
}

async function testGetFilteredPolicy(e: Enforcer, res: string[]) {
  const filtered: any = await e.getFilteredNamedPolicy("p", 0, "alice");
  const myRes = filtered[0];

  console.log(myRes);
  console.log(Util.arrayEquals(res, myRes));
}

async function test() {
  const couchdbAdapter = await CouchdbAdapter.newAdapter(
    "http://admin:123456@localhost:5984"
  );
  let e = new Enforcer();

  await e.initWithFile(
    "./examples/rbac_model.conf",
    "./examples/rbac_policy.csv"
  );

  await couchdbAdapter.savePolicy(e.getModel());

  e.clearPolicy();

  // 1
  await testGetPolicy(e, []);

  // Load the policy from DB.
  await couchdbAdapter.loadPolicy(e.getModel());

  // 2
  await testGetPolicy(e, [
    ["alice", "data1", "read"],
    ["bob", "data2", "write"],
    ["data2_admin", "data2", "read"],
    ["data2_admin", "data2", "write"],
  ]);

  e = new Enforcer();
  await e.initWithAdapter("examples/rbac_model.conf", couchdbAdapter);

  // 3
  await testGetPolicy(e, [
    ["alice", "data1", "read"],
    ["bob", "data2", "write"],
    ["data2_admin", "data2", "read"],
    ["data2_admin", "data2", "write"],
  ]);

  await couchdbAdapter.loadFilteredPolicy(e.getModel(), { p: ["alice"] });

  // 4
  await testGetFilteredPolicy(e, ["alice", "data1", "read"]);

  // Add policy to DB
  await couchdbAdapter.addPolicy("", "p", ["role", "res", "action"]);
  e = new Enforcer();
  await e.initWithAdapter("examples/rbac_model.conf", couchdbAdapter);

  // 5
  await testGetPolicy(e, [
    ["alice", "data1", "read"],
    ["bob", "data2", "write"],
    ["data2_admin", "data2", "read"],
    ["data2_admin", "data2", "write"],
    ["role", "res", "action"],
  ]);

  // Remove policy from DB
  await couchdbAdapter.removePolicy("", "p", ["role", "res", "action"]);

  e = new Enforcer();
  await e.initWithAdapter("examples/rbac_model.conf", couchdbAdapter);

  // 6
  await testGetPolicy(e, [
    ["alice", "data1", "read"],
    ["bob", "data2", "write"],
    ["data2_admin", "data2", "read"],
    ["data2_admin", "data2", "write"],
  ]);

  await couchdbAdapter.removeFilteredPolicy("", "p", 0, "data2_admin");
  e = new Enforcer();
  await e.initWithAdapter("examples/rbac_model.conf", couchdbAdapter);

  // 7
  await testGetPolicy(e, [
    ["alice", "data1", "read"],
    ["bob", "data2", "write"],
  ]);
}

console.log("start test");
test().then(() => {
  console.log("end test");
});
