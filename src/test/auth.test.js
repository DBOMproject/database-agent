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
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const db = require('../controller/db');

const { expect } = chai;
const {
  before, after, describe, it,
} = require('mocha');

chai.use(chaiHttp);
chai.use(sinonChai);
const app = require('../app');

describe('Bad Authorization', () => {
  // minimal mock of a mongoDB authorization error
  const mongoDBPermissionErrorMock = {
    ok: 0,
    errmsg: 'not authorized on primary to execute command {}',
    code: 13,
    codeName: 'Unauthorized',
    name: 'MongoError',
  };

  before((done) => {
    sinon.stub(db, 'commitResource')
      .rejects(mongoDBPermissionErrorMock);
    sinon.stub(db, 'queryRecords')
      .rejects(mongoDBPermissionErrorMock);
    sinon.stub(db, 'queryResource')
      .rejects(mongoDBPermissionErrorMock);
    sinon.stub(db, 'queryResourceAudit')
      .rejects(mongoDBPermissionErrorMock);
    sinon.stub(db, 'listChannels')
      .rejects(mongoDBPermissionErrorMock);
    sinon.stub(db, 'listRecords')
      .rejects(mongoDBPermissionErrorMock);
    // eslint-disable-next-line global-require
    // app = require('../app');
    done();
  });

  after(() => {
    sinon.restore();
  });

  it('when a commit occurs', (done) => {
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
          .status(401);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
  it('when a retrieve occurs', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/test')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(401);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
  it('when a query occurs', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/_query?query={}')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(401);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
  it('when a query post occurs', (done) => {
    chai
      .request(app)
      .post('/channels/test/records/_query')
      .send({ query: {} })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(401);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
  it('when a audit query occurs', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/test/audit')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(401);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
  it('when a list channels occurs', (done) => {
    chai
      .request(app)
      .get('/channels/')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(401);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
  it('when a list records occurs', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(401);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
});
