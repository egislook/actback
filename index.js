const fetchier = require('fetchier')
const qs = require('qs')
const fs = require('fs')
const cfgPath = process.cwd() + '/config.js'

const { URL, GQL_URL, TOKEN, HEADERS } = fs.existsSync(cfgPath) ? require(cfgPath) : {}

module.exports.success = success
module.exports.fail = fail
module.exports.result = result
module.exports.parse = parse
module.exports.act = act
module.exports.fetch = fetchier.fetch

function act(action, request = {}) {
  const { token, path = '', headers, ...rest } = request
  const query = request.query ? ('?' + qs.stringify(query)) : ''

  return fetchier[action]({
    url: (request.url || URL) + path + query,
    token: token || TOKEN,
    headers: headers || HEADERS,
    ...rest
  })
}

function result(statusCode, data, error, extra = {}){

  const details = {
    statusCode,
    version: 'v' + process.env && process.env.npm_package_version,
  }

  if(!!error) details.message = typeof error === 'object' ? (error.message || error) : error
  if(!!error && !!error.status) details.status = typeof error === 'object' ? (error.status || null) : null

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Credentials' : true,
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ ...details, data, ...extra })
  }
}

function success(body, message, extra){
  return result(200, body, message, extra);
}

function fail(error, body, code = 500){

  if(typeof error !== 'string'){
    code  = error.statusCode && error.statusCode || code
    body  = error.data
    error = error
  }

  return result(code, body, error)
}

function parse(event) {

  let body
  try { body = JSON.parse(event.body) || {} } catch (error) { body = event.body }

  const authorization = event.headers && (event.headers.authorization || event.headers.Authorization)

  return {
    body,
    token: authorization && (authorization && authorization.replace(/bearer(\s{1,})?/i, '')),
    headers: event.headers,
    id: event.pathParameters && event.pathParameters.id,
    params: event.pathParameters,
    query: event.queryStringParameters
  }
}
