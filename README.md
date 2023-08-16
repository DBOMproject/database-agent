# DBoM Database Agent
An example agent that uses mongodb for persistent storage and exposes the CQA (Commit-Query-Audit) interface as required by the Digital Bill of Materials(DBoM) gateway

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [How to Use](#how-to-use)
  - [API](#api)
  - [Configuration](#configuration)
- [Helm Deployment](#helm-deployment)
- [Platform Support](#platform-support)
- [Getting Help](#getting-help)
- [Getting Involved](#getting-involved)

<!-- END doctoc generated TOC please keep comment here to allow auto update --># DBoM Repository Agent (Database Agent)

The DBoM Repository Agent component for the Digital Bill of Materials

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [DBoM Repository Agent (Database Agent)](#dbom-repository-agent-database-agent)
  - [How to Use](#how-to-use)
    - [API](#api)
    - [Configuration](#configuration)
  - [Helm Deployment](#helm-deployment)
  - [Platform Support](#platform-support)
  - [Getting Help](#getting-help)
  - [Getting Involved](#getting-involved)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## How to Use

### API

[WIP] Latest NATS Events for DBoM Repository Agent is available on the [api-specs repository](https://github.com/DBOMproject/api-specs/tree/2.0.0-alpha-1)

### Configuration

| Environment Variable         | Default                                                                 | Description                                 |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| NODE_ID                      | (Example) `node1`                                                       | The node ID                                 |
| NODE_URI                     | (Example) `node1.test.com`                                              | The node URI                                |
| DATABASE_URL                 | (Example) `mongodb://root:prisma@localhost:27018/dbom?authSource=admin` | The database URL                            |
| JAEGER_HOST                  |                                                                         | The Jaeger host to send traces to           |
| JAEGER_SAMPLER_PARAM         | `1`                                                                     | The parameter to pass to the Jaeger sampler |
| JAEGER_SAMPLER_TYPE          | `const`                                                                 | The Jaeger sampler type to use              |
| JAEGER_SERVICE_NAME          | `Database Agent`                                                        | The name of the service passed to Jaeger    |
| JAEGER_AGENT_SIDECAR_ENABLED | `false`                                                                 | Is Jaeger agent sidecar injection enabled   |
|                              |

## Helm Deployment

[WIP] Once Completed - Instructions for deploying the database-agent using helm charts can be found [here](https://github.com/DBOMproject/deployments)

## Platform Support

Currently, we provide pre-built container images for linux amd64 and arm64 architectures via our Github Actions Pipeline. Find the images [here](https://hub.docker.com/r/dbomproject/database-agent)

## Getting Help

If you have any queries on database-agent, feel free to reach us on any of our [communication channels](https://github.com/DBOMproject/community/blob/master/COMMUNICATION.md)

If you have questions, concerns, bug reports, etc, please file an issue in this repository's [issue tracker](https://github.com/DBOMproject/database-agent/issues).

## Getting Involved

Find instructions on how you can contribute in [CONTRIBUTING](CONTRIBUTING.md).


## How to Use

### API

Latest OpenAPI Specification for this API is available on the [api-specs repository](https://github.com/DBOMproject/api-specs/tree/master/agent)

### Configuration

| Environment Variable           | Default                      | Description                                                                                                    |
|--------------------------------|------------------------------|----------------------------------------------------------------------------------------------------------------|
| LOG_LEVEL                      | `info`                       | The verbosity of the logging                                                                                   |
| PORT                           | `3000`                       | Port on which the gateway listens                                                                              |
| MONGO_URI                      | -                            | A mongodb uri string. If this is specified, all other mongo args are overridden                                |
| MONGO_HOST                     | `mongodb`                    | The host on which mongodb is available                                                                         |
| MONGO_PORT                     | `27017`                      | Port on which mongodb's native driver api is available                                                         |
| MONGO_PASS                     | `pass`                       | Password for mongo host                                                                                        |
| MONGO_REPLICA_SET_NAME         | ``                           | Name of the mongo replicaset. Only required if connecting to an rs mongo                                       |
| MONGO_TLS_MODE_ENABLED         | `0`                          | If set to 1, enable TLS mongodb connections and present a client certificate for authorization                 |
| MONGO_TLS_CLIENT_CERT_PATH     | ``                           | Path to client certificate as .PEM encoded file. Relative to launch directory. Required if TLS mode is enabled |
| MONGO_TLS_CA_CERT_PATH         | ``                           | Path to CAs certificate as a .PEM encoded file. Relative to launch directory. Required if TLS mode is enabled  |
| MONGO_TLS_CLIENT_CERT_PASS_KEY | `MONGO_TLS_CLIENT_CERT_PASS` | Environment variable key for client certificate password.                                                      |
| MONGO_TLS_CLIENT_CERT_PASS     | ``                           | Key to decrypt client certificate. Required if client certificate is protected with a passphrase               |
| MONGO_TLS_ALLOW_INVALID_HOST   | `0`                          | Allow use of server TLS certificates which do not have matching hostnames                                      |
| MONGO_SERVER_SELECTION_TIMEOUT | `3000`                       | Timeout for mongodb server selection. In milliseconds                                                          |
| MONGO_CONNECTION_TIMEOUT       | `3000`                       | Timeout for mongodb connection establishment. In milliseconds                                                  |
| CHANNEL_DB                     | `primary`                    | The database used as the channel collection                                                                    |
| AUDIT_POSTFIX                  | `_audit`                     | The postfix added to the audit channel for any given channel                                                   |
| JAEGER_HOST                    | ``                           | The jaeger host to send traces to                                                                              |
| JAEGER_SAMPLER_PARAM           | `1`                          | The parameter to pass to the jaeger sampler                                                                    |
| JAEGER_SAMPLER_TYPE            | `const`                      | The jaeger sampler type to use                                                                                 |
| JAEGER_SERVICE_NAME            | `Database Agent`             | The name of the service passed to jaeger                                                                       |
| JAEGER_AGENT_SIDECAR_ENABLED   | `false`                      | Is jaeger agent sidecar injection enabled                                                                      |

## Helm Deployment

Instructions for deploying the database-agent using helm charts can be found [here](https://github.com/DBOMproject/deployments/tree/master/charts/database-agent)

## Platform Support

Currently, we provide pre-built container images for linux amd64 and arm64 architectures via our Github Actions Pipeline. Find the images [here](https://hub.docker.com/r/dbomproject/database-agent)

## Getting Help

If you have any queries on database-agent, feel free to reach us on any of our [communication channels](https://github.com/DBOMproject/community/blob/master/COMMUNICATION.md) 

If you have questions, concerns, bug reports, etc, please file an issue in this repository's [issue tracker](https://github.com/DBOMproject/database-agent/issues).

## Getting Involved

Find instructions on how you can contribute in [CONTRIBUTING](CONTRIBUTING.md).
