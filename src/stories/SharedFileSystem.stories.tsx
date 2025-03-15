import React, { useEffect, useState, useRef, useContext } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { useWebContainer, FileSystemTree, WebContainerContext } from '../src/wmcp/Webcontainer';
import { Tree, TreeItem, TreeItemContent } from '../src/Tree';
import Editor from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const meta: Meta = {
  title: 'WebContainer/Examples',
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

// Story 4: Shared File System Across Components
export const SharedFileSystem: Story = {
  render: () => {
    return (
      <WebContainerDemo
        title="Shared File System Across Components"
        description="This example shows how multiple components can contribute to the same WebContainer filesystem."
      >
        <div className="space-y-8">
          <div className="text-sm text-gray-500 bg-gray-100 p-4 rounded-md">
            <p>This example demonstrates how multiple components can contribute to the WebContainer filesystem.</p>
            <p>Each component below registers its own set of files, but they all share the same WebContainer instance.</p>
            <p>Changes made in one component are visible to all other components.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileContributor 
              name="Frontend Component" 
              color="blue" 
              files={{
                '/frontend/index.html': {
                  file: {
                    contents: `<!DOCTYPE html>
<html>
<head>
  <title>Frontend Demo</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="app.js"></script>
</body>
</html>`
                  }
                },
                '/frontend/styles.css': {
                  file: {
                    contents: `body {
  font-family: sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

#app {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}`
                  }
                },
                '/frontend/app.js': {
                  file: {
                    contents: `// Frontend application code
document.getElementById('app').innerHTML = '<h1>Frontend App</h1><p>This content is loaded from app.js</p>';

// Try to import code from the backend
try {
  // This will work if the Backend Component is mounted
  const message = window.backendMessage || 'Backend component not loaded yet';
  document.getElementById('app').innerHTML += \`<div class="backend-message">\${message}</div>\`;
} catch (e) {
  console.error('Could not load backend code:', e);
}`
                  }
                },
                '/shared': {
                  directory: {}
                }
              }}
            />
            
            <FileContributor 
              name="Backend Component" 
              color="green"
              files={{
                '/backend/server.js': {
                  file: {
                    contents: `// Simple backend server code
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Hello from the backend server!',
    endpoint: req.url
  }));
});

const PORT = 3000;
console.log(\`Server would start on port \${PORT}\`);

// Export a message that the frontend can use
if (typeof window !== 'undefined') {
  window.backendMessage = 'Message from backend component';
}`
                  }
                },
                '/backend/package.json': {
                  file: {
                    contents: `{
  "name": "backend-demo",
  "version": "1.0.0",
  "description": "Simple backend demo",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}`
                  }
                },
                '/shared/config.json': {
                  file: {
                    contents: `{
  "appName": "Shared Filesystem Demo",
  "version": "1.0.0",
  "components": ["frontend", "backend"],
  "description": "This config file is shared between components"
}`
                  }
                }
              }}
            />
            
            <FileContributor 
              name="Utilities Component" 
              color="purple"
              files={{
                '/utils/helpers.js': {
                  file: {
                    contents: `// Utility functions
function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

module.exports = {
  formatDate,
  generateId
};`
                  }
                },
                '/utils/validation.js': {
                  file: {
                    contents: `// Validation utilities
function isEmail(email) {
  const re = /^[\\w-]+(\\.[\\w-]+)*@([\\w-]+\\.)+[a-zA-Z]{2,7}$/;
  return re.test(email);
}

function isRequired(value) {
  return value !== undefined && value !== null && value !== '';
}

module.exports = {
  isEmail,
  isRequired
};`
                  }
                },
                '/shared/README.md': {
                  file: {
                    contents: `# Shared Filesystem Demo

This project demonstrates how different components can contribute files to the same WebContainer filesystem.

## Structure

- \`/frontend\`: Contains the frontend code
- \`/backend\`: Contains the backend code
- \`/utils\`: Contains utility functions
- \`/shared\`: Contains files shared between components

## How it works

Each component registers its own filesystem tree, but they are all mounted in the same WebContainer instance.
This allows components to access files created by other components.`
                  }
                }
              }}
            />
            
            <FileBrowser />
          </div>
        </div>
      </WebContainerDemo>
    );
  }
};

// Component that contributes files to the WebContainer
function FileContributor({ 
  name, 
  color, 
  files 
}: { 
  name: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  files: FileSystemTree;
}) {
  const webContainer = useWebContainer(files);
  const [status, setStatus] = useState('Registering files...');
  const [mounted, setMounted] = useState(false);
  
  // Verify files were actually mounted by checking for one file
  const verifyMounting = async () => {
    if (!webContainer) return;
    
    try {
      // Take the first file path to check
      const filePath = Object.keys(files).find(path => 'file' in files[path]);
      
      if (filePath) {
        try {
          // Try to read the file to verify it exists (using readFile instead of stat)
          await webContainer.fs.readFile(filePath, 'utf-8');
          console.log(`${name}: Verified file exists: ${filePath}`);
          setMounted(true);
          setStatus('Files mounted successfully!');
        } catch (err) {
          console.error(`${name}: File verification failed for ${filePath}:`, err);
          setStatus(`File verification failed. Try refreshing.`);
          
          // Try writing the file directly to see if that works
          try {
            console.log(`${name}: Attempting to write file: ${filePath}`);
            if ('file' in files[filePath]) {
              await webContainer.fs.writeFile(filePath, files[filePath].file.contents);
              console.log(`${name}: Successfully wrote file: ${filePath}`);
              setMounted(true);
              setStatus('Files manually written successfully!');
            }
          } catch (writeErr) {
            console.error(`${name}: Failed to write file: ${filePath}`, writeErr);
            setStatus(`File creation failed. Possible API issue.`);
          }
        }
      } else {
        // If no files to check, just check a directory
        const dirPath = Object.keys(files).find(path => 'directory' in files[path]);
        if (dirPath) {
          try {
            // Try to read the directory to verify it exists
            await webContainer.fs.readdir(dirPath);
            console.log(`${name}: Verified directory exists: ${dirPath}`);
            setMounted(true);
            setStatus('Files mounted successfully!');
          } catch (err) {
            console.error(`${name}: Directory verification failed for ${dirPath}:`, err);
            
            // Try to create the directory manually
            try {
              console.log(`${name}: Attempting to create directory: ${dirPath}`);
              await webContainer.fs.mkdir(dirPath);
              console.log(`${name}: Successfully created directory: ${dirPath}`);
              setMounted(true);
              setStatus('Directory manually created!');
            } catch (mkdirErr) {
              console.error(`${name}: Failed to create directory: ${dirPath}`, mkdirErr);
              setStatus(`Directory creation failed. Possible API issue.`);
            }
          }
        } else {
          // If nothing to verify, assume it worked
          setMounted(true);
          setStatus('Files registered (unverified)');
        }
      }
    } catch (err) {
      console.error(`${name}: Error during verification:`, err);
      setStatus('Error verifying files');
    }
  };
  
  // Manual file creation as a fallback
  const createFilesManually = async () => {
    if (!webContainer) return;
    
    try {
      setStatus('Manually creating files...');
      
      // Create each file and directory manually
      for (const path of Object.keys(files)) {
        const entry = files[path];
        
        if ('file' in entry) {
          try {
            // Create parent directories if needed
            const parentDir = path.substring(0, path.lastIndexOf('/'));
            if (parentDir) {
              try {
                await webContainer.fs.mkdir(parentDir, { recursive: true });
              } catch (err) {
                // Ignore if directory already exists
                console.log(`${name}: Parent directory may already exist:`, parentDir);
              }
            }
            
            // Write the file
            await webContainer.fs.writeFile(path, entry.file.contents);
            console.log(`${name}: Successfully wrote file manually: ${path}`);
          } catch (err) {
            console.error(`${name}: Failed to write file manually: ${path}`, err);
          }
        } else if ('directory' in entry) {
          try {
            await webContainer.fs.mkdir(path, { recursive: true });
            console.log(`${name}: Successfully created directory manually: ${path}`);
          } catch (err) {
            console.error(`${name}: Failed to create directory manually: ${path}`, err);
          }
        }
      }
      
      setMounted(true);
      setStatus('Files created manually!');
    } catch (err) {
      console.error(`${name}: Error creating files manually:`, err);
      setStatus('Error creating files manually');
    }
  };
  
  const colorClasses = {
    blue: 'bg-blue-100 border-blue-300 text-blue-800',
    green: 'bg-green-100 border-green-300 text-green-800',
    red: 'bg-red-100 border-red-300 text-red-800',
    purple: 'bg-purple-100 border-purple-300 text-purple-800',
    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800'
  };
  
  return (
    <div className={`border rounded-md p-4 ${colorClasses[color]}`}>
      <h3 className="font-semibold mb-2">{name}</h3>
      <p className="text-sm mb-3">
        Status: {status}
        {mounted && (
          <span className="ml-1 inline-flex items-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </span>
        )}
      </p>
      
      <div className="flex justify-end mb-2">
        <button 
          onClick={createFilesManually}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Create Manually
        </button>
      </div>
      
      <div className="text-xs overflow-auto bg-white bg-opacity-50 p-3 rounded max-h-60">
        <p className="font-semibold mb-1">Contributed files:</p>
        <ul className="list-disc pl-5 space-y-1">
          {Object.keys(files).map(path => (
            <li key={path}>
              {path}
              {files[path].hasOwnProperty('directory') && ' (directory)'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// File Browser component to view the entire filesystem
function FileBrowser() {
  const webContainer = useWebContainer();
  const { filesystemIds } = useContext(WebContainerContext);
  const [files, setFiles] = useState<{path: string; type: 'file' | 'directory'}[]>([]);
  const [fileTree, setFileTree] = useState<Record<string, any>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['/']);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [debugMessage, setDebugMessage] = useState<string>('');
  
  // Convert flat file list to hierarchical tree structure
  const buildFileTree = (files: {path: string; type: 'file' | 'directory'}[]) => {
    const root: Record<string, any> = {};
    
    // Sort files to ensure directories come before their children
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
    
    sortedFiles.forEach(file => {
      const path = file.path === '/' ? '/' : file.path;
      const parts = path.split('/').filter(p => p.length > 0);
      
      // Handle root directory specially
      if (path === '/') {
        root['/'] = {
          name: '/',
          path: '/',
          type: 'directory',
          children: {}
        };
        return;
      }
      
      let current = root;
      
      // Create parent directories if they don't exist
      let parentPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        parentPath = parentPath ? `${parentPath}/${parts[i]}` : `/${parts[i]}`;
        
        if (!current[parentPath]) {
          current[parentPath] = {
            name: parts[i],
            path: parentPath,
            type: 'directory',
            children: {}
          };
        }
        
        current = current[parentPath].children;
      }
      
      // Add the actual file or directory
      const name = parts[parts.length - 1];
      const fullPath = parentPath ? `${parentPath}/${name}` : `/${name}`;
      
      current[fullPath] = {
        name,
        path: fullPath,
        type: file.type,
        children: file.type === 'directory' ? {} : undefined
      };
    });
    
    return root;
  };
  
  // Enhanced recursive function to list files with better error handling
  const listFiles = async (dir = '/', result: {path: string; type: 'file' | 'directory'}[] = []) => {
    if (!webContainer) {
      setDebugMessage('WebContainer not ready');
      return result;
    }
    
    try {
      console.log(`Reading directory: ${dir}`);
      setDebugMessage(prev => prev + `\nListing directory: ${dir}`);
      
      // Read the directory contents directly (no stat check first)
      try {
        const entries = await webContainer.fs.readdir(dir, { withFileTypes: true });
        console.log(`Found ${entries.length} entries in ${dir}`, entries);
        setDebugMessage(prev => prev + `\nFound ${entries.length} entries in ${dir}`);
        
        for (const entry of entries) {
          const path = `${dir === '/' ? '' : dir}/${entry.name}`;
          
          if (entry.isDirectory()) {
            result.push({ path, type: 'directory' });
            // Recursively list subdirectories
            await listFiles(path, result);
          } else {
            result.push({ path, type: 'file' });
          }
        }
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
        setDebugMessage(prev => prev + `\nError reading directory ${dir}: ${err}`);
        
        // If the error is directory not found, try to create it
        try {
          await webContainer.fs.mkdir(dir, { recursive: true });
          setDebugMessage(prev => prev + `\nCreated missing directory: ${dir}`);
        } catch (mkdirErr) {
          // Ignore mkdir errors - directory might already exist or be inaccessible
        }
      }
      
      return result;
    } catch (err) {
      console.error(`Error processing directory ${dir}:`, err);
      setDebugMessage(prev => prev + `\nError processing ${dir}: ${err}`);
      return result;
    }
  };
  
  // Load file content
  const loadFile = async (path: string) => {
    if (!webContainer) return;
    
    try {
      setLoading(true);
      const content = await webContainer.fs.readFile(path, 'utf-8');
      setFileContent(content);
      setSelectedFile(path);
      setSelectedKeys([path]);
    } catch (err) {
      console.error(`Error loading file ${path}:`, err);
      setDebugMessage(`Error loading file ${path}: ${err}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh file list
  const refreshFiles = async () => {
    setLoading(true);
    setDebugMessage('Starting refresh...');
    
    try {
      // Try to read root first
      try {
        const rootListing = await webContainer?.fs.readdir('/', { withFileTypes: true });
        if (rootListing) {
          console.log('Root directory contents:', rootListing);
          setDebugMessage(prev => prev + `\nRoot directory has ${rootListing.length} items`);
        }
      } catch (rootErr) {
        console.error('Error reading root directory:', rootErr);
        setDebugMessage(prev => prev + `\nError reading root: ${rootErr}`);
      }
      
      // Try to gather all files
      const allFiles: {path: string; type: 'file' | 'directory'}[] = [];
      
      // First add the root directory
      allFiles.push({ path: '/', type: 'directory' });
      
      // Then recursively list all files
      const foundFiles = await listFiles();
      allFiles.push(...foundFiles);
      
      console.log('All files:', allFiles);
      
      // Sort files by path
      allFiles.sort((a, b) => a.path.localeCompare(b.path));
      setFiles(allFiles);
      
      // Build file tree structure for the Tree component
      const tree = buildFileTree(allFiles);
      setFileTree(tree);
      
      // Expand root by default
      if (!expandedKeys.includes('/')) {
        setExpandedKeys(['/']);
      }
      
      setDebugMessage(prev => prev + `\nFound total ${allFiles.length} files and directories`);
      
      if (allFiles.length <= 1) {
        setDebugMessage(prev => prev + '\nWarning: Very few files found. Try running diagnostics.');
      }
    } catch (err) {
      console.error('Error listing files:', err);
      setDebugMessage(prev => prev + `\nError listing files: ${err}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize file list when WebContainer is ready with a delay
  useEffect(() => {
    if (webContainer) {
      setDebugMessage('WebContainer ready, waiting before initial scan...');
      
      // Add a short delay before initial file scan to ensure filesystem is mounted
      const timer = setTimeout(() => {
        console.log('Running initial file scan...');
        refreshFiles();
      }, 100); // Increased delay to ensure filesystems are mounted
      
      return () => clearTimeout(timer);
    }
  }, [webContainer]);
  
  // Function to create basic example files directly
  const createExampleFiles = async () => {
    if (!webContainer) return;
    
    setLoading(true);
    setDebugMessage('Creating example files directly...');
    
    try {
      // Create some example directories
      for (const dir of ['/example-files', '/example-files/subdir']) {
        try {
          await webContainer.fs.mkdir(dir, { recursive: true });
        } catch (err) {
          console.error(`Error creating directory ${dir}:`, err);
        }
      }
      
      // Create some example files
      const exampleFiles = {
        '/example-files/hello.txt': 'Hello, WebContainer!',
        '/example-files/test.js': 'console.log("This is a test file");',
        '/example-files/subdir/nested.txt': 'This is a nested file'
      };
      
      for (const [path, content] of Object.entries(exampleFiles)) {
        try {
          await webContainer.fs.writeFile(path, content);
          console.log(`Created example file: ${path}`);
        } catch (err) {
          console.error(`Error creating file ${path}:`, err);
        }
      }
      
      setDebugMessage(prev => prev + '\nExample files created! Refreshing file list...');
      await refreshFiles();
    } catch (err) {
      setDebugMessage(prev => prev + `\nError creating example files: ${err}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tree selection change
  const handleSelectionChange = (keys: Set<React.Key>) => {
    const selectedKeysArray = Array.from(keys).map(key => String(key));
    setSelectedKeys(selectedKeysArray);
    
    if (selectedKeysArray.length > 0) {
      const selectedPath = selectedKeysArray[0];
      
      // Check if it's a file before trying to load content
      const selectedFileItem = files.find(file => file.path === selectedPath);
      if (selectedFileItem && selectedFileItem.type === 'file') {
        loadFile(selectedPath);
      }
    }
  };
  
  // Handle tree expansion change
  const handleExpandedChange = (keys: Set<React.Key>) => {
    setExpandedKeys(Array.from(keys).map(key => String(key)));
  };
  
  // Render tree items recursively
  const renderTreeItems = (node: Record<string, any>) => {
    return Object.values(node).map(item => {
      if (!item) return null;
      
      return (
        <TreeItem key={item.path} id={item.path} textValue={item.name}>
          <TreeItemContent>
            <div className="flex items-center py-1 px-1 text-xs">
              {item.type === 'directory' ? (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span>{item.name}</span>
            </div>
          </TreeItemContent>
          {item.children && Object.keys(item.children).length > 0 && renderTreeItems(item.children)}
        </TreeItem>
      );
    });
  };
  
  return (
    <div className="border rounded-md p-4 bg-gray-100 col-span-1 md:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">File Browser (Aggregated Filesystem)</h3>
        <div className="flex space-x-2">
          <button 
            onClick={refreshFiles}
            disabled={loading || !webContainer}
            className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
          >
            {loading ? 'Loading...' : 'Refresh Files'}
          </button>
          <button 
            onClick={createExampleFiles}
            disabled={loading || !webContainer}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Create Example Files
          </button>
        </div>
      </div>
      
      <div className="mb-4 text-xs text-gray-600 bg-gray-200 p-2 rounded">
        <p><strong>File System Status:</strong> {webContainer ? 'WebContainer Ready' : 'WebContainer Not Ready'}</p>
        <p><strong>Registered Filesystems:</strong> {filesystemIds.length}</p>
      </div>
      
      {debugMessage && (
        <div className="bg-gray-800 text-green-400 p-2 rounded text-xs mb-4 max-h-40 overflow-auto">
          <div className="font-bold mb-1">Debug Info:</div>
          <pre className="whitespace-pre-wrap">{debugMessage}</pre>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-3 rounded border max-h-96 overflow-auto">
          <h4 className="text-sm font-medium mb-2">File Explorer</h4>
          {Object.keys(fileTree).length > 0 ? (
            <Tree 
              aria-label="File System" 
              selectionMode="single"
              selectedKeys={selectedKeys}
              onSelectionChange={handleSelectionChange}
              expandedKeys={expandedKeys}
              onExpandedChange={handleExpandedChange}
              className="text-xs"
            >
              {renderTreeItems(fileTree)}
            </Tree>
          ) : (
            <div className="text-gray-500 text-center py-4">
              {webContainer ? 'No files found' : 'Waiting for WebContainer...'}
            </div>
          )}
        </div>
        
        <div className="bg-white p-3 rounded border col-span-1 md:col-span-2 max-h-96 overflow-auto">
          <h4 className="text-sm font-medium mb-2">
            {selectedFile ? (
              <span>File: <code className="bg-gray-100 px-1 py-0.5 rounded">{selectedFile}</code></span>
            ) : (
              'File Content'
            )}
          </h4>
          
          {selectedFile ? (
            <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap max-h-80 overflow-auto">
              {fileContent}
            </pre>
          ) : (
            <div className="text-gray-500 text-center py-10">
              Select a file to view its content
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
