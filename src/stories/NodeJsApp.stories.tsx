import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { useWebContainer } from '../src/wmcp/Webcontainer';

const meta: Meta = {
  title: 'WebContainer/NodeJsApp',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

// Base component for all WebContainer stories
const WebContainerDemo = ({ 
  children,
  title,
  description
}: { 
  children: React.ReactNode,
  title: string,
  description: string 
}) => {
  const webContainer = useWebContainer();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (webContainer) {
      setIsReady(true);
    }
  }, [webContainer]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="mb-4 text-gray-600">{description}</p>
      
      {!isReady ? (
        <div className="animate-pulse bg-blue-100 p-4 rounded-md">
          Waiting for WebContainer to initialize...
        </div>
      ) : (
        <div className="border rounded-md p-4 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
};

// Story 3: Simple Node.js App
export const NodeJsApp: Story = {
  render: () => {
    const webContainer = useWebContainer();
    const [output, setOutput] = useState('');
    const [appRunning, setAppRunning] = useState(false);
    const [serverUrl, setServerUrl] = useState('');
    
    const setupNodeApp = async () => {
      if (!webContainer) return;
      
      setOutput('Setting up Node.js app...\n');
      
      try {
        // Create package.json
        await webContainer.fs.writeFile('/package.json', JSON.stringify({
          name: 'simple-node-app',
          version: '1.0.0',
          description: 'A simple Node.js app running in WebContainer',
          main: 'index.js'
        }, null, 2));
        
        // Create a simple Express server with HTML response
        await webContainer.fs.writeFile('/index.js', `
const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(\`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WebContainer Node.js Server</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background-color: #f9fafb;
          color: #111827;
        }
        .container {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          padding: 2rem;
        }
        h1 {
          color: #2563eb;
          margin-top: 0;
        }
        .info {
          background-color: #dbeafe;
          border-radius: 0.375rem;
          padding: 1rem;
          margin: 1rem 0;
        }
        .success {
          color: #059669;
          font-weight: bold;
        }
        .time {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 2rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Hello from WebContainer!</h1>
        <p>This page is being served from a Node.js server running inside a WebContainer.</p>
        
        <div class="info">
          <p>WebContainers enable running Node.js directly in the browser.</p>
          <p class="success">✅ Server is up and running successfully!</p>
        </div>
        
        <p>Request path: \${req.url}</p>
        <p>Request method: \${req.method}</p>
        
        <p class="time">Current server time: \${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  \`);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}/\`);
});

// Keep the server running
process.on('SIGTERM', () => {
  console.log('Server shutting down...');
  server.close(() => {
    console.log('Server closed');
  });
});
`);
        
        setOutput(prev => prev + 'Files created successfully.\n');
        
        // Start the server
        setOutput(prev => prev + 'Starting Node.js server...\n');
        const process = await webContainer.spawn('node', ['index.js']);
        
        // Handle server output
        process.output.pipeTo(
          new WritableStream({
            write(data) {
              setOutput(prev => prev + data);
            }
          })
        );
        
        webContainer.on('server-ready', (port, url) => {
            setAppRunning(true);
            setServerUrl(url);
            setOutput(prev => prev + `Server URL: ${url}\n`);
          });
        
        // Clean up when component unmounts
        return () => {
          process.kill();
        };
      } catch (err) {
        setOutput(prev => prev + `\nError: ${err}\n`);
      }
    };

    return (
      <WebContainerDemo 
        title="Node.js Application" 
        description="Set up and run a simple Node.js application inside WebContainer."
      >
        <div className="space-y-4">
          <button 
            onClick={setupNodeApp}
            disabled={appRunning}
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${appRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {appRunning ? 'App Running' : 'Start Node.js App'}
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Console Output:</h3>
              <pre className="bg-black text-green-400 p-3 rounded border mt-2 h-64 overflow-auto whitespace-pre-wrap">{output || 'Click "Start Node.js App" to begin...'}</pre>
            </div>
            
            {appRunning && (
              <div>
                <h3 className="font-semibold">Server Preview:</h3>
                <div className="mt-2 border rounded-md overflow-hidden h-64 bg-white">
                  {serverUrl ? (
                    <iframe 
                      src={serverUrl}
                      className="w-full h-full"
                      title="Node.js Server Preview"
                      sandbox="allow-same-origin allow-scripts"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-500">
                      <div className="text-center p-4">
                        <p className="font-medium mb-2">Server is running at localhost:3000</p>
                        <p className="text-sm">Preview not available in iframe due to WebContainer limitations</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {appRunning && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-blue-800 mb-2">About WebContainer Servers</h3>
              <p className="text-blue-700 text-sm">
                The Node.js server is running inside the WebContainer at <code className="bg-blue-100 px-1 py-0.5 rounded">localhost:3000</code>. 
                Due to the nature of WebContainers and browser security restrictions, the iframe preview might not be available in all environments.
              </p>
              <p className="text-blue-700 text-sm mt-2">
                In a full implementation, you would access this server through WebContainer's API methods.
              </p>
            </div>
          )}
        </div>
      </WebContainerDemo>
    );
  }
};
