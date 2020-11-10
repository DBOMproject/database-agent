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
const { expect } = chai;
const decache = require('decache');
const { before, describe, it } = require('mocha');

chai.use(chaiHttp);
let app;

before((done) => {
  process.env.MONGO_URI = '';
  decache('../app');
  // eslint-disable-next-line global-require
  app = require('../app');
  done();
});

describe('Bad Connection', () => {
  it('Audit Bad Connection', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/test/audit')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(500);
        done();
      });
  });
  it('Create Bad Connection', (done) => {
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'CREATE')
      .send({
        recordID: 'test',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(500);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
  it('Get Bad Connection', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/test')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(500);
        done();
      });
  });
});

