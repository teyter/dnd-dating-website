const cluster = require('cluster');

const isProduction = process.env.NODE_ENV === 'production';

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} starting...`);
  console.log(`Production mode: ${isProduction}`);

  // Here we can decide how many workers to fork based on the environment.
  // workers are separate processes that can handle requests in parallel, improving performance and reliability in production. 
  const numWorkers = isProduction ? 1 : 1;
  console.log(`Using ${numWorkers} worker(s)`);

  // Fork workers, so that we can have multiple instances of the app running in production for better performance and reliability. 
  // In development, we only use 1 worker to simplify debugging.
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    // In production, we restart the worker
    if (isProduction) {
      cluster.fork();
    }
  });

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} started`);
  });

  // Graceful shutdown, when the master process receives a termination signal, it will shut down all worker processes gracefully, allowing them to finish handling any ongoing requests before exiting. 
  // This helps prevent abrupt termination of requests and ensures a smoother shutdown process.
  process.on('SIGTERM', () => {
    console.log('Master process received SIGTERM. Shutting down workers...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill('SIGTERM');
    }
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('Master process received SIGINT. Shutting down workers...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill('SIGINT');
    }
    process.exit(0);
  });
} else {
  // Here we are in the worker process, we require the app and start the server. 
  // Each worker will run an instance of the app, allowing us to handle multiple requests in parallel in production. 
  const app = require('./app');

  const PORT = process.env.PORT || 3000;
  // Bind to localhost only, nginx will forward requests from outside
  // This ensures Node is not directly accessible from the network
  const HOST = isProduction ? '127.0.0.1' : '0.0.0.0';

  app.listen(PORT, HOST, () => {
    console.log(`Worker ${process.pid} running on http://${HOST}:${PORT}`);
  });
}
