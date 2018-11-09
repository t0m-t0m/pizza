/*
 *
 * Server-related tasks
 * 
 */

// Dependencies
var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var handlers = require('./handlers');
var helpers = require('./helpers');
var util = require('util');
var debug = util.debuglog('server');

// Instantiate the server module object
var server = {};

// The server should respond to all requests with a string
server.httpServer = http.createServer(function(req, res){

   // Get the URL and parse it
   var parsedUrl = url.parse(req.url, true);

   // Get the path
   var path = parsedUrl.pathname;
   var trimmedPath = path.replace(/^\/+|\/+$/g, '');

   // Get the query string as an Object
   var queryStringObject = parsedUrl.query;

   // Get the HTTP Method
   var method = req.method.toLowerCase();

   // Get the headers as an object
   var headers = req.headers;

   // Get payload, if any 
   var decoder = new StringDecoder('utf-8');
   var buffer = '';
   req.on('data', function(data){
       buffer += decoder.write(data);
   });

   req.on('end', function(){
       buffer += decoder.end();

       // Choose the handler this request should go to. if none found, go to notFound
       var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

       // Construct the data object to send to the handler
       var data = {
           'trimmedPath' : trimmedPath,
           'queryStringObject': queryStringObject,
           'method': method,
           'headers': headers,
           'payload': helpers.parseJsonToObject(buffer)
       };

       // Route the request to the handler specified in the router
       chosenHandler(data, function(statusCode, payload){

           // Use the status code called back by the handler, or use default 200
           statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

           // Use the payload called back by the handler, or default to an empty object
           payload = typeof(payload) == 'object' ? payload : {};

           // Convert the payload to a string
           var payloadString = JSON.stringify(payload);

           // Return the response
           res.setHeader('Content-Type','application/json');
           res.writeHead(statusCode);
           res.end(payloadString);

           // If the response is 200, print green, otherwise print red
           if (statusCode == 200) {
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase()+'/'+trimmedPath+' '+statusCode);
           } else {
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase()+'/'+trimmedPath+' '+statusCode);
           }
       });

   });
});

// Define a request router
server.router = {
   'users' : handlers.users,
   'tokens' : handlers.tokens,
   'menu' : handlers.menu,
   'cart' : handlers.cart,
   'order' : handlers.order,
};

// Init script
server.init = function(){

    // Start the HTTP Server
    server.httpServer.listen(config.port, function(){
        console.log('\x1b[36m%s\x1b[0m', 'The server is listening on port '+config.port+' in '+config.envName+ ' mode');
     });
};

// Export the module
module.exports = server;