/*
 *  Copyright 2020 Unisys Corporation
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

/**
 * Handles writing and reading data from the mongodb
 * @module db
 * @requires mongodb
 * @requires opentracing
 * @requires winston
 */

const mongodb = require('mongodb');
const log = require('winston');
const opentracing = require('opentracing');
const env = require('../utils/environment');
const errors = require('../utils/errors');

/**
 * List of different commit types support by the DBoM database agent
 * @const
 */
const COMMIT_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  ATTACH: 'ATTACH',
  DETACH: 'DETACH',
  TRANSFER_IN: 'TRANSFER-IN',
  TRANSFER_OUT: 'TRANSFER-OUT',
};

const CHANNEL_DB = env.getChannelDB();
const AUDIT_POSTFIX = env.getAuditPostfix();
let client;

/**
 * Creates an instance of the mongoDB client based on environment variables
 * @func
 * @return {MongoClient} - Client that is ready to connect to
 */
const makeClientFromEnv = () => {
  let mongoClient;
  const tlsParams = env.getTLSParams();
  const defaultOptions = {
    numberOfRetries: 5,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: env.getMongoConnectionTimeout(),
    serverSelectionTimeoutMS: env.getMongoServerSelectionTimeout(),
  };
  if (tlsParams.enabled) {
    log.info('Using mutual TLS authentication and X509 authorization');
    mongoClient = new mongodb.MongoClient(env.getMongoURIFromEnv(),
      {
        ...tlsParams.mongoOptions,
        ...defaultOptions,
        tls: true,
      });
  } else {
    mongoClient = new mongodb.MongoClient(env.getMongoURIFromEnv(),
      {
        ...defaultOptions,
      });
  }
  return mongoClient;
};

/**
 * Sets up the mongodb client
 * @func
 * @return {Promise<MongoClient>}
 */
const setupClient = () => {
  client = makeClientFromEnv();
  log.info('Trying to connect to mongoDB using environment configuration');
  log.debug(`MongoDB: URI is  ${env.getMongoURIFromEnv()}`);
  return client.connect()
    .then(() => {
      log.info('MongoDB Connected!');
    }, (e) => {
      log.error(`Failed to connect ${e}`);
      throw e;
    });
};

/**
 * Commits a resource to the database
 * @func
 * @async
 * @param channel {string} the id of the channel
 * @param recordID {string} the id of the record
 * @param payload {object} payload to write
 * @param type {string} the commit type to perform
 * @param ctx {object} the tracing context
 */
const commitResource = async (channel, recordID, payload, type, ctx) => {
  const span = opentracing.globalTracer()
    .startSpan('MongoDB - Create/Update document on channel', {
      childOf: ctx,
    });

  if (channel.endsWith(AUDIT_POSTFIX)) throw new errors.ForbiddenChannelError();

  const resource = {
    ...payload,
    _id: recordID,
  };
  const channelCollection = client.db(CHANNEL_DB)
    .collection(channel);

  let result;
  if (type === COMMIT_TYPES.CREATE || type === COMMIT_TYPES.TRANSFER_IN) {
    log.info('Creating Asset');
    result = await channelCollection.insertOne(resource);
  } else {
    log.info('Updating Asset');
    result = await channelCollection.replaceOne({ _id: recordID }, resource, {
      upsert: false,
    });
  }
  if (!result || result.modifiedCount === 0) {
    span.setTag(opentracing.Tags.ERROR, true);
    log.error('Mongo Create/Update failure in Channel');
    throw new errors.NotFoundError();
  }
  span.finish();
  return result;
};

/**
 * List channels from the database
 * @func
 * @async
 * @param ctx {object} the tracing context
 * @returns {object} the list of channel ids
 */
const listChannels = async (ctx) => {
  const span = opentracing.globalTracer()
    .startSpan('MongoDB - List channels', {
      childOf: ctx,
    });
  // eslint-disable-next-line max-len
  return client.db(CHANNEL_DB).listCollections(null, { nameOnly: true }).toArray().then((collections) => {
    if (collections.length === 0) {
      span.finish();
      throw new errors.NotFoundError();
    }
    const collectionsArray = collections.map((item) => item.name);
    span.finish();
    return collectionsArray;
  });
};

/**
 * List records from the database
 * @func
 * @async
 * @param channel {string} the id of the channel
 * @param ctx {object} the tracing context
 * @returns {object} the list of record ids
 */
const listRecords = async (channel, ctx) => {
  if (channel.endsWith(AUDIT_POSTFIX)) throw new errors.ForbiddenChannelError();
  const span = opentracing.globalTracer()
    .startSpan('MongoDB - List records', {
      childOf: ctx,
    });
  const collection = client.db(CHANNEL_DB)
    .collection(channel);

  const resources = [];
  const cursor = await collection.find({}, { projection: { _id: 1 } });
  if ((await cursor.count()) === 0) {
    log.info('No records found');
    span.finish();
    throw new errors.NotFoundError();
  }
  await cursor.forEach((resource) => {
    // eslint-disable-next-line dot-notation
    resources.push(resource['_id']);
  });
  span.finish();
  return resources;
};

/**
 * Query records from the database
 * @func
 * @async
 * @param channel {string} the id of the channel
 * @param ctx {object} the tracing context
 * @returns {object} the list of records
 */
const queryRecords = async (channel, query, projection, limit, skip, ctx) => {
  if (channel.endsWith(AUDIT_POSTFIX)) throw new errors.ForbiddenChannelError();
  const span = opentracing.globalTracer()
    .startSpan('MongoDB - Query records', {
      childOf: ctx,
    });
  const collection = client.db(CHANNEL_DB)
    .collection(channel);

  const resources = [];
  const cursor = await collection.find(query, { projection, limit, skip });
  if ((await cursor.count()) === 0) {
    log.info('No records found');
    span.finish();
    throw new errors.NotFoundError();
  }
  await cursor.forEach((resource) => {
    // eslint-disable-next-line dot-notation
    resources.push(resource);
  });
  span.finish();
  return resources;
};

/**
 * Queries a resource from the database
 * @func
 * @async
 * @param channel {string} the id of the channel
 * @param resourceID {string} the id of the resource
 * @param ctx {object} the tracing context
 * @returns {object} the resource payload
 */
const queryResource = async (channel, resourceID, ctx) => {
  if (channel.endsWith(AUDIT_POSTFIX)) throw new errors.ForbiddenChannelError();

  const span = opentracing.globalTracer()
    .startSpan('MongoDB - findOne from collection', {
      childOf: ctx,
    });
  const collection = client.db(CHANNEL_DB)
    .collection(channel);

  const resource = await collection.findOne({ _id: resourceID });
  if (!resource) throw new errors.NotFoundError();
  // eslint-disable-next-line no-underscore-dangle
  delete resource._id;

  span.finish();
  return resource;
};

/**
 * Queries a the audit history of a resource from the database
 * @func
 * @async
 * @param channel {string} the id of the channel
 * @param resourceID {string} the id of the resource
 * @returns {object} the resource audit history
 */
const queryResourceAudit = async (channel, resourceID) => {
  if (channel.endsWith(AUDIT_POSTFIX)) throw new errors.ForbiddenChannelError();

  const collection = client.db(CHANNEL_DB)
    .collection(`${channel}${AUDIT_POSTFIX}`);

  const auditTrailCursor = await collection.find({
    resourceID,
  }, {
    projection: {
      resourceID: 0,
    },
  });
  if (await auditTrailCursor.count() === 0) throw new errors.NotFoundError();

  return auditTrailCursor.toArray();
};

module.exports = {
  commitResource,
  listChannels,
  listRecords,
  queryRecords,
  queryResource,
  queryResourceAudit,
  makeClientFromEnv,
  setupClient,
};
