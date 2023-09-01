type Config = {
  origin: string,
  port: string | number,
}

const config: Config = {
  origin: process.env.ORIGIN
    ? process.env.ORIGIN
    : 'http://127.0.0.1:3000',

  port: process.env.PORT
    ? process.env.PORT
    : 3000,
};

export default config;