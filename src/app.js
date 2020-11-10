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
 * @module database-agent
 * @requires cookie-parser
 * @requires express
 * @requires express-winston
 * @requires route/index
 * @requires route/agent
 * @requires tracer
 * @requires winston
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const winston = require('winston');

const expressWinston = require('express-winston');
const jaegerHelper = require('./utils/tracer');
const indexRouter = require('./routes/index');
const agentRouter = require('./routes/agent');

/**
 * Express app providing pgp related functions.
 * @type {object}
 * @const
 */
const app = express();

app.use(expressWinston.logger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console(),
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf((info) => `${info.timestamp} ${info.level} ${info.message}`),

  ),
  msg: 'HTTP {{req.method}} {{req.url}}',
  ignoredRoutes: ['/'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', indexRouter);
app.use('/channels', agentRouter);
jaegerHelper.setJaegerAsGlobalTracer(jaegerHelper.getJaegerServiceName());

module.exports = app;
