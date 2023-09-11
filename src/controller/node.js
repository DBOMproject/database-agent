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
// Initialize Node metadata
const initNode = async () => {
  const { env } = process;
  nodeId = env.NODE_ID;
  publicKeys = [];
  nodeConnections = [];
  try {
    log.info(`Initializing node metadata.......`);
    const node = await prisma.node.create({
      data: {
        nodeId,
        publicKeys,
        nodeConnections,
      },
    });
    log.info(`successfully initialized node metadata: ${node}`);
    return JSON.stringify({
      success: true,
      status: `successfully initialized node metadata`,
    });
  } catch (error) {
    log.error(`failed to initialize node: ${error}`);
    return JSON.stringify({
      success: false,
      status: `failed to initialize node`,
    });
  }
};

// Get Node metadata
const getNodeDetails = async () => {
  try {
    const node = await prisma.node.findMany({});
    log.info(`node metadata ${JSON.stringify(node)}`);
    if (node.length) {
      return JSON.stringify({ success: true, result: node });
    } else {
      return JSON.stringify({
        success: false,
        status: `node metadata does not exist`,
      });
    }
  } catch (error) {
    log.error(`failed to retrieve node metadata: ${error}`);
    return JSON.stringify({
      success: false,
      status: `failed to retrieve node metadata`,
    });
  }
};

// Update Node metadata on the basis of the request type received
const updateNodeDetails = async (requestData) => {
  try {
    const { nodeId, channelId, type } = JSON.parse(requestData);
    log.info(
      `received updateNodeDetails request with channelId: ${channelId}, nodeId: ${nodeId}, type: ${type}`
    );
    switch (type) {
      case 'FEDERATION_SUCCESS': {
        // Check if the channelId is already in the node's nodeConnections
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
                channelConnection.status === 'SENT_CONNECTION_REQUEST'
            )
        );
        // If not, add it
        if (!isChannelConnected) {
          const updatedNodeConnections = updateNodeConnections(
            existingNode.nodeConnections,
            nodeId,
            channelId,
            true
          );
          // Update the node's metadata - nodeConnections
          const updatedNode = await prisma.node.update({
            where: {
              nodeId: process.env.NODE_ID,
            },
            data: {
              nodeConnections: updatedNodeConnections,
              modifiedAt: new Date(),
            },
          });

          log.info(
            `successfully updated node metadata: ${JSON.stringify(updatedNode)}`
          );
          return JSON.stringify({
            success: true,
            status: `successfully updated node metadata`,
          });
        } else {
          log.info(`channel is already connected`);
          return JSON.stringify({
            success: false,
            status: `channel is already connected`,
          });
        }
      }
      case 'ACCEPT': {
        const nodeMetadata = await prisma.node.findMany({
          where: {
            nodeId: process.env.NODE_ID,
          },
        });

        const updateNodeConnection = updateConnectionStatus(
          nodeId,
          channelId,
          nodeMetadata[0].nodeConnections,
          'FEDERATION_SUCCESS',
          'CONNECTED',
          true
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
        if (nodeMetaUpdate) {
          log.info(
            `successfully updated node metadata: ${JSON.stringify(
              nodeMetaUpdate
            )}`
          );
          return JSON.stringify({
            success: true,
            status: `successfully updated node metadata`,
          });
        } else {
          return JSON.stringify({
            success: false,
            status: `failed to update node metadata`,
          });
        }
      }
      case 'REJECT': {
        const nodeMetadata = await prisma.node.findMany({
          where: {
            nodeId: process.env.NODE_ID,
          },
        });

        const updateNodeConnection = updateConnectionStatus(
          nodeId,
          channelId,
          nodeMetadata[0].nodeConnections,
          'FEDERATION_SUCCESS',
          'REJECTED',
          true
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

        if (nodeMetaUpdate) {
          log.info(
            `successfully updated node metadata: ${JSON.stringify(
              nodeMetaUpdate
            )}`
          );
          return JSON.stringify({
            success: true,
            status: `successfully updated node metadata`,
          });
        } else {
          return JSON.stringify({
            success: false,
            status: `failed to update node metadata`,
          });
        }
      }
      case 'REVOKE': {
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
        if (nodeMetaUpdate) {
          log.info(
            `successfully updated node metadata: ${JSON.stringify(
              nodeMetaUpdate
            )}`
          );
          return JSON.stringify({
            success: true,
            status: `successfully updated node metadata`,
          });
        } else {
          return JSON.stringify({
            success: false,
            status: `failed to update node metadata`,
          });
        }
      }
      default:
        return JSON.stringify({
          success: false,
          status: `something went wrong`,
        });
    }
  } catch (error) {
    log.error(`failed to update node metadata: ${error}`);
    return JSON.stringify({
      success: false,
      status: 'failed to update node metadata',
    });
  }
};

module.exports = {
  initNode,
  getNodeDetails,
  updateNodeDetails,
};
