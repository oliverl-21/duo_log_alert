# DUO Log Alert

simple PoC to leverage the Cisco DUO Admin [API](https://duo.com/docs/adminapi#logs) and send a Webhook for denied Authentications to Slack

## Usage

You need the DUO Admin API credentials

- ikey
- skey
- duo api host

if a webhook should be send use the option `--hook` with your webhook PATH you obtained through [slack](https://api.slack.com/messaging/webhooks)
The Webhoook URL will look like this `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX` strip `https://hooks.slack.com/services/` from it and append it as an option.

- hook T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX

```js
//node main.js --ikey <duo ikey> --skey <duo skey> --host <duo api endpoint> --hook <slack hook Path>
node main.js --ikey <duo ikey> --skey <duo-skey> --host api-xxxxxxxx.duosecurity.com --hook T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

## ToDo

rework for usage env vars and test serverless.
