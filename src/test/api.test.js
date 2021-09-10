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
  process.env.CHANNEL_DB = 'primary';
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
          test2: 'test',
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
  it('Create New 2', (done) => {
    chai
      .request(app)
      .post('/channels/test/records')
      .set('commit-type', 'CREATE')
      .send({
        recordID: 'test2',
        recordIDPayload: {
          test: 'test2',
          test2: 'test2',
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

describe('List Channels', () => {
  it('List Channels', (done) => {
    chai
      .request(app)
      .get('/channels/')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(res.body.length)
          .to
          .equal(1);
        expect(res.body)
          .to
          .contain('test');
        done();
      });
  });
});

describe('List Channel Assets', () => {
  it('List Channel Assets', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(res.body.length)
          .to
          .equal(2);
        expect(res.body)
          .to
          .contain('test');
        expect(res.body)
          .to
          .contain('test2');
        done();
      });
  });
  it('List Bad Channel', (done) => {
    chai
      .request(app)
      .get('/channels/bad/records')
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
  it('List Audit Channel', (done) => {
    chai
      .request(app)
      .get('/channels/_audit/records')
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

describe('Query Channel Assets', () => {
  it('Query Channel Assets', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/_query?query={}')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(Object.keys(res.body).length)
          .to
          .equal(2);
        expect(res.body)
          .to
          .have
          .property('test');
        expect(res.body)
          .to
          .have
          .property('test2');
        expect(res.body.test)
          .to
          .have
          .property('test');
        expect(res.body.test)
          .to
          .have
          .property('test2');
        done();
      });
  });
  it('Query Channel Assets None', (done) => {
    chai
      .request(app)
      .get('/channels/none/records/_query?query={}')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(404);
        done();
      });
  });
  it('Query Channel Assets Limit', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/_query?query={}&limit=1')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(Object.keys(res.body).length)
          .to
          .equal(1);
        expect(res.body)
          .to
          .have
          .property('test');
        done();
      });
  });
  it('Query Channel Assets Bad Limit', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/_query?query={}&limit=one')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(400);
        done();
      });
  });
  it('Query Channel Assets Skip', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/_query?query={}&limit=1&skip=1')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(Object.keys(res.body).length)
          .to
          .equal(1);
        expect(res.body)
          .to
          .not
          .have
          .property('test');
        expect(res.body)
          .to
          .have
          .property('test2');
        done();
      });
  });
  it('Query Channel Assets Bad Skip', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/_query?query={}&limit=1&skip=one')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(400);
        done();
      });
  });
  it('Query Channel Assets Filter', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/_query?query={}&filter=["test"]')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(Object.keys(res.body).length)
          .to
          .equal(2);
        expect(res.body)
          .to
          .have
          .property('test');
        expect(res.body.test)
          .to
          .have
          .property('test');
        expect(res.body.test)
          .to
          .not
          .have
          .property('test2');
        done();
      });
  });
  it('Query Channel Assets Bad Filter', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/_query?query={}&filter="test"')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(400);
        done();
      });
  });
  it('Query Channel Assets Bad Filter Parse', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/_query?query={}&filter={test')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(400);
        done();
      });
  });
  it('Query Channel Assets Missing Filter', (done) => {
    chai
      .request(app)
      .get('/channels/test/records/_query?query={}&filter=[]')
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(400);
        done();
      });
  });
  it('Query Audit Channel', (done) => {
    chai
      .request(app)
      .get('/channels/_audit/records/_query?query={}')
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

describe('Query Channel Assets - Post', () => {
  it('Query Channel Assets', (done) => {
    chai
      .request(app)
      .post('/channels/test/records/_query')
      .send({ query: {} })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(Object.keys(res.body).length)
          .to
          .equal(2);
        expect(res.body)
          .to
          .have
          .property('test');
        expect(res.body)
          .to
          .have
          .property('test2');
        expect(res.body.test)
          .to
          .have
          .property('test');
        expect(res.body.test)
          .to
          .have
          .property('test2');
        done();
      });
  });
  it('Query Channel Assets None', (done) => {
    chai
      .request(app)
      .post('/channels/none/records/_query')
      .send({ query: {} })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(404);
        done();
      });
  });
  it('Query Channel Assets Limit', (done) => {
    chai
      .request(app)
      .post('/channels/test/records/_query')
      .send({ query: {}, limit: 1 })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(Object.keys(res.body).length)
          .to
          .equal(1);
        expect(res.body)
          .to
          .have
          .property('test');
        done();
      });
  });
  it('Query Channel Assets Bad Limit', (done) => {
    chai
      .request(app)
      .post('/channels/test/records/_query')
      .send({ query: {}, limit: 'one' })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(400);
        done();
      });
  });
  it('Query Channel Assets Skip', (done) => {
    chai
      .request(app)
      .post('/channels/test/records/_query')
      .send({ query: {}, limit: 1, skip: 1 })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(Object.keys(res.body).length)
          .to
          .equal(1);
        expect(res.body)
          .to
          .not
          .have
          .property('test');
        expect(res.body)
          .to
          .have
          .property('test2');
        done();
      });
  });
  it('Query Channel Assets Bad Skip', (done) => {
    chai
      .request(app)
      .post('/channels/test/records/_query')
      .send({ query: {}, limit: 1, skip: 'one' })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(400);
        done();
      });
  });
  it('Query Channel Assets Filter', (done) => {
    chai
      .request(app)
      .post('/channels/test/records/_query')
      .send({ query: {}, filter: ['test'] })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(200);
        expect(Object.keys(res.body).length)
          .to
          .equal(2);
        expect(res.body)
          .to
          .have
          .property('test');
        expect(res.body.test)
          .to
          .have
          .property('test');
        expect(res.body.test)
          .to
          .not
          .have
          .property('test2');
        done();
      });
  });
  it('Query Channel Assets Bad Filter', (done) => {
    chai
      .request(app)
      .post('/channels/test/records/_query')
      .send({ query: {}, filter: 'test' })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(400);
        done();
      });
  });
  it('Query Channel Assets Missing Filter', (done) => {
    chai
      .request(app)
      .post('/channels/test/records/_query?query={}')
      .send({ query: {}, filter: [] })
      .end((err, res) => {
        expect(res)
          .to
          .have
          .status(400);
        done();
      });
  });
  it('Query Audit Channel', (done) => {
    chai
      .request(app)
      .post('/channels/_audit/records/_query')
      .send({ query: {} })
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
    process.env.CHANNEL_DB = 'primary';
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
