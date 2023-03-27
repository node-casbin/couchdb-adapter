# CouchDB Adapter

[![NPM version][npm-image]][npm-url]
[![NPM download][download-image]][download-url]
[![ci](https://github.com/node-casbin/couchdb-adapter/actions/workflows/ci.yml/badge.svg)](https://github.com/node-casbin/couchdb-adapter/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/node-casbin/couchdb-adapter/badge.svg?branch=master)](https://coveralls.io/github/node-casbin/couchdb-adapter?branch=master)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/casbin/lobby)

[npm-image]: https://img.shields.io/npm/v/casbin-couchdb-adapter.svg?style=flat-square
[npm-url]: https://npmjs.org/package/casbin-couchdb-adapter
[download-image]: https://img.shields.io/npm/dm/casbin-couchdb-adapter.svg?style=flat-square
[download-url]: https://npmjs.org/package/casbin-couchdb-adapter

CouchDB policy storage, implemented as an adapter for [node-casbin](https://github.com/casbin/node-casbin).

## Installation

NPM:

```bash
npm install casbin-couchdb-adapter --save
```

Yarn:

```bash
yarn add casbin-couchdb-adapter
```

## Simple Example

```typescript
import { newEnforcer } from 'casbin';
import { CouchdbAdapter } from 'casbin-couchdb-adapter';
import { join } from 'path';

async function myFunction() {
    // Initialize a CouchdbAdapter adapter and use it in a Node-Casbin enforcer:
    const adapter = await CouchdbAdapter.newAdapter("http://admin:password@localhost:5984");

    // The location of your Casbin model configuration file
    const model = join(__dirname, 'casbin_conf/model.conf');

    const enforcer = await newEnforcer(model, adapter);

    // Check the permission.
    enforcer.enforce('alice', 'data1', 'read');

    // Modify the policy.
    // await enforcer.addPolicy(...);
    // await enforcer.removePolicy(...);

    // Save the policy back to DB.
    await enforcer.savePolicy();
}
```

## Configuration

You need to create a database named `"casbin"` and a document like this:

```json
{
  "_id": "policies",
  "value": []
}
```

```CouchdbAdapter.newAdapter()``` takes the following parameters as an object to establish the connection with couchdb-server

```typescript
databaseUrl: string = "http://{admin}:{password}@{ip}:{port}"
```

## Getting Help

- [Node-Casbin](https://github.com/casbin/node-casbin)

## License

This project is under Apache 2.0 License. See the [LICENSE](LICENSE) file for the full license text.
