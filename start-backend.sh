#!/bin/bash

# Mainframe Doc Generator - Backend Startup Script

echo "🚀 Starting Mainframe Documentation Generator Backend..."

# Kill any existing Node.js processes
pkill -f "node server.js" 2>/dev/null

# Navigate to backend directory
cd /app/node-backend

# Start the Node.js server in background
echo "📡 Starting Node.js server on port 8002..."
node server.js > server.log 2>&1 &

# Wait a moment for server to start
sleep 2

# Check if server is running
if curl -s http://localhost:8002/api/ > /dev/null; then
    echo "✅ Backend server started successfully!"
    echo "🌐 API available at: http://localhost:8002/api/"
    echo "📋 Frontend URL: http://localhost:3000/mainframe-doc-generator.html"
    echo "📝 Logs: /app/node-backend/server.log"
else
    echo "❌ Failed to start backend server"
    echo "📝 Check logs: /app/node-backend/server.log"
fi

echo "🎉 Startup complete!"