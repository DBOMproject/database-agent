/*
 *  Copyright 2023 Unisys Corporation
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
const { connect, StringCodec } = require('nats');

// Reading NATS_URI from environment variable
const servers = [{ servers: process.env.NATS_URI }];
// create a codec
const sc = StringCodec();

const { setupLogs } = require('./utils/logging');
setupLogs();
const log = require('winston');

const prisma = require('./prisma');

// Importing controllers for various functionalities
const {
  createChannel,
  getAllChannel,
  getChannelById,
  updateChannelNotary,
  deleteChannelNotary,
} = require('./controller/channel');

const {
  getAllAsset,
  getAssetById,
  createAsset,
  updateAsset,
  richQueryAsset,
  queryAsset,
  linkAsset,
  unlinkAsset,
  auditAsset,
} = require('./controller/asset');

const {
  createRequest,
  getAllRequests,
  getOneRequest,
  acceptRequest,
  rejectRequest,
  revokeAccess,
} = require('./controller/federation');

const {
  initNode,
  getNodeDetails,
  updateNodeDetails,
} = require('./controller/node');

// Iterate through the NATS server configurations
servers.forEach(async (v) => {
  try {
    // Check if the node's _metadata exists in the database
    const node = await prisma.node.findMany({});
    log.info(`Node _metadata Found ${JSON.stringify(node)}`);
    if (node.length === 0) {
      // If not, initialize the node
      await initNode();
    }
  } catch (error) {
    log.error(`Failed to list node details: ${error}`);
  }

  // Connect to NATS
  const nc = await connect(v);

  // Handling NATS node events
  const nodeSubscriptionEvents = nc.subscribe('node.*');
  (async (sub) => {
    // Listen for node-related requests
    log.info(`listening for ${sub.getSubject()} requests [ details ]`);
    for await (const m of sub) {
      const chunks = m.subject.split('.');
      log.info(`[node] #${sub.getProcessed()} handling [${chunks[1]}]`);
      switch (chunks[1]) {
        case 'details': {
          const result = await getNodeDetails(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'update': {
          const result = await updateNodeDetails(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        default:
          m.respond(sc.encode('Incorrect Node Request'));
      }
    }
  })(nodeSubscriptionEvents);

  // Handling NATS asset events
  const assetSubscriptionEvents = nc.subscribe('asset.*');
  (async (sub) => {
    // Listen for asset-related requests
    log.info(
      `listening for ${sub.getSubject()} requests [all | one | create | update | richQuery | query | audit | link | unlink | validate ]`
    );
    for await (const m of sub) {
      const chunks = m.subject.split('.');
      log.info(`[asset] #${sub.getProcessed()} handling [${chunks[1]}]`);
      switch (chunks[1]) {
        // Handle different asset requests
        case 'all': {
          const result = await getAllAsset(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'one': {
          const result = await getAssetById(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'create': {
          const result = await createAsset(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'update': {
          const result = await updateAsset(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'richquery': {
          const result = await richQueryAsset(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'query': {
          const result = await queryAsset(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'link': {
          const result = await linkAsset(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'unlink': {
          const result = await unlinkAsset(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'audit': {
          const result = await auditAsset(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        default:
          m.respond(sc.encode('Incorrect Asset Request'));
      }
    }
  })(assetSubscriptionEvents);

  // Handling NATS channel events
  const channelSubscriptionEvents = nc.subscribe('channel.*');
  (async (sub) => {
    // Listen for channel-related requests
    log.info(
      `listening for ${sub.getSubject()} requests [ all | one | create | update | delete ]`
    );
    for await (const m of sub) {
      const chunks = m.subject.split('.');
      log.info(`[channel] #${sub.getProcessed()} handling [${chunks[1]}]`);
      switch (chunks[1]) {
        // Handle different channel requests
        case 'all': {
          const result = await getAllChannel(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'one': {
          const result = await getChannelById(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'create': {
          const result = await createChannel(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'update': {
          const result = updateChannelNotary(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'delete': {
          const result = deleteChannelNotary(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        default:
          m.respond(sc.encode('Incorrect Channel Request'));
      }
    }
  })(channelSubscriptionEvents);

  // Handling NATS federation events
  const federationSubscriptionEvents = nc.subscribe('federation.*');
  (async (sub) => {
    // Listen for federation-related requests
    log.info(
      `listening for ${sub.getSubject()} requests [ create | all | one | accept | reject | revoke ]`
    );
    for await (const m of sub) {
      const chunks = m.subject.split('.');
      log.info(`[federation] #${sub.getProcessed()} handling [${chunks[1]}]`);
      switch (chunks[1]) {
        // Handle different federation requests
        case 'create': {
          const result = await createRequest(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'all': {
          const result = await getAllRequests(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'one': {
          const result = await getOneRequest(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'accept': {
          const result = await acceptRequest(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'reject': {
          const result = await rejectRequest(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        case 'revoke': {
          const result = await revokeAccess(sc.decode(m.data));
          m.respond(sc.encode(result));
          break;
        }
        default:
          m.respond(sc.encode('Incorrect Channel Request'));
      }
    }
  })(federationSubscriptionEvents);

  // Wait for the client to close here.
  nc.closed().then((err) => {
    let m = `connection to ${nc.getServer()} closed`;
    if (err) {
      m = `${m} with an error: ${err.message}`;
    }
    log.info(m);
  });
});
