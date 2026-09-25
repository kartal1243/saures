// PM2 ile production calistirma:  pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'esnaf-portal',
      script: 'dist/server.cjs',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
};
