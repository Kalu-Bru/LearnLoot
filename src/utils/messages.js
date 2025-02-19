const moment = require('moment');

function formatMessage(text, identity) {
    return {
        text,
        time: moment().format('h:mm a'),
        identity
    }
}

module.exports = formatMessage;