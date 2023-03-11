// Copyright 2023 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Helper, Model, FilteredAdapter } from "casbin";
import Nano from "nano";

export interface Filters {
  [ptype: string]: string[];
}

class Line {
  ptype: string = "";
  v0: string = "";
  v1: string = "";
  v2: string = "";
  v3: string = "";
  v4: string = "";
  v5: string = "";
}

export class CouchdbAdapter implements FilteredAdapter {
  private couchdbInstance: any;

  private policies: Line[] = [];
  private filtered = false;

  private databaseName: string = "casbin";

  constructor(databaseUrl: string) {
    const nano = Nano(databaseUrl);
    this.couchdbInstance = nano.db.use(this.databaseName);
  }

  public static async newAdapter(databaseUrl: string) {
    const adapter = new CouchdbAdapter(databaseUrl);
    return adapter;
  }

  public isFiltered(): boolean {
    return this.filtered;
  }

  savePolicyLine(ptype: any, rule: any) {
    const line = new Line();
    line.ptype = ptype;
    switch (rule.length) {
      case 6:
        line.v5 = rule[5];
      case 5:
        line.v4 = rule[4];
      case 4:
        line.v3 = rule[3];
      case 3:
        line.v2 = rule[2];
      case 2:
        line.v1 = rule[1];
      case 1:
        line.v0 = rule[0];
        break;
      default:
        throw new Error(
          "Rule should not be empty or have more than 6 arguments."
        );
    }
    return line;
  }

  loadPolicyLine(line: any, model: any) {
    const lineText =
      line.ptype +
      ", " +
      [line.v0, line.v1, line.v2, line.v3, line.v4, line.v5]
        .filter((n) => n)
        .join(", ");

    Helper.loadPolicyLine(lineText, model);
  }

  storePolicies(policies: Line[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.couchdbInstance
        .get("policies", { _rev: true })
        .then((res: any) => {
          this.couchdbInstance
            .destroy("policies", res["_rev"])
            .then((res: any) => {
              this.couchdbInstance.insert({ value: policies }, "policies");
            });
          resolve();
        })
        .catch((err: any) => {
          console.log(err);
          reject();
        });
    });
  }

  public async loadFilteredPolicy(
    model: Model,
    policyFilter: Filters
  ): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.couchdbInstance
        .get("policies")
        .then((res: { [x: string]: any }) => {
          const parsedPolicies = res["value"];
          const filteredPolicies = parsedPolicies.filter((policy: Line) => {
            if (!(policy.ptype in policyFilter)) {
              return false;
            }
            const tempPolicy = [
              policy.v0,
              policy.v1,
              policy.v2,
              policy.v3,
              policy.v4,
              policy.v5,
            ];
            const tempFilter = policyFilter[policy.ptype];
            if (tempFilter.length > tempPolicy.length) {
              return false;
            }
            for (let i = 0; i < tempFilter.length; i++) {
              if (!tempFilter[i]) {
                continue;
              }
              if (tempPolicy[i] !== tempFilter[i]) {
                return false;
              }
            }
            return true;
          });
          filteredPolicies.forEach((policy: any) => {
            this.loadPolicyLine(policy, model);
          });
          resolve();
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  }

  public async loadPolicy(model: Model): Promise<void> {
    return new Promise((resolve, reject) => {
      this.couchdbInstance
        .get("policies")
        .then((res: { [x: string]: any }) => {
          const parsedPolicies = res["value"];
          this.policies = parsedPolicies;
          parsedPolicies.forEach((policy: any) => {
            this.loadPolicyLine(policy, model);
          });
          resolve();
        })
        .catch((err: any) => {
          console.log(err)
          reject(err);
        });
    });
  }

  public async savePolicy(model: Model): Promise<boolean> {
    const policyRuleAST = model.model.get("p")!;
    const groupingPolicyAST = model.model.get("g")!;
    let policies: Line[] = [];

    for (const astMap of [policyRuleAST, groupingPolicyAST]) {
      for (const [ptype, ast] of astMap) {
        for (const rule of ast.policy) {
          const line = this.savePolicyLine(ptype, rule);
          policies.push(line);
        }
      }
    }

    return new Promise((resolve, reject) => {
      this.couchdbInstance
        .get("policies", { _rev: true })
        .then((res: { [x: string]: any }) => {
          this.couchdbInstance
            .destroy("policies", res["_rev"])
            .then((res: any) => {
              this.couchdbInstance.insert({ value: policies }, "policies");
            });
          resolve(true);
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  }

  async addPolicy(sec: string, ptype: string, rule: any) {
    const line = this.savePolicyLine(ptype, rule);
    this.policies.push(line);
    await this.storePolicies(this.policies);
  }

  async removePolicy(
    sec: string,
    ptype: string,
    rule: string[]
  ): Promise<void> {
    const filteredPolicies = this.policies.filter((policy) => {
      let flag = true;
      flag &&= ptype == policy.ptype;
      if (rule.length > 0) {
        flag &&= rule[0] == policy.v0;
      }
      if (rule.length > 1) {
        flag &&= rule[1] == policy.v1;
      }
      if (rule.length > 2) {
        flag &&= rule[2] == policy.v2;
      }
      if (rule.length > 3) {
        flag &&= rule[3] == policy.v3;
      }
      if (rule.length > 4) {
        flag &&= rule[4] == policy.v4;
      }
      if (rule.length > 5) {
        flag &&= rule[5] == policy.v5;
      }
      return !flag;
    });
    this.policies = filteredPolicies;
    return await this.storePolicies(filteredPolicies);
  }

  public async removeFilteredPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<void> {
    let rule = new Array<string>(fieldIndex).fill("");
    rule.push(...fieldValues);
    const filteredPolicies = this.policies.filter((policy) => {
      let flag = true;
      flag &&= ptype == policy.ptype;
      if (rule.length > 0 && rule[0]) {
        flag &&= rule[0] == policy.v0;
      }
      if (rule.length > 1 && rule[1]) {
        flag &&= rule[1] == policy.v1;
      }
      if (rule.length > 2 && rule[2]) {
        flag &&= rule[2] == policy.v2;
      }
      if (rule.length > 3 && rule[3]) {
        flag &&= rule[3] == policy.v3;
      }
      if (rule.length > 4 && rule[4]) {
        flag &&= rule[4] == policy.v4;
      }
      if (rule.length > 5 && rule[5]) {
        flag &&= rule[5] == policy.v5;
      }
      return !flag;
    });
    this.policies = filteredPolicies;
    return await this.storePolicies(filteredPolicies);
  }

  public async close(): Promise<void> {
    return new Promise((resolve) => {
      this.couchdbInstance.close(() => {
        resolve();
      });
    });
  }
}
