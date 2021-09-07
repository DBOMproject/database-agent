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

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinonChai = require('sinon-chai');
const decache = require('decache');
const {
  before,
  describe,
  it,
} = require('mocha');
const dbHandler = require('../test-helpers/db-handler');

const { expect } = chai;
chai.use(chaiHttp);
chai.use(sinonChai);

let app;
const { prepareEmptyDB } = require('../test-helpers/db-handler');

before((done) => {
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27071';
  process.env.CHANNEL_DB = 'empty';
  // sinon.stub(MongoClient.Db, 'listCollections')
  //  .resolves([]);
  decache('../app');
  dbHandler.connect();
  // eslint-disable-next-line global-require
  app = require('../app');
  done();
});

describe('List Channels', () => {
  it('List Channels Error', (done) => {
    prepareEmptyDB()
      .then(() => {
        chai
          .request(app)
          .get('/channels/')
          .end((err, res) => {
            expect(res)
              .to
              .have
              .status(404);
            expect(res.body.success)
              .to
              .equal(false);
            done();
          });
      });
  });
});
