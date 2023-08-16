# DBoM Database Agent
An example agent that uses mongodb for persistent storage and exposes the CQA (Commit-Query-Audit) interface as required by the Digital Bill of Materials(DBoM) gateway

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [DBoM Database Agent](#dbom-database-agent)
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

- [DBoM Database Agent](#dbom-database-agent)
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