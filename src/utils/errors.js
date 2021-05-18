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
 * Classes for error handling
 * @module errors
 */

/**
 * Creates a forbidden channel error
 * @constructor
 */
class ForbiddenChannelError extends Error {
  constructor() {
    super();
    this.name = this.constructor.name;
    this.message = 'Forbidden Channel';
    this.code = 403;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Creates a not found error
 * @constructor
 */
class NotFoundError extends Error {
  constructor() {
    super();
    this.name = this.constructor.name;
    this.message = 'Not Found';
    this.code = 404;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  NotFoundError,
  ForbiddenChannelError,
};
