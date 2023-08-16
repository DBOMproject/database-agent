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

const updateConnectionStatus = (
  nodeId,
  channelId,
  nodeConnectionsObj,
  federatedStatus,
  connectionStatus,
  isLocal
) => {
  const updatedConnections = nodeConnectionsObj.map(item => {
    if (item.nodeId === nodeId) {
      const matchingConnection = item.channelConnections.find(
        connection => connection.channelId === channelId && connection.status === (isLocal ? 'SENT_CONNECTION_REQUEST' : 'RECEIVED_CONNECTION_REQUEST')
      );

      if (matchingConnection) {
        matchingConnection.status = connectionStatus;
        item.status = federatedStatus;
      }
    }
    return item;
  });

  return updatedConnections;
};

const updateNodeConnections = (existingNodeConnections, nodeId, channelId, isLocal) => {
  let matchedNode = existingNodeConnections.find(item => item.nodeId === nodeId);

  if (!matchedNode) {
    matchedNode = {
      nodeId,
      status: 'FEDERATION_SUCCESS',
      channelConnections: [],
    };
    existingNodeConnections.push(matchedNode);
  }

  matchedNode.channelConnections.push({
    channelId,
    status: isLocal ? 'SENT_CONNECTION_REQUEST' : 'RECEIVED_CONNECTION_REQUEST',
    access: 'READ',
  });

  return existingNodeConnections;
};


const removeChannelConnection = (existingNodeConnections, nodeId, channelId) => {
  const nodeIndex = existingNodeConnections.findIndex(item => item.nodeId === nodeId);

  if (nodeIndex !== -1) {
    if (channelId === undefined) {
      existingNodeConnections.splice(nodeIndex, 1);
    } else {
      const node = existingNodeConnections[nodeIndex];
      node.channelConnections = node.channelConnections.filter(connection => connection.channelId !== channelId);
    }
  }

  return existingNodeConnections;
};

module.exports = {
  updateConnectionStatus,
  updateNodeConnections,
  removeChannelConnection,
};
