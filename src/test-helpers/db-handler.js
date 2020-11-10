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

// tests/db-handler.js

// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');

const mongod = new MongoMemoryServer({ binary: { version: '4.2.6' }, instance: { port: 27071 } });

/**
 * Connect to the in-memory database.
 */
module.exports.connect = async () => {
  const uri = await mongod.getUri();
  process.env.MONGO_PORT = await mongod.getPort();

  const mongooseOpts = {
    useNewUrlParser: true,
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
  };

  await mongoose.connect(uri, mongooseOpts);

};

/**
 * Prepare a fake audit entry for tests
 */
module.exports.prepareFakeAudit = async () => {
  let client = await new MongoClient(await mongod.getUri(), {
    useNewUrlParser: true,
  }).connect();
  await client.db(process.env.CHANNEL_DB || 'primary')
    .collection('test_audit')
    .insertOne({
      resourceID: 'test'
    });
};

/**
 * Connect to the in-memory database.
 */
module.exports.getPort = async () => {
  const port = await mongod.getPort();
  return port;
};

/**
 * Drop database, close the connection and stop mongod.
 */
module.exports.closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};
