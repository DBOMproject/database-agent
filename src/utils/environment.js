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
 * Gets the uri to connect to mongo db from environmental variables
 * @func
 */
exports.getMongoURIFromEnv = () => {
    const { env } = process;
    if (env.MONGO_URI) return env.MONGO_URI;

    const host = env.MONGO_HOST || 'mongodb';
    const port = env.MONGO_PORT || '27017';
    const user = env.MONGO_USER || 'root';
    const secretPass = env.MONGO_PASS_KEY || 'mongodb-root-password';
    const pass = env[secretPass] || env.MONGO_PASS || 'pass';
    let replicaSetParameter = '';

    if (env.MONGO_REPLICA_SET_NAME && env.MONGO_REPLICA_SET_NAME !== '') {
        replicaSetParameter = `?replicaSet=${env.MONGO_REPLICA_SET_NAME}`;
    }

    return `mongodb://${user}:${pass}@${host}:${port}/${replicaSetParameter}`;
};
