/* eslint-disable max-len */
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

/**
 * @typedef {Object} MongoDBTLSParams
 * @property {boolean} enabled - Whether TLS is enforced
 * @property {string} mongoOptions.tlsCAFile - Path to CA's PEM file for mTLS with mongod
 * @property {string} mongoOptions.tlsCertificateKeyFile - Path to client's PEM file for mongodb authorization
 * @property {string|null} mongoOptions.tlsCertificateKeyFilePassword - Password for client's PEM file (if encrypted)
 */

/**
 * Gets the TLS Parameters to connect to MongoDB (if set in the environment)
 * @func
 * @return {MongoDBTLSParams} - TLS environment parameters
 */
const getTLSParams = () => {
  let certPass = null;
  if (process.env.MONGO_TLS_CLIENT_CERT_PASS_KEY !== '') {
    const key = process.env.MONGO_TLS_CLIENT_CERT_PASS_KEY;
    certPass = process.env[key] !== '' ? process.env[key] : null;
  } else if (process.env.MONGO_TLS_CLIENT_CERT_PASS !== '') {
    certPass = process.env.MONGO_TLS_CLIENT_CERT_PASS;
  }

  return {
    enabled: process.env.MONGO_TLS_MODE_ENABLED === '1' || false,
    mongoOptions: {
      tlsCAFile: process.env.MONGO_TLS_CA_CERT_PATH || '',
      tlsCertificateKeyFile: process.env.MONGO_TLS_CLIENT_CERT_PATH || '',
      tlsAllowInvalidHostnames: process.env.MONGO_TLS_ALLOW_INVALID_HOST === '1' || false,
      tlsCertificateKeyFilePassword: certPass,
    },
  };
};

/**
 * Gets the uri to connect to mongo db from environmental variables
 * @func
 * @return string - MongoDB URI
 */
const getMongoURIFromEnv = () => {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || '27017';
  const user = process.env.MONGO_USER || 'root';
  const secretPass = process.env.MONGO_PASS_KEY || 'mongodb-root-password';
  const pass = process.env[secretPass] || process.env.MONGO_PASS || 'pass';
  let replicaSetParameter = '';

  if (process.env.MONGO_REPLICA_SET_NAME && process.env.MONGO_REPLICA_SET_NAME !== '') {
    replicaSetParameter = `?replicaSet=${process.env.MONGO_REPLICA_SET_NAME}`;
  }

  if (getTLSParams().enabled) {
    return `mongodb://${host}:${port}/${replicaSetParameter}`;
  }
  return `mongodb://${user}:${pass}@${host}:${port}/${replicaSetParameter}`;
};

/**
 * Gets the default mongodb database for channel data
 * @return {string}
 */
const getChannelDB = () => process.env.CHANNEL_DB || 'primary';

/**
 * Gets the postfix for audit channels. Must be same as all the database agents
 * @return {string}
 */
const getAuditPostfix = () => process.env.AUDIT_POSTFIX || '_audit';

/**
 * Get the integer value in milliseconds of the server selection timeout
 * @return {number}
 */
const getMongoServerSelectionTimeout = () => parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT, 10) || 3000;

/**
 * Get the integer value in milliseconds of the connection timeout
 * @return {number}
 */
const getMongoConnectionTimeout = () => parseInt(process.env.MONGO_CONNECTION_TIMEOUT, 10) || 3000;

module.exports = {
  getTLSParams,
  getMongoURIFromEnv,
  getChannelDB,
  getAuditPostfix,
  getMongoConnectionTimeout,
  getMongoServerSelectionTimeout,
};
