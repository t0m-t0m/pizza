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
        'secretKey' : 'secret_key'
    },
    'mailgun' : {
        'from' : 'secret_key',
        'domainName' : 'secret_key',
        'key' : 'secret_key'
    }
};

// Production environment
environments.production = {
    'port' : 5000,
    'hashingSecret': 'thisIsAlsoASecret',
    'envName' : 'production',
    'stripe' : {
        'secretKey' : 'secret_key'
    },
    'mailgun' : {
        'from' : 'secret_key',
        'domainName' : 'secret_key',
        'key' : 'secret_key'
    }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the ones above, if not, default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
