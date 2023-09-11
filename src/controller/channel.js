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

// Create a channel based on the channel data
const createChannel = async (requestData) => {
  try {
    const { channelMeta } = JSON.parse(requestData);
    const { channelId, description, type, notaries } = channelMeta;
    const channel = await prisma.channel.create({
      data: {
        channelId,
        description,
        type,
        notaries,
      },
    });

    log.info(`successfully created channel: ${JSON.stringify(channel)}`);
    return JSON.stringify({
      success: true,
      status: 'successfully created channel',
    });
  } catch (error) {
    log.error(`failed to create channel: ${error}`);
    return JSON.stringify({
      success: false,
      status: `failed to create channel`,
    });
  }
};

// Get all channels
const getAllChannel = async () => {
  try {
    const channels = await prisma.channel.findMany({});
    log.info(`found ${channels.length} channels: ${JSON.stringify(channels)}`);
    return JSON.stringify({ success: true, result: channels });
  } catch (error) {
    log.error(`failed to retrieve channels: ${error}`);
    return JSON.stringify({
      success: false,
      status: `failed to retrieve channels`,
    });
  }
};

// Get channel on the basis of channelId
const getChannelById = async (requestData) => {
  try {
    const { channelId } = JSON.parse(requestData);
    const channel = await prisma.channel.findMany({
      where: {
        channelId,
      },
    });

    log.info(`found ${channel.length} channel ${JSON.stringify(channel)}`);
    return JSON.stringify({ success: true, result: channel });
  } catch (error) {
    log.error(`failed to retrieve channel: ${error}`);
    return JSON.stringify({
      success: false,
      status: `failed to retrieve channel`,
    });
  }
};

// Update channel notary on the basis of channelId and notaryId
const updateChannelNotary = async (requestData) => {
  try {
    const { channelId, notaryId, notaryMeta } = JSON.parse(requestData);
    const channelToUpdate = await prisma.channel.findMany({
      where: {
        channelId,
      },
    });

    if (channelToUpdate.length === 0) {
      log.info(`channel does not exist`);
      return JSON.stringify({
        success: false,
        status: `channel does not exist`,
      });
    }

    const channelToUpdateId = channelToUpdate[0].id;
    const newChannelData = channelToUpdate[0];
    newChannelData.notaries.push({
      id: notaryId.notaryId,
      type: 'SIGNED',
      config: notaryMeta,
    });

    const updatedChannel = await prisma.channel.update({
      where: {
        id: channelToUpdateId,
      },
      data: { notaries: newChannelData.notaries, modifiedAt: new Date() },
    });

    log.info(
      `successfully updated channel notary: ${JSON.stringify(updatedChannel)}`
    );
    if (updatedChannel) {
      return JSON.stringify({
        success: true,
        status: `successfully updated channel notary`,
      });
    }
  } catch (error) {
    log.error(`failed to update channel notary: ${error}`);
    return JSON.stringify({
      success: false,
      status: `failed to update channel notary`,
    });
  }
};

// Delete channel notary on the basis of channelId and notaryId
const deleteChannelNotary = async (requestData) => {
  try {
    const { channelId, notaryId } = JSON.parse(requestData);
    const channelToDelete = await prisma.channel.findMany({
      where: {
        channelId,
      },
    });

    if (channelToDelete.length === 0) {
      log.info(`channel does not exist`);
      return JSON.stringify({
        success: false,
        status: `channel does not exist`,
      });
    }

    const channelToDeleteId = channelToDelete[0].id;
    const newNotaries = channelToDelete[0].notaries.filter(
      (obj) => obj.id !== notaryId
    );

    const updatedChannel = await prisma.channel.update({
      where: {
        id: channelToDeleteId,
      },
      data: { notaries: newNotaries, modifiedAt: new Date() },
    });

    log.info(
      `successfully removed channel notary: ${JSON.stringify(updatedChannel)}`
    );
    if (updatedChannel) {
      return JSON.stringify({
        success: true,
        status: `successfully removed channel notary`,
      });
    }
  } catch (error) {
    log.error(`failed to remove channel notary: ${error}`);
    return JSON.stringify({
      success: false,
      status: `failed to remove channel notary`,
    });
  }
};

module.exports = {
  createChannel,
  getAllChannel,
  getChannelById,
  updateChannelNotary,
  deleteChannelNotary,
};
