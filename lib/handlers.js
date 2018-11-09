/*
 * Request Handlers
 * 
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Define the handlers
var handlers = {};

// Users handler
handlers.users = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the users sub-methods
handlers._users = {};

// Users - POST
// Required data: firstName, lastName, email, password, street , tosAgreement
// Optional data: None
handlers._users.post = function(data, callback){

    // check that all required fields are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.indexOf('@') > -1 ? data.payload.email.trim() : false;
    var street = typeof(data.payload.street) == 'string' && data.payload.street.trim().length > 0 ? data.payload.street.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && email && street && password && tosAgreement) {

        // Make sure that the user doesnt already exist
        _data.read('users', email, function(err, userData){
            if (err) {

                // Hash the password 
                var hashedPassword = helpers.hash(password);

                // Create user object
                if (hashedPassword) {
                    var userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'email' : email,
                        'street' : street,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true
                    };
    
                    // Store the user
                    _data.create('users', email, userObject, function(err){
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error' : 'Unable to create new user!'});
                        }
                    }); 

                } else {
                    callback(500, {'Error' : 'Unable to hash password!'});
                }
                

            } else {

                // User already exists
                callback(400, {'Error' : 'User already exists!'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// Users - GET
// Required data: email
// Optional data: None
handlers._users.get = function(data, callback){

    // Check that the email provided is valid
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.length > 0 && data.queryStringObject.email.indexOf('@') > -1 ? data.queryStringObject.email : false;
    if (email) {

        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, email, function(tokenIsValid){
            if (tokenIsValid) {
                // Look up the user
                _data.read('users', email, function(err, userData){
                    if (!err && userData) {

                        // Remove the hashed password from the user object before returning it to the requester
                        delete userData.hashedPassword;
                        callback(200, userData);

                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, {'Error' : 'Missing required token in header or token is invalid'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Users - PUT
// Required data: email
// Optional: firstName, lastName, password, street (at least one must be specified)
handlers._users.put = function(data, callback){

    // Check that the email provided is valid
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.indexOf('@') > -1 ? data.payload.email.trim() : false;

    // Check for optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var street = typeof(data.payload.street) == 'string' && data.payload.street.trim.length > 0 ? data.payload.street.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phone is invalid
    if (email) {

        //Error if nothing else is sent to update
        if (firstName || lastName || street || password) {

            // Get the token from the header
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            // Verify that the given token is valid for the user Id
            handlers._tokens.verifyToken(token, email, function(tokenIsValid){
                if (tokenIsValid) {
                    // Look up user
                    _data.read('users', email, function(err, userData){
                        if (!err && userData) {

                            // Update fields necessary
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (street) {
                                userData.street = street;
                            }
                            if (password) {
                                userData.password = helpers.hash(password);
                            }

                            // Store the new updates
                            _data.update('users', email, userData, function(err){
                                if (!err){
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {'Error' : 'Unable to update'});
                                }
                            });
                            
                        } else {
                            callback(400, {'Error' : 'specified user does not exist'});
                        }
                    });
                } else {
                    callback(403, {'Error' : 'Missing required token in header or token is invalid'});
                }
            });
        } else {
            callback(400, {'Error' : 'Missing fields to update'});
        }
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Users - DELETE
// Required data : email 
handlers._users.delete = function(data, callback){

    // Check that the email provided is valid
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && data.queryStringObject.email.indexOf('@') > -1 ? data.queryStringObject.email.trim() : false;
    if (userId) {

        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, email, function(tokenIsValid){
            if (tokenIsValid) {
                // Look up the user
                _data.read('users', email, function(err, userData){
                    if (!err && userData) {
                        _data.delete('users', email, function(err){
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, {'Error' : 'Unable to delete user'});
                            }
                        });
                    } else {
                        callback(400, {'Error' : 'Could not find specified user'});
                    }
                });
            } else {
                callback(403, {'Error' : 'Missing required token in header or token is invalid'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Tokens handler
handlers.tokens = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for tokens sub-methods
handlers._tokens = {};

// Tokens - POST
// Required data : email, password
// Optional data : None
handlers._tokens.post = function(data, callback){

    // Validate entries
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.indexOf('@') > -1 ? data.payload.email.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (email && password) {

        // Look up user that matches that phone number
        _data.read('users', email, function(err, userData){
            if (!err && userData) {

                // Hash sent password and compare it with the user data returned password
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword){

                    // If valid, create a new token with a random name. Set expiration date one hour in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;

                    // Create a token object
                    var tokenObject = {
                        'email' : email,
                        'id' : tokenId,
                        'expires' : expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function(err){
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error' : 'Unable to create token'});
                        }
                    });

                } else {
                    callback(400, {'Error' : 'Invalid Password'});
                }
            } else {
                callback(400, {'Error' : 'Could not find specified user'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing Required Fields'});
    }
};

// Tokens - GET
// Required data : id
// Optional data : None
handlers._tokens.get = function(data, callback){

    // Check that the id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {

        // Look up the token
        _data.read('tokens', id, function(err, tokenData){
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
    
};

// Tokens - PUT
// Required data : id, extend
// Optional data : None
handlers._tokens.put = function(data, callback){
    // Validate id
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if (id && extend) {

        // Look up the token
        _data.read('tokens', id, function(err, tokenData){
            if (!err && tokenData) {

                // check to make sure the token isnt already expired
                if (tokenData.expires > Date.now()) {

                    // Set the expiration date an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens', id, tokenData, function(err){
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error' : 'Unable to update token'});
                        }
                    });
                } else {
                    callback(400, {'Error' : 'Token has already expired, and cannot be extended'});
                }
            } else {
                callback(400, {'Error' : 'Specified token does not exist'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required field(s) or field(s) are invalid'});
    }
};

// Tokens - DELETE
// Required data : id
// Optional data : None
handlers._tokens.delete = function(data, callback){

    // Check that the id provided is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {

        // Look up the token
        _data.read('tokens', id, function(err, tokenData){
            if (!err && tokenData) {
                _data.delete('tokens', id, function(err){
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error' : 'Unable to delete token'});
                    }
                });
            } else {
                callback(400, {'Error' : 'Could not find specified token'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, email, callback){
    _data.read('tokens', id, function(err, tokenData){
        if (!err && tokenData) {

            // Check that the token is for the given data and has not expired 
            if (tokenData.email == email && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// menu handler
handlers.menu = function(data, callback){
    var acceptableMethods = ['get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._menu[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for menu sub methods
handlers._menu = {};

// Menu - POST
// Required data : title, price
// Optional data : None
handlers._menu.post = function(data, callback) {

    // Verify data
    var title = typeof(data.payload.title) == 'string' && data.payload.title.trim().length > 0 ? data.payload.title.trim() : false;
    var price = typeof(data.payload.price) == 'number' ? data.payload.price : false;

    if (title && price){

        // Create menu item id
        var menuId = helpers.createRandomString(20);

        // Create menu object
        var menuObject = {
            'menuId' : menuId,
            'title' : title,
            'price' : price
        };

        // Save menu object to file
        _data.read('menu', menuId, function(err, menuData){
            if (err) {

                // Save file
                _data.create('menu', menuId, menuObject, function(err){
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error' : 'Unable to create menu item'});
                    }
                });
            } else {
                callback(400, {'Error' : 'File already exists'});
            }
        });
    } else {
        callback(403, {'Error' : 'Missing required fields'});
    }
};

// Menu - GET
// Required data : email
// Optional data : None
handlers._menu.get = function(data, callback) {

    // Verify data
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && data.queryStringObject.email.indexOf('@') > -1 ? data.queryStringObject.email.trim() : false;

    if (email) {

        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the email
        handlers._tokens.verifyToken(token, email, function(tokenIsValid){
            if (tokenIsValid) {
                _data.list('menu', function(err, data){
                    if (!err) {
                        var menuArray = [];
                        var menuItemPushed = 0;
                        var menuLength = data.length;
                        data.forEach(function(fileName){
                            _data.read('menu', fileName, function(err, menuData){
                                if (!err && menuData) {
            
                                    // create menu item object
                                    var menuItemObject = {
                                        'id' : menuData.menuId,
                                        'title' : menuData.title,
                                        'price' : menuData.price
                                    };
            
                                    menuArray.push(menuItemObject);
                                    menuItemPushed++;
                                } 
                                if (menuItemPushed == menuLength){
                                    callback(200, menuArray);
                                }
                            });
                        });
                    } else {
                        callback(500, {'Error' : 'Unable to list menu items'});
                    }
                });
            } else {
                callback(400, {'Error' : 'Missing required field'});
            }
        });
    } else {
        callback(403, {'Error' : 'Missing required fields'});
    }
};

// Cart handler
handlers.cart = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._cart[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Sub methods Container
handlers._cart = {};

// Cart - POST
// Required Data : email, menuItem, qty
// Optional Data : None
handlers._cart.post = function(data, callback) {

    // Verify Data
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.indexOf('@') > -1 ? data.payload.email.trim() : false;
    var menuItem = typeof(data.payload.menuItem) == 'string' && data.payload.menuItem.trim().length == 20 ? data.payload.menuItem.trim() : false;
    var qty = typeof(data.payload.qty) == 'number' && data.payload.qty % 1 === 0 && data.payload.qty > 0 ? data.payload.qty : false;
    
    if (email && menuItem && qty){

        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the email
        handlers._tokens.verifyToken(token, email, function(tokenIsValid){
            if (tokenIsValid) {
                if (menuItem && qty){
                    _data.read('cart', email, function(err, cartData){
                        if (err) {
                            _data.read('menu', menuItem, function(err, menuItemData){
                                if (!err && menuItemData) {

                                    // Create new cart object
                                    var cartObject = {
                                        'owner' : email,
                                        'items' : [ {'menuItem' : menuItem,
                                            'qty' : qty } ],
                                        'total' : qty * menuItemData.price
                                    };

                                    // Save new cart
                                    _data.create('cart', email, cartObject, function(err){
                                        if (!err) {
                                            callback(200);
                                        } else {
                                            callback(500, {'Error' : 'Unable to create cart'});
                                        }
                                    });
                                } else {
                                    callback(500);
                                }
                            });
                        } else {
                            _data.read('menu', menuItem, function(err, menuItemData){
                                if (!err && menuItemData) {
                                    var loop = 0;
                                    var alreadyInCart = false;
                                    cartData.items.forEach(function(item){
                                        if (item.menuItem == menuItem) {
                                            item.qty = item.qty + qty;
                                            cartData.total = cartData.total + menuItemData.price * qty;
                                            alreadyInCart = true;
                                        }
                                        loop++;
                                    });
                                    if (loop == cartData.items.length && alreadyInCart == true) {

                                        // Update cart file with new data
                                        _data.update('cart', email, cartData, function(err){
                                            if (!err) {
                                                callback(200);
                                            } else {
                                                callback(500, {'Error' : 'Unable to Update file'});
                                            }
                                        });
                                    } else {

                                        // Push menuItem into the items array in the cart
                                        var itemObject = {
                                            'menuItem' : menuItem,
                                            'qty' : qty
                                        };
                                        cartData.items.push(itemObject);

                                        cartData.total = cartData.total + menuItemData.price * qty;

                                        // Update cart file with new data
                                        _data.update('cart', email, cartData, function(err){
                                            if (!err) {
                                                callback(200);
                                            } else {
                                                callback(500, {'Error' : 'Unable to Update file'});
                                            }
                                        });
                                    }
                                } else {
                                    callback(500, {'Error' : 'Unable to read file'});
                                }
                            });
                        }
                    });
                } else {
                    callback(400, {'Error' : 'Missing required field(s)'});
                }
            } else {
                callback(400, {'Error' : 'Missing required field'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Cart - GET
// Required data : email
// Optional Data : None
handlers._cart.get = function(data, callback){

    // Verify email
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && data.queryStringObject.email.indexOf('@') > -1 ? data.queryStringObject.email.trim() : false;

    if (email) {

        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the email
        handlers._tokens.verifyToken(token, email, function(tokenIsValid){
            if (tokenIsValid) {

                // Read file
                _data.read('cart', email, function(err, cartData){
                    if (!err && cartData) {
                        callback(200, cartData);
                    } else {
                        callback(500);
                    }
                });

            } else {
                callback(400);
            }
        });

    } else {
        callback(403, {'Error' : 'Missing required field'});
    }
};

// Cart - PUT
// Required Data : email, menuItem, qty
// Optional Data : decreaseQty
handlers._cart.put = function(data, callback){

    // Verify data sent
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.indexOf('@') > -1 ? data.payload.email.trim() : false;
    var menuItem = typeof(data.payload.menuItem) == 'string' && data.payload.menuItem.trim().length == 20 ? data.payload.menuItem.trim() : false;
    var decreaseQty = typeof(data.payload.decreaseQty) == 'boolean' ? data.payload.decreaseQty : false;
    var qty = typeof(data.payload.qty) == 'number' && data.payload.qty % 1 === 0 && data.payload.qty > 0 ? data.payload.qty : false;

    if (email && menuItem && qty){

        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the email
        handlers._tokens.verifyToken(token, email, function(tokenIsValid){
            if (tokenIsValid) {

                // Check if cart exists
                _data.read('cart', email, function(err, cartData){
                    if (!err && cartData) {
                        _data.read('menu', menuItem, function(err, menuItemData){
                            if (!err && menuItemData) {

                                // check if menuItem is in cart
                                var loop = 0;
                                cartData.items.forEach(function(item){
                                    if (item.menuItem == menuItem) {

                                        // Check decreaseQty to determine whether to increase or decrease qty
                                        if (decreaseQty){
                                            var newQty = item.qty - qty;
                                            if (newQty > 0){
                                                item.qty = newQty;      
                                                cartData.total = cartData.total - menuItemData.price * qty;
                                            } else {
                                                cartData.total = cartData.total - menuItemData.price * item.qty;
                                                newItemsArray = cartData.items.filter(function(item){
                                                    return item.menuItem !== menuItem;
                                                });
                                                cartData.items = newItemsArray;
                                                item.qty = 0;
                                            }
                                        } else {
                                            item.qty = item.qty + qty;
                                            cartData.total = cartData.total + menuItemData.price * qty;
                                        }
                                    }
                                    loop++;
                                });

                                // Update cart info 
                                if (loop == cartData.items.length || cartData.items.length < loop) {
                                    _data.update('cart', email, cartData, function(err){
                                        if (!err) {
                                            callback(200);
                                        } else {
                                            callback(500);
                                        }
                                    });
                                } else {
                                    callback(400, {'Error' : 'Unable to Update cart'});
                                }
                            } else {
                                callback(500);
                            }
                        });
                    } else {
                        callback(500, {'Error' : 'Cart may not exist'});
                    }
                });

            } else {
                callback(400);
            }
        });
    } else {
        callback(403, {'Error' : 'Missing required field'});
    }
};

// Cart - DELETE
// Required Data : email
// Optional Data : menuItem
handlers._cart.delete = function(data, callback){

    // Verify Data
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.indexOf('@') > -1 ? data.payload.email.trim() : false;
    var menuItem = typeof(data.payload.menuItem) == 'string' && data.payload.menuItem.trim().length == 20 ? data.payload.menuItem.trim() : false;

    if (email) {

        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the email
        handlers._tokens.verifyToken(token, email, function(tokenIsValid){
            if (tokenIsValid) {

                // if menuItem was provided delete just the menuItem
                if (menuItem) {
                    _data.read('cart', email, function(err, cartData){
                        if (!err && cartData) {
                            _data.read('menu', menuItem, function(err, menuItemData){
                                if (!err && menuItemData) {
                                    var loop = 0;
                                    var inCart = false;

                                    // Update Cart total
                                    cartData.items.forEach(function(item){
                                        if (item.menuItem == menuItem) {
                                            if (item.qty > 0) {
                                                cartData.total = cartData.total - menuItemData.price * item.qty;
                                            }
                                            inCart = true;
                                        }
                                        loop++;
                                    });
                                    if (loop == cartData.items.length && inCart) {

                                        // Remove menuItem from items array
                                        newItemsArray = cartData.items.filter(function(item){
                                            return item.menuItem !== menuItem;
                                        });
                                        cartData.items = newItemsArray;

                                        // Update cart
                                        _data.update('cart', email, cartData, function(err){
                                            if (!err) {
                                                callback(200);
                                            } else {
                                                callback(500);
                                            }
                                        });
                                    } else {
                                        callback(400, {'Error' : 'Unable to delete menuItem or menuItem is not in cart '});
                                    }
                                } else {
                                    callback(500);
                                }
                            });    
                        } else {
                            callback(500);
                        }
                    });
                } else {
                    _data.delete('cart', email, function(err){
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500);
                        }
                    });
                }
            } else {
                callback(400);
            }
        });

    } else {   
        callback(403, {'Error' : 'Missing required field'});
    }
};

// Order handler
handlers.order = function(data, callback){
    var acceptableMethods = ['post'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._order[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Sub methods container
handlers._order = {};

// Order - Post
// Required Data : email, creditCard, validMonth, validYear, cvv
// Optional Data : None
handlers._order.post = function(data, callback) {

    // Verify data
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.indexOf('@') > -1 ? data.payload.email.trim() : false;
    // var creditCard = typeof(data.payload.creditCard) == 'string' && data.payload.creditCard.trim().length > 0 ? data.payload.creditCard.trim() : false;
    // var validMonth = typeof(data.payload.validMonth) == 'number' && data.payload.validMonth >= 1 && data.payload.validMonth <= 12 ? data.payload.validMonth : false;
    // var validYear = typeof(data.payload.validYear) == 'number' && data.payload.validYear > 2018 ? data.payload.validYear : false;
    // var cvv = typeof(data.payload.cvv) == 'string' && data.payload.cvv.trim().length == 3 ? data.payload.cvv.trim().length : false;

    if (email) {

        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the email
        handlers._tokens.verifyToken(token, email, function(tokenIsValid){
            if (tokenIsValid) {

                // look up user
                _data.read('users', email, function(err, userData){
                    if (!err && userData){

                        _data.read('cart', email, function(err, cartData){
                            if (!err && cartData){
                                var currency = 'usd';
                                var source = 'tok_visa';
                                var orderId = helpers.createRandomString(20);
                                var menuItemDetail = '';

                                // payload object
                                var payload = {
                                    'amount' : cartData.total,
                                    'currency' : currency,            
                                    'description' : 'Charge for Pizza Order',
                                    'source' : source,
                                };

                                cartData.items.forEach(function(item){
                                    _data.read('menu', item.menuItem, function(err, menuData){
                                        if (!err && menuData) {
                                            var total = item.qty * menuData.price;
                                            menuItemDetail += `<li>${menuData.title} (${item.qty} * ${menuData.price} = ${total})</li>`;
                                        } else {
                                            callback(500);
                                        }
                                    });
                                });

                                // Make payment using Stripe API
                                helpers.stripe(payload, function(err){
                                    if (!err) {
                                        var message = `
                                        <h1>Hello ${userData.firstName}, Your Order was successful</h1>
                                        <h2>Order ID #${orderId}</h2>
                                        <ul>
                                          <li>Order List: ${menuItemDetail}</li>
                                          <li>Total: ${cartData.total} ${currency}</li>
                                        </ul>
                                        <p><strong>Thank You</strong></p> 
                                        --<br/>                   
                                      `;

                                      // Send email upon Stripe Payment success using Mailgun API
                                      helpers.mailgun(email, "Order Successful", message, function(err){
                                          if (err) {
                                            callback(500);
                                          }
                                      });

                                      // Order Object
                                      var orderObject = {
                                        'orderId' : orderId,
                                        'user' : userData.firstName+' '+userData.lastName,
                                        'user email' : userData.email,
                                        'user address' : userData.street,
                                        'order' : cartData.items,
                                        'total' : cartData.total,
                                      };

                                      // Save order info to file
                                      _data.create('orders', orderId, orderObject, function(err){
                                        if (!err){
                                            
                                            // Delete cart
                                            _data.delete('cart', email, function(err){
                                                if (!err) {
                                                    callback(200, orderObject);
                                                } else {
                                                    callback(500);
                                                }
                                            });
                                        } else {
                                            callback(500, {'Error' : 'Unable to create new order'});
                                        }
                                      });
                                    } else {
                                        callback(500);
                                    }
                                });
                            } else {
                                callback(500);
                            }
                        });
                    } else {
                        callback(500);
                    }
                });
            } else {
                callback(400);
            }
        });

    } else {
        callback(403, {'Error' : 'Missing required field'});
    }
};


// Not found handler
handlers.notFound = function(data, callback){
    callback(404);
};

// Export handlers
module.exports = handlers;