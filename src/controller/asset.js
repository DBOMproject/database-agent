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

// Create asset on the basis of channelId and assetId
const createAsset = async (requestData) => {
  try {
    const { channelId, assetId, payload } = JSON.parse(requestData);
    const asset = await prisma.asset.create({
      data: {
        channelId,
        assetId,
        payload,
      },
    });
    if (asset) {
      const history = await prisma.history.create({
        data: {
          channelId,
          assetId,
          action: 'CREATE',
          payload: asset,
        },
      });
      log.info(`Added to history: ${JSON.stringify(history)}`);
    }
    log.info(`Asset created: ${JSON.stringify(asset)}`);
    return JSON.stringify(asset);
  } catch (error) {
    log.error(`Failed to create asset: ${error.message}`);
    throw new Error('Failed to create asset');
  }
};

// Get all assets on the basis of channelId
const getAllAsset = async (requestData) => {
  try {
    const { channelId } = JSON.parse(requestData);
    const assets = await prisma.asset.findMany({
      where: {
        channelId,
      },
    });
    log.info(`Found asset/s: ${JSON.stringify(assets)}`);
    return JSON.stringify(assets);
  } catch (error) {
    log.error(`Failed to find asset/s: ${error.message}`);
    throw new Error('Failed to retrieve assets');
  }
};

// Get asset on the basis of channelId and assetId
const getAssetById = async (requestData) => {
  try {
    const { channelId, assetId } = JSON.parse(requestData);
    const asset = await prisma.asset.findMany({
      where: {
        channelId,
        assetId,
      },
    });
    log.info(`Found ${asset.length} asset ${JSON.stringify(asset)}`);
    return JSON.stringify(asset);
  } catch (error) {
    log.error(`Failed to find asset: ${error.message}`);
    throw new Error('Failed to retrieve asset');
  }
};

// Update asset on the basis of channelId and assetId
const updateAsset = async (requestData) => {
  try {
    const { channelId, assetId, payload } = JSON.parse(requestData);
    const asset = await prisma.asset.updateMany({
      where: {
        channelId,
        assetId,
      },
      data: {
        payload,
        modifiedAt: new Date(),
      },
    });
    if (asset) {
      const history = await prisma.history.create({
        data: {
          channelId,
          assetId,
          action: 'UPDATE',
          payload: payload,
        },
      });
      log.info(`Added to history: ${JSON.stringify(history)}`);
    }
    log.info(`Updated asset: ${JSON.stringify(asset)}`);
    return JSON.stringify(asset);
  } catch (error) {
    log.error(`Failed to update asset: ${error.message}`);
    throw new Error('Failed to update asset');
  }
};

// Link asset on the basis of channelId, assetId, and payload
const linkAsset = async (requestData) => {
  try {
    const { channelId, assetId, payload } = JSON.parse(requestData);
    const assetToLink = await prisma.asset.findMany({
      where: {
        channelId,
        assetId,
      },
    });

    if (assetToLink.length === 0) {
      throw new Error('Asset not found');
    }

    const assetToLinkId = assetToLink[0].id;
    const newLinkArray = assetToLink[0].payload;
    const newLinkObject = payload;
    newLinkArray.links.push(newLinkObject);
    const updatedAssetLink = await prisma.asset.update({
      where: {
        id: assetToLinkId,
      },
      data: {
        payload: newLinkArray,
        modifiedAt: new Date(),
      },
    });
    log.info(`Linked asset: ${JSON.stringify(updatedAssetLink)}`);
    if (updatedAssetLink) {
      const history = await prisma.history.create({
        data: {
          channelId,
          assetId,
          action: 'LINK',
          payload: updatedAssetLink,
        },
      });
      log.info(`Added to history: ${JSON.stringify(history)}`);
    }
    return JSON.stringify(updatedAssetLink);
  } catch (error) {
    log.error(`Failed to link asset: ${error.message}`);
    throw new Error('Failed to link asset');
  }
};

// Unlink asset on the basis of channelId, assetId, and linkId
const unlinkAsset = async (requestData) => {
  try {
    const { channelId, assetId, linkId } = JSON.parse(requestData);
    const linkToDeleteId = await prisma.asset.findMany({
      where: {
        channelId,
        assetId,
      },
    });

    if (linkToDeleteId.length === 0) {
      throw new Error('Asset not found');
    }

    const updateAssetId = linkToDeleteId[0].id;
    let updatedPayload = linkToDeleteId[0].payload;
    const updatedLinks = updatedPayload.links.filter(
      (link) => link.id !== linkId
    );
    updatedPayload.links = updatedLinks;

    const updatedAssetLink = await prisma.asset.update({
      where: {
        id: updateAssetId,
      },
      data: {
        payload: updatedPayload,
        modifiedAt: new Date(),
      },
    });
    if (updatedAssetLink) {
      const history = await prisma.history.create({
        data: {
          channelId,
          assetId,
          action: 'UNLINK',
          payload: updatedAssetLink,
        },
      });
      log.info(`Added to history: ${JSON.stringify(history)}`);
    }
    log.info(`Unlinked asset: ${JSON.stringify(updatedAssetLink)}`);
    return JSON.stringify(updatedAssetLink);
  } catch (error) {
    log.error(`Failed to unlink asset: ${error.message}`);
    throw new Error('Failed to unlink asset');
  }
};

// Query assets on the basis of channelId and query
const queryAsset = async (requestData) => {
  try {
    const { channelId, query } = JSON.parse(requestData);
    if (!query.where) {
      query.where = {};
    }
    query.where.channelId = { equals: channelId };

    const asset = await prisma.asset.findMany(query);
    log.info(`Query successful: ${JSON.stringify(asset)}`);
    return JSON.stringify(asset);
  } catch (error) {
    log.error(`Failed to make query: ${error.message}`);
    throw new Error('Failed to make query');
  }
};

// Rich query assets on the basis of channelId, query, fields, limit, and skip
const richQueryAsset = async (requestData) => {
  try {
    const { channelId, query, fields, limit, skip } = JSON.parse(requestData);
    let richQuery = {};
    if (query) {
      richQuery.where = {};
      richQuery.where = JSON.parse(query);
    }

    if (JSON.parse(fields).length) {
      richQuery.select = JSON.parse(fields).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
    }
    richQuery.where.channelId = { equals: channelId };
    if (limit) {
      richQuery.take = Number(limit);
    }
    if (skip) {
      richQuery.skip = Number(skip);
    }

    const asset = await prisma.asset.findMany(richQuery);
    log.info(`Query successful: ${JSON.stringify(asset)}`);
    return JSON.stringify(asset);
  } catch (error) {
    log.error(`Failed to make rich query: ${error.message}`);
    throw new Error('Failed to make rich query');
  }
};

// Audit asset on the basis of channelId and assetId
const auditAsset = async (requestData) => {
  try {
    const { channelId, assetId } = JSON.parse(requestData);
    const asset = await prisma.history.findMany({
      where: {
        channelId,
        assetId,
      },
    });
    log.info(`Found ${asset.length} audit of asset ${JSON.stringify(asset)}`);
    return JSON.stringify(asset);
  } catch (error) {
    log.error(`Failed to audit asset: ${error.message}`);
    throw new Error('Failed to audit asset');
  }
};

module.exports = {
  createAsset,
  getAssetById,
  getAllAsset,
  updateAsset,
  linkAsset,
  unlinkAsset,
  queryAsset,
  richQueryAsset,
  auditAsset,
};
