const config = {
  locales: [
    // https://docs.strapi.io/developer-docs/latest/development/admin-customization.html#configuration-options
  ],
};

const bootstrap = (app) => {
  console.log(app);
};

export default {
  config,
  bootstrap,
};
