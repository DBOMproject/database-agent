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

const winston = require('winston');
// eslint-disable-next-line import/no-extraneous-dependencies
const prepare = require('mocha-prepare');
// eslint-disable-next-line import/no-extraneous-dependencies
const sinon = require('sinon');
const dbHandler = require('./db-handler');

prepare(
  // before hook
  async (done) => {
    winston.configure({ silent: true });
    sinon.stub(process, 'exit');
    await dbHandler.connect();
    process.env.MONGO_PORT = await dbHandler.getPort();
    done();
  },
  // after hook
  async (done) => {
    await dbHandler.closeDatabase();
    sinon.restore();
    done();
  },
);
