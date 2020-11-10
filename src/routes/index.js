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

/** Express router providing index related routes
 * @module route/index
 * @requires express
 */
const express = require('express');

/**
 * Express router to mount index related functions on.
 * @type {object}
 * @const
 * @namespace indexRouter
 */
const router = express.Router();

/* GET home page. */
/**
 * Route serving home page
 * @name get/
 * @function
 * @memberof module:route/index~indexRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
// eslint-disable-next-line no-unused-vars
router.get('/', (req, res, next) => {
  res.send('Chainsource DatabaseAgent');
});

module.exports = router;
