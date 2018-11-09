/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environments = {}; 

// Staging (default) environment
environments.staging = {
    'port' : 3000,
    'hashingSecret': 'thisIsASecret',
    'envName' : 'staging',
    'stripe' : {
        'secretKey' : 'sk_test_GAZVfLvL0g9a9c7RcqXxeAP5'
    },
    'mailgun' : {
        'from' : 'postmaster@sandbox28be0316045a415b89c72692482b0c0f.mailgun.org',
        'domainName' : 'sandbox28be0316045a415b89c72692482b0c0f.mailgun.org',
        'key' : 'ca14fd150d04180ee47fb5f1af1a62c5-4412457b-7c84ebc4'
    }
};

// Production environment
environments.production = {
    'port' : 5000,
    'hashingSecret': 'thisIsAlsoASecret',
    'envName' : 'production',
    'stripe' : {
        'secretKey' : 'sk_test_GAZVfLvL0g9a9c7RcqXxeAP5'
    },
    'mailgun' : {
        'from' : 'postmaster@sandbox28be0316045a415b89c72692482b0c0f.mailgun.org',
        'domainName' : 'sandbox28be0316045a415b89c72692482b0c0f.mailgun.org',
        'key' : 'ca14fd150d04180ee47fb5f1af1a62c5-4412457b-7c84ebc4'
    }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the ones above, if not, default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;