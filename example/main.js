
var nopt = require('nopt')
const duo_api = require('@duosecurity/duo_api')
const moment = require('moment')
var parsed = nopt({
  'ikey': [String],
  'skey': [String],
  'host': [String],
  'hook': [String]
}, [], process.argv, 2)
const { IncomingWebhook } = require('@slack/webhook')
moment.locale('de')
var requirements_met = (parsed.ikey && parsed.skey && parsed.host)
var timenow = moment().valueOf()
var timebefore = moment().subtract(3, 'days').valueOf()

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
const errorlookup = (reason) => reasoncodes[reason] || 'unknown Reason'
//
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
const url = 'https://hooks.slack.com/services/' + parsed.hook

const webhook = new IncomingWebhook(url)

// Send the notification
var client = new duo_api.Client(parsed.ikey, parsed.skey, parsed.host)
/*
client.jsonApiCall(
    'GET', '/admin/v1/info/authentication_attempts', {},
    function(res) {
        if (res.stat !== 'OK') {
            console.error('API call returned error: '
                          + res.message);
            process.exit(1);
        }

        res = res.response;
        console.log('mintime = ' + res.mintime);
        console.log('maxtime = ' + res.maxtime);
        for (var k in res.authentication_attempts) {
            console.log(k + ' count = '
                        + res.authentication_attempts[k]);
        }
    });
*/
client.jsonApiCall(
  'GET', '/admin/v2/logs/authentication', {'maxtime': timenow, 'mintime': timebefore, 'results': 'denied,fraud'},
  function (res) {
    if (res.stat !== 'OK') {
      console.error('API call returned error: ' +
          res.message)
      process.exit(1)
    }
    res = res.response
    for (var i in res) {
      for (n = 0; n < res[i].length; n++) {
        console.log('User: ' + res[i][n].user.name + ' ' + errorlookup(res[i][n].reason)),
        (async () => {
          await webhook.send({text: 'User: ' + res[i][n].user.name + ', ' + errorlookup(res[i][n].reason) + ' at ' + moment(res[i][n].isotimestamp).format('LTS') + '\n from: ' + res[i][n].access_device.ip + '\n Location: ' + res[i][n].access_device.location.country})
        }
        )()
      }

      // console.log(res.authlogs);
    }
  }
)
