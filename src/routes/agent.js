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

const unauthorizedPayload = {
  success: false,
  status: 'The entity that this agent is authenticated as is not authorized to perform for this operation',
};

router.use(jaegerHelper.injectSpanMiddleware);

/* GET home page. */
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
    if (e.name === 'MongoError' && e.code === 11000) {
      res.status(409).json({
        success: false,
        status: 'Record already exists, use update',
      });
    } else if (e.name === 'MongoError' && e.code === 13) {
      res.status(401)
        .json(unauthorizedPayload);
    } else if (e.name === 'ForbiddenChannelError') {
      res.status(403)
        .json({
          success: false,
          status: 'You are not allowed to commit to this channel',
        });
    } else if (e.name === 'NotFoundError') {
      res.status(404)
        .json({
          success: false,
          status: 'No Such Resource',
        });
    } else {
      res.status(500)
        .json({
          success: false,
          status: 'Agent Commit Failure',
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
    if (e.name === 'MongoError' && e.code === 13) {
      res.status(401)
        .json(unauthorizedPayload);
    } else if (e.name === 'NotFoundError') {
      res.status(404)
        .json({
          success: false,
          status: 'No Such Resource',
        });
    } else if (e.name === 'ForbiddenChannelError') {
      res.status(403)
        .json({
          success: false,
          status: 'You are not allowed to query from this channel',
        });
    } else {
      res.status(500)
        .json({
          success: false,
          status: 'Agent Query Failure',
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
    if (e.name === 'NotFoundError') {
      res.status(404)
        .json({
          success: false,
          status: 'No Such Resource',
        });
    } else if (e.name === 'ForbiddenChannelError') {
      res.status(403)
        .json({
          success: false,
          status: 'You are not allowed to query audit trail from this channel',
        });
    } else if (e.name === 'MongoError' && e.code === 13) {
      res.status(401)
        .json(unauthorizedPayload);
    } else {
      res.status(500)
        .json({
          success: false,
          status: 'Agent Audit Failure',
          error: e.toString(),
        });
    }
  }
  span.finish();
});

module.exports = router;
