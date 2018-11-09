/*
 * Helpers for various tasks
 * 
 */

// Dependencies
var crypto = require('crypto'); 
var config = require('./config');
var https = require('https');
var querystring = require('querystring');

// Container for all the helpers
var helpers = {};

// Create a SHAR256 hash
helpers.hash = function (str) {
    if (typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases without throwing
helpers.parseJsonToObject = function (str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch(e) {
        return {};
    }
};

// Create a string of alphanumeric characters, of a given length
helpers.createRandomString = function (strLength) {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {

        // Define all possible charaters that can go into a string
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        
        // Start the final string
        var str = '';
        for (i = 1; i <= strLength; i++){

            // Get a random character from possibleCharacters string
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to the final string
            str += randomCharacter;
        }

        // Return the final string
        return str;

    } else {
        callback(false);
    }
};

helpers.stripe = function (payload, callback) {

    // Verify data
    var amount = typeof(payload.amount) == 'number' && payload.amount > 0 ? payload.amount : false;
    var currency = typeof(payload.currency) == 'string' && payload.currency.trim().length > 0 ? payload.currency : false;
    var source = typeof(payload.source) == 'string' && payload.source.trim().length > 0 ? payload.source : false;

    if (amount && currency && source) {

        // Configure the request payload
        var reqPayload = {
            'amount': amount,
            'currency': currency,
            'description': payload.description,
            'source': source
        };
  
        // Stringify the payload
        var stringPayload = querystring.stringify(reqPayload);
    
        // Configure the request details
        var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.stripe.com',
            'method' : 'POST',
            'path' : '/v1/charges',
            'payload' : stringPayload,
            'auth' : config.stripe.secretKey+ ':',
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        };
  
        // Instantiate the request object
        var req = https.request(requestDetails, function(res){
    
            // Grab the status of the sent request
            var status = res.statusCode;
    
            // Callback successfully if the request went through
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status code returned was '+status);
            }
        });
  
        // Bind to the error event so it doesnt get thrown
        req.on('error', function(e){
            callback(e);
        });
    
        // Add the payload 
        req.write(stringPayload);
    
        // End the request
        req.end();

    } else {
        callback('Given parameters were missing or invalid');
    }
};

helpers.mailgun = function(to, subject, text, callback){

    // Verify data
    var sendTo = typeof(to) == 'string' && to.trim().length > 0 ? to : false;
    var emailSubject = typeof(subject) == 'string' && subject.trim().length > 0 ? subject : false;

    if (sendTo && emailSubject) {
        
        // Configure the request payload
        var reqPayload = {
            'from': config.mailgun.from,
            'to': sendTo,
            'subject': emailSubject,
            'html': text
        };

        // Stringify request payload
        var stringPayload = querystring.stringify(reqPayload);

        // Configure the request details
        var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.mailgun.net',
            'method' : 'POST',
            'path' : '/v3/'+config.mailgun.domainName+'/messages',
            'auth' : 'api:'+config.mailgun.key,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        };

        // Instantiate the request object
        var req = https.request(requestDetails, function(res){
    
            // Grab the status of the sent request
            var status = res.statusCode;
    
            // Callback successfully if the request went through
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status code returned was '+status);
            }
        });
  
        // Bind to the error event so it doesnt get thrown
        req.on('error', function(e){
            callback(e);
        });
    
        // Add the payload 
        req.write(stringPayload);
    
        // End the request
        req.end();

    } else {
        callback('Given parameters were missing or invalid');
    }

};

// Export the module
module.exports = helpers;