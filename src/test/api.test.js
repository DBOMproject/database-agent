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
const { prepareFakeAudit } = require('../test-helpers/db-handler');

const { expect } = chai;
chai.use(chaiHttp);
chai.use(sinonChai);

let app;
process.env.MONGO_URI = 'mongodb://127.0.0.1:27071';

before((done) => {
  decache('../app');
  // eslint-disable-next-line global-require
  app = require('../app');
  done();
});

describe('Index', () => {
  it('Index', (done) => {
    chai
      .request(app)
      .get('/')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(res.text)
          .to
          .equals('Chainsource DatabaseAgent');
        done();
      });
  });
});

describe('Create', () => {
  it('Create New', (done) => {
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
          .status(200);
        expect(res.body.success)
          .to
          .equals(true);
        done();
      });
  });
  it('Create New Existing', (done) => {
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
          .status(409);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
  it('Create Audit Channel', (done) => {
    chai
      .request(app)
      .post('/channels/test_audit/records')
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
          .status(403);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
});

describe('Get', () => {
  it('Get Existing', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/test')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(res.body.test)
          .to
          .equals('test');
        done();
      });
  });
  it('Get Missing', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/missing')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(404);
        expect(res.body.status)
          .to
          .equals('No Such Resource');
        done();
      });
  });
  it('Get Channel', (done) => {
    chai
      .request(app)
      .get('/channels/missing/records/missing')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(404);
        expect(res.body.status)
          .to
          .equals('No Such Resource');
        done();
      });
  });
  it('Get No ChannelID ', (done) => {
    chai
      .request(app)
      .get('/channels//records/test')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(404);
        done();
      });
  });
  it('Get No AssetID', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(404);
        done();
      });
  });
  it('Get Audit Channel', (done) => {
    chai
      .request(app)
      .get('/channels/_audit/records/test')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(403);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
});

describe('Update', () => {
  it('Update Existing', (done) => {
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'UPDATE')
      .send({
        recordID: 'test',
        recordIDPayload: {
          test: 'test update',
        },
      })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(res.body.success)
          .to
          .equals(true);
        done();
      });
  });
  it('Update Missing', (done) => {
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'UPDATE')
      .send({
        recordID: 'missing',
        recordIDPayload: {
          test: 'test',
        },
      })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(404);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
});

describe('Audit', () => {
  it('Audit Existing', (done) => {
    prepareFakeAudit()
      .then(() => {
        chai
          .request(app)
          .get('/channels/test/records/test/audit')
          .end((err, res) => {
            expect(res)
              .to
              .have
              .status(200);
            done();
          });
      });
  });
  it('Audit Missing', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/missing/audit')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(404);
        expect(res.body.status)
          .to
          .equals('No Such Resource');
        done();
      });
  });
  it('Audit Audit Channel', (done) => {
    chai
      .request(app)
      .get('/channels/_audit/records/test/audit')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(403);
        expect(res.body.success)
          .to
          .equals(false);
        done();
      });
  });
});
