var nopt = require('nopt')
const duo_api = require('@duosecurity/duo_api')
const moment = require('moment')
require('dotenv').config()
var parsed = nopt({
  'ikey': [String],
  'skey': [String],
  'host': [String],
  'hook': [String]
}, [], process.argv, 0)
const { IncomingWebhook } = require('@slack/webhook')
moment.locale('de')
var timenow = moment().valueOf()
var timebefore = moment().subtract(3, 'days').valueOf()

if ('duo_ikey' in process.env) {
  var duo_ikey = process.env.duo_ikey
} else if (parsed.ikey != '' || parsed.ikey !== 'undefined') {
  var duo_ikey = parsed.ikey
} else {
  console.log('DUO ikey is missing')
  proces.exit(1)
}

if ('duo_skey' in process.env) {
  var duo_skey = process.env.duo_skey
} else if (parsed.skey != '' || parsed.skey !== 'undefined') {
  var duo_skey = parsed.skey
} else {
  console.log('DUO skey is missing')
  process.exit(1)
}

if ('duo_host' in process.env) {
  var duo_host = process.env.duo_host
} else if (parsed.host != '' || parsed.host !== 'undefined') {
  var duo_host = parsed.host
} else {
  console.log('DUO host is missing')
  process.exit(1)
}

if ('hook' in process.env) {
  var hook = process.env.hook
} else if (parsed.hook != '' || parsed.hook !== 'undefined') {
  var hook = parsed.hook
} else {
  console.log('Slack hook is missing')
  process.exit(1)
}

// resoncode lookuptable
const reasoncodes = {
  user_mistake: 'Fat Fingered',
  user_marked_fraud: 'Fraud ALARM!',
  user_approved: 'Good Boy!',
  location_restricted: 'GEO restricted',
  platform_restricted: 'Posture Error: OS not allowed',
  version_restricted: 'Posture Error: OS Version not allowed',
  rooted_device: 'Script kiddy with Mobile Device (rooted)',
  no_screen_lock: 'Posture Error: no Screen Lock',
  touch_id_disabled: 'Posture Error: iOS no biometry',
  no_disk_encryption: 'Posture Error: no disk encryption',
  error: '¯\\_(ツ)_/¯',
  locked_out: 'User locked',
  user_disabled: 'User disabled',
  user_cancelled: 'User cancelled Request'
}

// reasconcode conversion function
const errorlookup = (reason) => reasoncodes[reason] || 'unknown Reason'

var requirements_met = (duo_ikey && duo_skey && duo_host)
if (!requirements_met) {
  console.error('Missing required option.\n')
}

if (parsed.help || !requirements_met) {
  console.log(function () { /*
Usage:

    duo_admin.js --ikey IKEY --skey SKEY --host HOST

    Example of making one Admin API call against the Duo service.

Options:

    --ikey    Admin API integration key (required)
    --skey    Corresponding secret key (required)
    --host    API hostname (required)
    --hook    Message Webhook
    --help    Print this help.
*/ }.toString().split(/\n/).slice(1, -1).join('\n'))
  if (parsed.help) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}

// Slack Webhook function
const url = 'https://hooks.slack.com/services/' + parsed.hook
const webhook = new IncomingWebhook(url)
function send_message(message) {
  console.log(message)
  if (hook != '' || hook !== 'undefined') {
  async () => {await webhook.send({text: message})}
  }
}

// Send the notification
var client = new duo_api.Client(duo_ikey, duo_skey, duo_host)
client.jsonApiCall(
  'GET', '/admin/v2/logs/authentication', {'maxtime': timenow, 'mintime': timebefore, 'results': 'denied,fraud'},
  function (res) {
    if (res.stat !== 'OK') {
      console.error('API call returned error: ' + res.message)
      process.exit(1)
    }
    res = res.response
    for (var i in res) {
      for (n = 0; n < res[i].length; n++) {
         let message = send_message(
          'User: ' + res[i][n].user.name + ', ' + 
          '\nReason: ' + errorlookup(res[i][n].reason) + ' at ' + moment(res[i][n].isotimestamp).format('LTS') + 
          '\nfrom IP: ' + res[i][n].access_device.ip + 
          '\nAccess Location: ' + res[i][n].access_device.location.country +
          '\n'
          );
      }
    }
  }
)
