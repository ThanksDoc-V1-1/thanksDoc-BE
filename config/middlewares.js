module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  // Custom authentication middleware to handle custom JWT tokens
  // Must be placed before body parser to intercept requests early
  {
    name: 'global::custom-auth',
    config: {},
  },
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  // Temporarily disabled to test
  // {
  //   name: 'global::file-upload',
  //   config: {},
  // },
];
