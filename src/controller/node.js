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
// Initialize Node _metadata
const initNode = async () => {
  const { env } = process;
  nodeId = env.NODE_ID;
  publicKeys = [];
  nodeConnections = [];
  try {
    const node = await prisma.node.create({
      data: {
        nodeId,
        publicKeys,
        nodeConnections,
      },
    });
    log.info(`Node _metadata ${JSON.stringify(node)}`);
    return JSON.stringify(node);
  } catch (error) {
    log.error(`Failed to init node: ${error}`);
    throw new Error('Failed to initialize node');
  }
};

// Get Node _metadata
const getNodeDetails = async () => {
  try {
    const node = await prisma.node.findMany({});
    log.info(`Node _metadata ${JSON.stringify(node)}`);
    return JSON.stringify(node);
  } catch (error) {
    log.error(`Failed to list node details: ${error}`);
    throw new Error('Failed to retrieve node details');
  }
};

// Update Node _metadata on the basis of the request type received
const updateNodeDetails = async (requestData) => {
  try {
    const { nodeId, channelId, type } = JSON.parse(requestData);
    log.info(
      `Received Request channelId - ${channelId}, nodeId - ${nodeId}, type - ${type}`
    );
    switch (type) {
      case 'FEDERATION_SUCCESS':
        {
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
            // Update the node's _metadata - nodeConnections
            const updatedNode = await prisma.node.update({
              where: {
                nodeId: process.env.NODE_ID,
              },
              data: {
                nodeConnections: updatedNodeConnections,
                modifiedAt: new Date(),
              },
            });

            log.info(`Node _metadata updated ${JSON.stringify(updatedNode)}`);
          } else {
            log.info(
              `Node - ChannelId ${channelId} is already connected within channelConnections. Skipping update.`
            );
          }
        }
        break;
      case 'ACCEPT':
        {
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

          log.info('Node _metadata update success', nodeMetaUpdate);
        }
        break;
      case 'REJECT':
        {
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

          log.info('Node _metadata update success', nodeMetaUpdate);
        }
        break;
      case 'REVOKE':
        {
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
          log.info('Node _metadata update success', nodeMetaUpdate);
        }
        break;
      default:
        break;
    }
  } catch (error) {
    log.error(`Failed to update node: ${error}`);
    throw new Error('Failed to update node');
  }
};

module.exports = {
  initNode,
  getNodeDetails,
  updateNodeDetails,
};
