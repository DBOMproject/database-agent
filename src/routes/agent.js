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

/** Express router providing database agent related routes
 * @module route/agent
 * @requires express
 */
const express = require('express');

/**
 * Express router to mount database agent related functions on.
 * @type {object}
 * @const
 * @namespace agentRouter
 */
const router = express.Router();
const log = require('winston');
const opentracing = require('opentracing');
const db = require('../controller/db');
const jaegerHelper = require('../utils/tracer');

const limitErrorString = 'Invalid Limit';
const skipErrorString = 'Invalid Skip';
const filterErrorString = 'Invalid Filter';
const mongoErrorString = 'MongoError';
const syntaxErrorString = 'SyntaxError';
const invalidRequestErrorString = 'Invalid Request';
const notFoundErrorString = 'NotFoundError';
const noResourceErrorString = 'No Such Resource';
const forbiddenChannelErrorString = 'ForbiddenChannelError';
const queryNotAllowedErrorString = 'Query on this channel is not allowed';
const commitNotAllowedErrorString = 'Commit on this channel is not allowed';
const auditNotAllowedErrorString = 'Audit on this channel is not allowed';
const agentQueryErrorString = 'Agent Query Failure';
const agentCommitErrorString = 'Agent Commit Failure';
const agentAuditErrorString = 'Agent Audit Failure';
const recordExistsErrorString = 'Record already exists, use update';
const unauthorizedPayload = {
  success: false,
  status: 'The entity that this agent is authenticated as is not authorized to perform for this operation',
};

router.use(jaegerHelper.injectSpanMiddleware);

/**
 * Route serving the listing of channel ids
 * @name get/
 * @async
 * @function
 * @memberof module:route/agent~agentRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/', async (req, res) => {
  const span = opentracing.globalTracer().startSpan('List Channels', {
    childOf: req.spanContext,
  });

  try {
    const channels = await db.listChannels(span.context());
    res.json(channels);
  } catch (e) {
    log.error(`List Channels Error ${e.toString()}`);
    span.setTag(opentracing.Tags.ERROR, true);
    span.log({ event: 'error', message: e.toString() });
    if (e.name === mongoErrorString && e.code === 13) {
      res.status(401)
        .json(unauthorizedPayload);
    } else if (e.name === notFoundErrorString) {
      res.status(404)
        .json({
          success: false,
          status: noResourceErrorString,
        });
    } else {
      res.status(500)
        .json({
          success: false,
          status: agentQueryErrorString,
          error: e.toString(),
        });
    }
  } finally {
    span.finish();
  }
});

/**
 * Route serving the listing of records ids for a channel
 * @name get/:channel/records/
 * @async
 * @function
 * @memberof module:route/agent~agentRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/:channel/records/', async (req, res) => {
  const span = opentracing.globalTracer().startSpan('List Records', {
    childOf: req.spanContext,
  });

  const { channel } = req.params;
  try {
    const records = await db.listRecords(channel, span.context());
    res.json(records);
  } catch (e) {
    log.error(`List Records ${e.toString()}`);
    span.setTag(opentracing.Tags.ERROR, true);
    span.log({ event: 'error', message: e.toString() });
    if (e.name === mongoErrorString && e.code === 13) {
      res.status(401)
        .json(unauthorizedPayload);
    } else if (e.name === notFoundErrorString) {
      res.status(404)
        .json({
          success: false,
          status: noResourceErrorString,
        });
    } else if (e.name === forbiddenChannelErrorString) {
      res.status(403)
        .json({
          success: false,
          status: queryNotAllowedErrorString,
        });
    } else {
      res.status(500)
        .json({
          success: false,
          status: agentQueryErrorString,
          error: e.toString(),
        });
    }
  } finally {
    span.finish();
  }
});

/**
 * Route serving the querying of records from a channel
 * @name get/:channel/records/_query
 * @async
 * @function
 * @memberof module:route/agent~agentRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/:channel/records/_query', async (req, res) => {
  const span = opentracing.globalTracer().startSpan('Query Records - Get', {
    childOf: req.spanContext,
  });
  const { channel } = req.params;
  const {
    query, limit, skip,
  } = req.query;
  let {
    filter,
  } = req.query;
  try {
    if (filter !== undefined && filter !== null) filter = JSON.parse(filter);
    // eslint-disable-next-line no-use-before-define, max-len
    await handleQueryRecords(res, channel, JSON.parse(query), filter, limit, skip, span.context());
  } catch (e) {
    res.status(400)
      .json({
        success: false,
        status: invalidRequestErrorString,
        error: e.toString(),
      });
  }
  span.finish();
});

/**
 * Route serving the querying of records from a channel
 * @name post/:channel/records/_query
 * @async
 * @function
 * @memberof module:route/agent~agentRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/:channel/records/_query', async (req, res) => {
  const span = opentracing.globalTracer().startSpan('Query Records - Post', {
    childOf: req.spanContext,
  });
  const { channel } = req.params;
  const {
    query, filter, limit, skip,
  } = req.body;
  // eslint-disable-next-line no-use-before-define
  await handleQueryRecords(res, channel, query, filter, limit, skip, span.context());
  span.finish();
});

/**
 * Route serving the creation of a record
 * @name post/:channel/records/
 * @async
 * @function
 * @memberof module:route/agent~agentRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
// eslint-disable-next-line no-unused-vars
router.post('/:channel/records/', async (req, res) => {
  const span = opentracing.globalTracer()
    .startSpan('Commit to database', {
      childOf: req.spanContext,
    });

  const { channel } = req.params;
  const { recordID } = req.body;
  const payload = req.body.recordIDPayload;
  const commitType = req.headers['commit-type'];

  log.info(`Writing on channel ${channel}`);
  log.info(`Writing to recordID ${recordID}`);
  log.debug(`Payload is ${JSON.stringify(payload)}`);
  log.info(`Got Commit-Type ${commitType}`);

  span.log({
    channel,
    recordID,
    commitType,
  });

  try {
    await db.commitResource(channel, recordID, payload, commitType, span.context());
    res.json({
      success: true,
    });
  } catch (e) {
    log.error(`Commit Error ${e}`);
    span.setTag(opentracing.Tags.ERROR, true);
    span.log({ event: 'error', message: e.toString() });
    if (e.name === mongoErrorString && e.code === 11000) {
      res.status(409).json({
        success: false,
        status: recordExistsErrorString,
      });
    } else if (e.name === mongoErrorString && e.code === 13) {
      res.status(401)
        .json(unauthorizedPayload);
    } else if (e.name === forbiddenChannelErrorString) {
      res.status(403)
        .json({
          success: false,
          status: commitNotAllowedErrorString,
        });
    } else if (e.name === notFoundErrorString) {
      res.status(404)
        .json({
          success: false,
          status: noResourceErrorString,
        });
    } else {
      res.status(500)
        .json({
          success: false,
          status: agentCommitErrorString,
          error: e.toString(),
        });
    }
  } finally {
    span.finish();
  }
});

/**
 * Route serving the retrieving a record
 * @name get/:channel/records/:recordID
 * @async
 * @function
 * @memberof module:route/agent~agentRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/:channel/records/:recordID', async (req, res) => {
  const span = opentracing.globalTracer().startSpan('Query from database', {
    childOf: req.spanContext,
  });

  const { channel } = req.params;
  const { recordID } = req.params;

  try {
    const record = await db.queryResource(channel, recordID, span.context());
    res.json(record);
  } catch (e) {
    log.error(`Query Error ${e.toString()}`);
    span.setTag(opentracing.Tags.ERROR, true);
    span.log({ event: 'error', message: e.toString() });
    if (e.name === mongoErrorString && e.code === 13) {
      res.status(401)
        .json(unauthorizedPayload);
    } else if (e.name === notFoundErrorString) {
      res.status(404)
        .json({
          success: false,
          status: noResourceErrorString,
        });
    } else if (e.name === forbiddenChannelErrorString) {
      res.status(403)
        .json({
          success: false,
          status: queryNotAllowedErrorString,
        });
    } else {
      res.status(500)
        .json({
          success: false,
          status: agentQueryErrorString,
          error: e.toString(),
        });
    }
  } finally {
    span.finish();
  }
});

/**
 * Route serving the auditing a record/audit
 * @name get/:channel/records/:recordID
 * @async
 * @function
 * @memberof module:route/agent~agentRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/:channel/records/:recordID/audit', async (req, res) => {
  const span = opentracing.globalTracer().startSpan('Query Audit Trail', {
    childOf: req.spanContext,
  });

  const { channel } = req.params;
  const { recordID } = req.params;

  try {
    const record = await db.queryResourceAudit(channel, recordID);
    res.json({
      history: record,
    });
  } catch (e) {
    log.error(`Audit Error ${e.toString()}`);
    if (e.name === notFoundErrorString) {
      res.status(404)
        .json({
          success: false,
          status: noResourceErrorString,
        });
    } else if (e.name === forbiddenChannelErrorString) {
      res.status(403)
        .json({
          success: false,
          status: auditNotAllowedErrorString,
        });
    } else if (e.name === mongoErrorString && e.code === 13) {
      res.status(401)
        .json(unauthorizedPayload);
    } else {
      res.status(500)
        .json({
          success: false,
          status: agentAuditErrorString,
          error: e.toString(),
        });
    }
  }
  span.finish();
});

/**
 * Common handling of querying records from a channel
 * @func
 * @async
 * @param res {object} the response object
 * @param channel {string} the id of the channel
 * @param query {object} the query to run
 * @param filter {array} the records fields to return
 * @param limit {number} the limit of records to return
 * @param skip {number} the number of records to skip
 * @param ctx {object} the tracing context
 */
async function handleQueryRecords(res, channel, query, filter, limit, skip, ctx) {
  const span = opentracing.globalTracer().startSpan('Handle Query', {
    childOf: ctx,
  });

  try {
    const limitNumber = Number(limit);
    if (limit && Number.isNaN(limitNumber)) {
      throw new Error(limitErrorString);
    }
    const skipNumber = Number(skip);
    if (skip && Number.isNaN(skipNumber)) {
      throw new Error(skipErrorString);
    }
    let filterJSON = null;
    if (filter) {
      if (!Array.isArray(filter)) throw new Error(filterErrorString);
      if (filter.length < 1) throw new Error(filterErrorString);
      // eslint-disable-next-line no-return-assign, no-sequences
      filterJSON = filter.reduce((acc, curr) => (acc[curr] = 1, acc), {});
    } else {
      filterJSON = {};
    }
    // eslint-disable-next-line max-len
    const records = await db.queryRecords(channel, query, filterJSON, limitNumber, skipNumber, span.context());
    const recs = {};
    records.forEach((record) => {
      // eslint-disable-next-line dot-notation
      const id = record['_id'];
      // eslint-disable-next-line no-param-reassign, dot-notation
      delete record['_id'];
      recs[id] = record;
    });
    res.status(200);
    res.json(recs);
  } catch (e) {
    log.error(`Query Records Error ${e.toString()}`);
    span.setTag(opentracing.Tags.ERROR, true);
    span.log({ event: 'error', message: e.toString() });
    if (e.name === mongoErrorString && e.code === 13) {
      res.status(401)
        .json(unauthorizedPayload);
      // eslint-disable-next-line max-len
    } else if (e.name === syntaxErrorString || e.message === filterErrorString || e.message === limitErrorString || e.message === skipErrorString) {
      res.status(400)
        .json({
          success: false,
          status: invalidRequestErrorString,
          error: e.toString(),
        });
    } else if (e.name === notFoundErrorString) {
      res.status(404)
        .json({
          success: false,
          status: noResourceErrorString,
        });
    } else if (e.name === forbiddenChannelErrorString) {
      res.status(403)
        .json({
          success: false,
          status: queryNotAllowedErrorString,
        });
    } else {
      res.status(500)
        .json({
          success: false,
          status: agentQueryErrorString,
          error: e.toString(),
        });
    }
  } finally {
    span.finish();
  }
}

module.exports = router;
