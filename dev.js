import { spawn } from 'child_process';

console.log('Starting backend server on port 3001 and Angular frontend server on port 3000...');

// Start the Express backend server
const backend = spawn('node', ['server.js'], {
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: 'inherit',
  shell: true
});

// Start the Angular development server
const frontend = spawn('ng', ['serve'], {
  stdio: 'inherit',
  shell: true
});

// If backend exits, kill frontend
backend.on('close', (code) => {
  console.log(`Backend server exited with code ${code}`);
  frontend.kill();
  process.exit(code);
});

// If frontend exits, kill backend
frontend.on('close', (code) => {
  console.log(`Frontend server exited with code ${code}`);
  backend.kill();
  process.exit(code);
});

// Propagate termination signals
const killAll = () => {
  backend.kill();
  frontend.kill();
};

process.on('SIGINT', killAll);
process.on('SIGTERM', killAll);
process.on('exit', killAll);
