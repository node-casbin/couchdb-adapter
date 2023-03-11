# couchdb-adapter

CouchDB policy storage, implemented as an adapter for [node-casbin](https://github.com/casbin/node-casbin).

## Installation

Please wait for the release.

## Usage

Require it in a place, where you are instantiating an
enforcer ([read more about enforcer here](https://github.com/casbin/node-casbin#get-started)):

```typescript
import {newEnforcer} from 'casbin';
import {CouchdbAdapter} from './adapter' ;
import {join} from 'path';
const model = join(__dirname, 'casbin_conf/model.conf');
const adapter = await CouchdbAdapter.newAdapter("http://admin:password@localhost:5984");
const enforcer = await newEnforcer(model, adapter);
```

That is all what required for integrating the adapter into casbin.

## Configuration

```CouchdbAdapter.newAdapter()``` takes the following parameters as an object to establish the connection with
couchdb-server

```typescript
databaseUrl: string = "http://{admin}:{password}@{ip}:{port}"
```

## License

[Apache-2.0](./LICENSE)
