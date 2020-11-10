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

const { MongoClient } = require('mongodb');
const log = require('winston');
const opentracing = require('opentracing');
const env = require('../utils/environment');

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
const CHANNEL_DB = process.env.CHANNEL_DB || 'primary';
const AUDIT_POSTFIX = process.env.AUDIT_POSTFIX || '_audit';

/**
 * Creates a forbidden channel error
 * @constructor
 */
class ForbiddenChannelError extends Error {
    constructor() {
        super();
        this.name = this.constructor.name;
        this.message = 'Forbidden Channel';
        this.code = 403;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Creates a not found error
 * @constructor
 */
class NotFoundError extends Error {
    constructor() {
        super();
        this.name = this.constructor.name;
        this.message = 'Not Found';
        this.code = 404;
        Error.captureStackTrace(this, this.constructor);
    }
}

const client = new MongoClient(env.getMongoURIFromEnv(),
  {
      numberOfRetries: 5,
      useNewUrlParser: true,
      useUnifiedTopology: true
  });

log.info(`MongoDB: Trying to connect to ${env.getMongoURIFromEnv()}`);

client.connect()
  .then(() => {
      log.info('MongoDB Connected!');
  }, (e) => {
      log.error(`Failed to connect ${e}`);
  });


/**
 * Commits a resource to the database
 * @func
 * @async
 * @param channel {string} the name of the channel
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

    if (channel.endsWith(AUDIT_POSTFIX)) throw new ForbiddenChannelError();

    const resource = {
        ...payload,
        _id: recordID
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
        throw new NotFoundError();
    }
    span.finish();
    return result;
};

/**
 * Queries a resource from the database
 * @func
 * @async
 * @param channel {string} the name of the channel
 * @param resourceID {string} the id of the resource
 * @param ctx {object} the tracing context
 * @returns {object} the resource payload
 */
const queryResource = async (channel, resourceID, ctx) => {
    if (channel.endsWith(AUDIT_POSTFIX)) throw new ForbiddenChannelError();

    const span = opentracing.globalTracer()
      .startSpan('MongoDB - findOne from collection', {
          childOf: ctx,
      });
    const collection = client.db(CHANNEL_DB)
      .collection(channel);

    const resource = await collection.findOne({ _id: resourceID });
    if (!resource) throw new NotFoundError();
    // eslint-disable-next-line no-underscore-dangle
    delete resource._id;

    span.finish();
    return resource;
};

/**
 * Queries a the audit history of a resource from the database
 * @func
 * @async
 * @param channel {string} the name of the channel
 * @param resourceID {string} the id of the resource
 * @returns {object} the resource audit history
 */
const queryResourceAudit = async (channel, resourceID) => {
    if (channel.endsWith(AUDIT_POSTFIX)) throw new ForbiddenChannelError();

    const collection = client.db(CHANNEL_DB)
      .collection(`${channel}${AUDIT_POSTFIX}`);

    const auditTrailCursor = await collection.find({
        resourceID,
    }, {
        projection: {
            resourceID: 0,
        }
    });
    if (await auditTrailCursor.count() === 0) throw new NotFoundError();

    return auditTrailCursor.toArray();
};

module.exports = {
    commitResource,
    queryResource,
    queryResourceAudit,
    NotFoundError,
    ForbiddenChannelError,
};
