# DBoM Database Agent
An example agent that uses mongodb for persistent storage and exposes the CQA (Commit-Query-Audit) interface as required by the Digital Bill of Materials(DBoM) gateway

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [How to Use](#how-to-use)
  - [API](#api)
  - [Configuration](#configuration)
- [Helm Deployment](#helm-deployment)
- [Getting Help](#getting-help)
- [Getting Involved](#getting-involved)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## How to Use

### API

Latest OpenAPI Specification for this API is available on the [api-specs repository](https://github.com/DBOMproject/deployment/blob/master/api-specs/agent)

### Configuration

| Environment Variable         | Default          | Description                                                                     |
|------------------------------|------------------|---------------------------------------------------------------------------------|
| LOG_LEVEL                    | `info`           | The verbosity of the logging                                                    |
| PORT                         | `3000`           | Port on which the gateway listens                                               |
| MONGO_URI                    | -                | A mongodb uri string. If this is specified, all other mongo args are overridden |
| MONGO_HOST                   | `mongodb`        | The host on which mongodb is available                                          |
| MONGO_PORT                   | `27017`          | Port on which mongodb's native driver api is available                          |
| MONGO_PASS                   | `pass`           | Password for mongo host                                                         |
| MONGO_REPLICA_SET_NAME       | ``               | Name of the mongo replicaset. Only required if connecting to an rs mongo        |
| CHANNEL_DB                   | `primary`        | The database used as the channel collection                                     |
| AUDIT_POSTFIX                | `_audit`         | The postfix added to the audit channel for any given channel                    |
| JAEGER_HOST                  | ``               | The jaeger host to send traces to                                               |
| JAEGER_SAMPLER_PARAM         | `1`              | The parameter to pass to the jaeger sampler                                     |
| JAEGER_SAMPLER_TYPE          | `const`          | The jaeger sampler type to use                                                  |
| JAEGER_SERVICE_NAME          | `Database Agent` | The name of the service passed to jaeger                                        |
| JAEGER_AGENT_SIDECAR_ENABLED | `false`          | Is jaeger agent sidecar injection enabled                                       |

## Helm Deployment

Instructions for deploying the database-agent using helm charts can be found [here](https://github.com/DBOMproject/deployment/blob/master/charts/database-agent)

## Getting Help

If you have any queries on insert-project-name, feel free to reach us on any of our [communication channels](https://github.com/DBOMproject/community/blob/master/COMMUNICATION.md) 

If you have questions, concerns, bug reports, etc, please file an issue in this repository's [Issue Tracker](https://github.com/DBOMproject/database-agent/issues).

## Getting Involved

Find instructions on how you can contribute in [CONTRIBUTING](CONTRIBUTING.md).