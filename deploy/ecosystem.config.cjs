module.exports = {
  apps: [{
    name: 'dukkanim',
    script: './dist/server.cjs',
    cwd: '/var/www/dukkanim',
    env: { NODE_ENV: 'production', DATA_DIR: '/var/www/dukkanim/data' },
  }],
};
