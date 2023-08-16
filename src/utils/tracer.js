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

/** Handles tracing through Jaeger
 * @module tracer
 * @requires winston
 * @requires jaeger-client
 * @requires opentracing
 * @requires node-caches
 */
const logger = require('winston');
const initJaegerTracer = require('jaeger-client').initTracer;
const opentracing = require('opentracing');
const NodeCache = require('node-cache');

const myCache = new NodeCache();
const jaegerConfigurationKey = 'jaegerConfiguration';

const getJaegerEnabled = function () {
  return process.env.JAEGER_ENABLED === 'true' || false;
};

const getJaegerHost = function () {
  return process.env.JAEGER_HOST;
};

const getJaegerSamplerType = function () {
  return process.env.JAEGER_SAMPLER_TYPE || 'const';
};

const getJaegerSamplerParam = function () {
  return Number(process.env.JAEGER_SAMPLER_PARAM || 1);
};

/**
 * Gets the jaeger service name from the env variable
 * @func
 */
const getJaegerServiceName = function () {
  return process.env.JAEGER_SERVICE_NAME || 'Database Agent';
};

const getJaegerAgentSidecarEnabled = function () {
  return process.env.JAEGER_AGENT_SIDECAR_ENABLED === 'true' || false;
};

/**
 * Build a tracing configuration
 * @func
 * @param jaegerEnabled {boolean} is jaeger enabled
 * @param jaegerHost {string} the jaeger host to send traces to
 * @param jaegerSamplerType {string} type of sampler to use
 * @param jaegerSamplerParam {string} param required for some sampler types
 * @see [jaeger sampler documentation]{@link https://www.jaegertracing.io/docs/1.19/sampling/}
 */
// eslint-disable-next-line max-len
const buildTracingConfiguration = function (
  jaegerEnabled,
  jaegerHost,
  jaegerSamplerType,
  jaegerSamplerParam
) {
  log.debug('Build Jaeger Tracing Configuration');
  log.debug(`Jaeger Enabled: ${jaegerEnabled}`);
  if (jaegerEnabled) {
    log.debug(`Jaeger Host: ${jaegerHost}`);
    log.debug(`Jaeger Sampler Type: ${jaegerSamplerType}`);
    log.debug(`Jaeger Sampler Param: ${jaegerSamplerParam}`);
    log.debug(`Jaeger Sidecar Enabled: ${getJaegerAgentSidecarEnabled()}`);
  } else {
    log.debug('Jaeger Disabled, will use opentracing.NoopTracer');
  }
  if (getJaegerAgentSidecarEnabled()) {
    return {
      disabled: !jaegerEnabled,
      sampler: {
        type: jaegerSamplerType,
        param: jaegerSamplerParam,
      },
    };
  }
  return {
    disabled: !jaegerEnabled,
    sampler: {
      type: jaegerSamplerType,
      param: jaegerSamplerParam,
    },
    reporter: {
      agentHost: jaegerHost,
    },
  };
};

/**
 * Initializes the tracing configuration
 * @func
 */
const initTracingConfiguration = function () {
  log.debug('Initializing Jaeger Tracing Configuration');
  const jaegerEnabled = getJaegerEnabled();
  const jaegerHost = getJaegerHost();
  const jaegerSamplerType = getJaegerSamplerType();
  const jaegerSamplerParam = getJaegerSamplerParam();
  // eslint-disable-next-line max-len
  const config = buildTracingConfiguration(
    jaegerEnabled,
    jaegerHost,
    jaegerSamplerType,
    jaegerSamplerParam
  );
  myCache.set(jaegerConfigurationKey, config);
  return config;
};

/**
 * Gets the tracing configuration
 * @func
 */
const getTracingConfiguration = function () {
  log.debug('Get Jaeger Tracing Configuration');
  let config = myCache.get(jaegerConfigurationKey);
  if (!config) config = initTracingConfiguration();
  return config;
};

/**
 * Sets the tracing configuration
 * @func
 */
const setTracingConfiguration = function (newConfig) {
  log.debug('Set Jaeger Tracing Configuration');
  const config = getTracingConfiguration();
  Object.assign(config, newConfig);
  myCache.set('jaegerConfiguration', config);
  return config;
};

/**
 * Initialize the tracer with a service name
 * @param serviceName {string} the service using the tracer
 * @func
 */
function initTracer(serviceName) {
  const config = getTracingConfiguration();
  if (
    config.disabled !== true &&
    !getJaegerAgentSidecarEnabled() &&
    !getJaegerHost()
  ) {
    log.error(
      'JAEGER_ENABLED is set to true but no agent address or sidecar configured to send traces to.\n' +
        ' Either set JAEGER_ENABLED to false or set one of JAEGER_HOST or JAEGER_AGENT_SIDECAR_ENABLED to their ' +
        'appropriate values.'
    );
    throw new Error('Inconsistent jaeger environment variables');
  }
  config.serviceName = serviceName;
  config.logSpans = true;
  const options = {
    logger: {
      info: function logInfo(msg) {
        log.info(msg);
      },
      error: function logError(msg) {
        log.error(msg);
      },
    },
  };
  return initJaegerTracer(config, options);
}

/**
 * Sets the global tracer with a service name
 * @func
 * @param serviceName {string} the service using the tracer
 */
function setJaegerAsGlobalTracer(serviceName) {
  try {
    if (getJaegerEnabled()) {
      opentracing.initGlobalTracer(initTracer(serviceName));
      log.info(
        `Jaeger Configured to be global tracer with service name "${serviceName}"`
      );
    }
  } catch (e) {
    log.error(
      `Could not initialize Jaeger: ${e}. Falling back to NoopTracer`
    );
  }
}

/**
 * Injects span middleware traces
 * @param req {object} the middleware request
 * @param res {object} the the middleware response
 * @param next {function} move to next request
 * @func
 */
function injectSpanMiddleware(req, res, next) {
  if (req.originalUrl !== '/') {
    // eslint-disable-next-line max-len
    const parentSpanContext = opentracing
      .globalTracer()
      .extract(opentracing.FORMAT_HTTP_HEADERS, req.headers);
    let span;
    if (parentSpanContext !== undefined && parentSpanContext !== null) {
      span = opentracing.globalTracer().startSpan(`HTTP ${req.method}`, {
        childOf: parentSpanContext,
      });
    } else {
      span = opentracing.globalTracer().startSpan(`HTTP ${req.method}`);
    }
    span.setTag('url', req.originalUrl);
    req.spanContext = span.context();
    res.on('finish', () => {
      span.setTag('res.status.code', res.statusCode);
      span.finish();
    });
  }
  next();
}

module.exports = {
  getJaegerServiceName,
  initTracer,
  initTracingConfiguration,
  getTracingConfiguration,
  setTracingConfiguration,
  getJaegerAgentSidecarEnabled,
  setJaegerAsGlobalTracer,
  injectSpanMiddleware,
};
