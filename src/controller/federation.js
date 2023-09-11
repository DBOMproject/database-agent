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

const prisma = require('../prisma/index');
const { setupLogs } = require('../utils/logging');
setupLogs();
const log = require('winston');

const {
  updateConnectionStatus,
  updateNodeConnections,
  removeChannelConnection,
} = require('../utils/helper');

// Create a new FederationRequest
const createRequest = async (requestData) => {
  try {
    const { nodeUri, nodeId, channelId } = JSON.parse(requestData);
    const channel = await prisma.channel.findMany({
      where: {
        channelId,
      },
    });

    if (channel.length === 0) {
      log.info(
        `failed to create federation request since channel does not exist`
      );
      return JSON.stringify({
        success: false,
        status: `failed to create federation request since channel does not exist`,
      });
    }

    log.info(`found channel: ${JSON.stringify(channel)}`);

    log.info(
      `creating federation request with nodeId: ${nodeId}, channelId: ${channelId}, nodeUri ${nodeUri}`
    );

    // Check if the federation request already exists for given nodeId and channelId and status is 'AWAITING_ACTION'
    const existingFederation = await prisma.federation.findFirst({
      where: {
        nodeUri,
        nodeId,
        channelId,
        status: 'AWAITING_ACTION',
      },
    });

    if (!existingFederation) {
      // Check if the nodeConnections exists
      const existingNode = await prisma.node.findUnique({
        where: {
          nodeId: process.env.NODE_ID,
        },
        include: {
          nodeConnections: true,
        },
      });

      // Check if the channelId is already in the node's channelConnections
      const isChannelConnected = existingNode.nodeConnections.some(
        (connection) =>
          connection.channelConnections.some(
            (channelConnection) =>
              channelConnection.channelId === channelId &&
              (channelConnection.status === 'REQUEST_ACCEPTED' ||
                channelConnection.status === 'RECEIVED_CONNECTION_REQUEST')
          )
      );

      // If the channelId is not already in the node's channelConnections, add it
      if (!isChannelConnected) {
        const updatedNodeConnections = updateNodeConnections(
          existingNode.nodeConnections,
          nodeId,
          channelId,
          false
        );

        // Update the node's metadata - channelConnections
        const updatedNode = await prisma.node.update({
          where: {
            nodeId: process.env.NODE_ID,
          },
          data: {
            nodeConnections: updatedNodeConnections,
            modifiedAt: new Date(),
          },
        });

        // FederationRequest creation with status 'AWAITING_ACTION'
        const federation = await prisma.federation.create({
          data: {
            nodeUri,
            nodeId,
            channelId,
            status: 'AWAITING_ACTION',
          },
        });

        log.info(`federation request created: ${JSON.stringify(federation)}`);
        log.info(`node metadata updated: ${JSON.stringify(updatedNode)}`);

        return JSON.stringify({
          success: true,
          status: `successfully created federation request`,
        });
      } else {
        log.info(`channel is already connected`);
        return JSON.stringify({
          success: false,
          status: `channel is already connected`,
        });
      }
    } else {
      log.info(`federation request already exists`);
      return JSON.stringify({
        success: false,
        status: `federation request already exists`,
      });
    }
  } catch (error) {
    log.error(`failed to create federation request: ${error}`);
    return JSON.stringify({
      success: false,
      status: `failed to create federation request`,
    });
  }
};

// Get all FederationRequests
const getAllRequests = async () => {
  try {
    const federation = await prisma.federation.findMany({});
    log.info(`found ${federation.length} federation requests`);
    if (federation.length === 0) {
      return JSON.stringify({
        success: true,
        status: `found no federation requests`,
      });
    }
    return JSON.stringify({ success: true, result: federation });
  } catch (error) {
    log.error(`failed to retrieve federation requests: ${error}`);
    return JSON.stringify({
      success: false,
      status: 'failed to retrieve federation requests',
    });
  }
};

// Get one FederationRequest on the basis of requestId
const getOneRequest = async (requestData) => {
  try {
    const { requestId } = JSON.parse(requestData);
    const federation = await prisma.federation.findMany({
      where: {
        requestId,
      },
    });

    log.info(`found ${federation.length} federation request`);
    if (federation.length === 0) {
      return JSON.stringify({
        success: false,
        status: `federation request does not exist`,
      });
    }
    return JSON.stringify({
      success: true,
      result: federation,
    });
  } catch (error) {
    log.error(`failed to retrieve federation request: ${error}`);
    return JSON.stringify({
      success: false,
      status: 'failed to retrieve federation request',
    });
  }
};

// Accept a FederationRequest on the basis of requestId
const acceptRequest = async (requestData) => {
  const { requestId } = JSON.parse(requestData);
  try {
    const federationRequest = await prisma.federation.findMany({
      where: {
        requestId,
        status: 'AWAITING_ACTION',
      },
    });
    if (federationRequest.length) {
      const nodeMetadata = await prisma.node.findMany({
        where: {
          nodeId: process.env.NODE_ID,
        },
      });
      const updateNodeConnection = updateConnectionStatus(
        federationRequest[0].nodeId,
        federationRequest[0].channelId,
        nodeMetadata[0].nodeConnections,
        'FEDERATION_SUCCESS',
        'REQUEST_ACCEPTED',
        false
      );

      const nodeMetaUpdate = await prisma.node.updateMany({
        where: {
          nodeId: process.env.NODE_ID,
        },
        data: {
          nodeConnections: updateNodeConnection,
          modifiedAt: new Date(),
        },
      });
      log.info(`node metadata updated: ${JSON.stringify(nodeMetaUpdate)}`);
      const federation = await prisma.federation.updateMany({
        where: {
          requestId,
          status: 'AWAITING_ACTION',
        },
        data: {
          status: 'REQUEST_ACCEPTED',
          modifiedAt: new Date(),
        },
      });
      log.info(
        `successfully accepted federation request: ${JSON.stringify(
          federation
        )}`
      );
      return JSON.stringify({
        success: true,
        status: 'successfully accepted federation request',
      });
    } else {
      log.info(`request does not exist or already ACCEPTED / REJECTED`);
      return JSON.stringify({
        success: false,
        status: `request does not exist or already ACCEPTED / REJECTED`,
      });
    }
  } catch (error) {
    log.error(`failed to accept federation request: ${error}`);

    return JSON.stringify({
      success: false,
      status: 'failed to accept federation request',
    });
  }
};

// Reject a FederationRequest on the basis of requestId
const rejectRequest = async (requestData) => {
  const { requestId } = JSON.parse(requestData);
  try {
    const federationRequest = await prisma.federation.findMany({
      where: {
        requestId,
        status: 'AWAITING_ACTION',
      },
    });
    if (federationRequest.length) {
      const nodeMetadata = await prisma.node.findMany({
        where: {
          nodeId: process.env.NODE_ID,
        },
      });
      const updateNodeConnection = updateConnectionStatus(
        federationRequest[0].nodeId,
        federationRequest[0].channelId,
        nodeMetadata[0].nodeConnections,
        'FEDERATION_SUCCESS',
        'REQUEST_REJECTED',
        false
      );

      const nodeMetaUpdate = await prisma.node.updateMany({
        where: {
          nodeId: process.env.NODE_ID,
        },
        data: {
          nodeConnections: updateNodeConnection,
          modifiedAt: new Date(),
        },
      });
      log.info(`node metadata updated: ${JSON.stringify(nodeMetaUpdate)}`);
      const federation = await prisma.federation.updateMany({
        where: {
          requestId,
          status: 'AWAITING_ACTION',
        },
        data: {
          status: 'REQUEST_REJECTED',
          modifiedAt: new Date(),
        },
      });
      log.info(
        `successfully rejected federation request: ${JSON.stringify(
          federation
        )}`
      );
      return JSON.stringify({
        success: true,
        status: 'successfully rejected federation request',
      });
    } else {
      log.info(`request does not exist or already ACCEPTED / REJECTED`);
      return JSON.stringify({
        success: false,
        status: `request does not exist or already ACCEPTED / REJECTED`,
      });
    }
  } catch (error) {
    log.error(`failed to reject federation request: ${error}`);
    return JSON.stringify({
      success: false,
      status: 'failed to reject federation request',
    });
  }
};

// Revoke access to a channel on the basis of nodeId and channelId
const revokeAccess = async (requestData) => {
  const { nodeId, channelId } = JSON.parse(requestData);
  try {
    const nodeMetadata = await prisma.node.findMany({
      where: {
        nodeId: process.env.NODE_ID,
      },
    });
    const updateNodeConnection = removeChannelConnection(
      nodeMetadata[0].nodeConnections,
      nodeId,
      channelId
    );

    const nodeMetaUpdate = await prisma.node.updateMany({
      where: {
        nodeId: process.env.NODE_ID,
      },
      data: {
        nodeConnections: updateNodeConnection,
        modifiedAt: new Date(),
      },
    });

    log.info(`successfully revoked access: ${JSON.stringify(nodeMetaUpdate)}`);
    return JSON.stringify({
      success: true,
      status: `successfully revoked access`,
    });
  } catch (error) {
    log.error(`failed to revoke access: ${error}`);
    return JSON.stringify({
      success: false,
      status: 'failed to revoke access',
    });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getOneRequest,
  acceptRequest,
  rejectRequest,
  revokeAccess,
};
