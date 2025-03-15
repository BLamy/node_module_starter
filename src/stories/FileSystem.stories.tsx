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

// Interface for file system entries
interface FSEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FSEntry[];
}

// Story 1: File System Operations with Tree View
export const FileSystem: Story = {
  render: () => {
    const webContainer = useWebContainer();
    const [message, setMessage] = useState('');
    const [fileTree, setFileTree] = useState<FSEntry[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [isDirectory, setIsDirectory] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [editorLanguage, setEditorLanguage] = useState<string>('plaintext');

    // File extension to language mapping for Monaco
    const getLanguageFromPath = (path: string): string => {
      const extension = path.split('.').pop()?.toLowerCase() || '';
      const languageMap: Record<string, string> = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'html': 'html',
        'htm': 'html',
        'css': 'css',
        'json': 'json',
        'md': 'markdown',
        'py': 'python',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'h': 'cpp',
        'go': 'go',
        'rs': 'rust',
        'sh': 'shell',
        'bash': 'shell',
        'txt': 'plaintext',
      };
      return languageMap[extension] || 'plaintext';
    };

    // Initialize the file system with some example files
    const initializeFileSystem = async () => {
      if (!webContainer) return;
      
      setIsLoading(true);
      setMessage('Initializing file system...');
      
      try {
        // Create some example files in different directories
        await webContainer.fs.mkdir('/src');
        await webContainer.fs.mkdir('/src/components');
        await webContainer.fs.mkdir('/src/styles');
        await webContainer.fs.mkdir('/public');
        
        // Create example files
        await webContainer.fs.writeFile('/src/index.js', `
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/index.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
`);
        
        await webContainer.fs.writeFile('/src/App.js', `
import React from 'react';
import { Button } from './components/Button';
import './styles/App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>WebContainer File Browser Example</h1>
        <p>
          This is a demo application running in a WebContainer.
        </p>
        <Button onClick={() => alert('Button clicked!')}>
          Click me
        </Button>
      </header>
    </div>
  );
}

export default App;
`);
        
        await webContainer.fs.writeFile('/src/components/Button.js', `
import React from 'react';
import '../styles/Button.css';

export const Button = ({ children, onClick }) => {
  return (
    <button className="button" onClick={onClick}>
      {children}
    </button>
  );
};
`);
        
        await webContainer.fs.writeFile('/src/styles/index.css', `
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
`);
        
        await webContainer.fs.writeFile('/src/styles/App.css', `
.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}
`);
        
        await webContainer.fs.writeFile('/src/styles/Button.css', `
.button {
  background-color: #61dafb;
  border: none;
  color: #282c34;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.button:hover {
  background-color: #21a1cb;
}
`);
        
        await webContainer.fs.writeFile('/public/index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WebContainer App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
`);
        
        await webContainer.fs.writeFile('/README.md', `# WebContainer File Browser Demo

This is a demo project showing how to use the WebContainer API to create a file browser with code editing capabilities.

## Features

- Tree-based file navigation
- Monaco Editor integration for code viewing and editing
- Support for multiple file types

## Getting Started

1. Browse the file tree on the left
2. Click on a file to view its contents
3. Edit files directly in the editor
`);
        
        // Load the file tree after initialization
        await buildFileTree();
        setMessage('File system initialized with example files!');
      } catch (err) {
        setMessage(`Error initializing file system: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Build file tree recursively from filesystem
    const buildFileTree = async (dir = '/') => {
      if (!webContainer) return;
      
      try {
        const entries = await webContainer.fs.readdir(dir, { withFileTypes: true });
        const result: FSEntry[] = [];
        
        for (const entry of entries) {
          const path = `${dir === '/' ? '' : dir}/${entry.name}`;
          
          if (entry.isDirectory()) {
            const children = await buildFileTree(path);
            result.push({
              name: entry.name,
              path,
              isDirectory: true,
              children
            });
          } else {
            result.push({
              name: entry.name,
              path,
              isDirectory: false
            });
          }
        }
        
        // Sort: directories first, then files, all alphabetically
        result.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
        
        if (dir === '/') {
          setFileTree(result);
        }
        
        return result;
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
        return [];
      }
    };

    // Open a file
    const openFile = async (path: string) => {
      if (!webContainer) return;
      
      try {
        setIsLoading(true);
        
        // Check if it's a directory by trying to read it as a directory
        try {
          // If this succeeds, it's a directory
          await webContainer.fs.readdir(path);
          setIsDirectory(true);
          
          // If it's a directory, toggle expanded state
          setExpandedKeys(prev => 
            prev.includes(path) 
              ? prev.filter(key => key !== path) 
              : [...prev, path]
          );
        } catch (err) {
          // If reading as directory fails, assume it's a file
          setIsDirectory(false);
          
          // Read the file content
          const content = await webContainer.fs.readFile(path, 'utf-8');
          setFileContent(content);
          setCurrentFilePath(path);
          setEditorLanguage(getLanguageFromPath(path));
        }
      } catch (err) {
        setMessage(`Error opening ${path}: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Save the current file
    const saveFile = async () => {
      if (!webContainer || !currentFilePath) return;
      
      try {
        await webContainer.fs.writeFile(currentFilePath, fileContent);
        setMessage(`File saved: ${currentFilePath}`);
      } catch (err) {
        setMessage(`Error saving file: ${err}`);
      }
    };

    // Create file tree items recursively
    const renderFileTree = (entries: FSEntry[]) => {
      return entries.map(entry => (
        <TreeItem 
          key={entry.path} 
          id={entry.path} 
          textValue={entry.name}
        >
          <TreeItemContent>
            <div className="flex items-center">
              {entry.isDirectory ? (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span className={entry.isDirectory ? "font-medium" : ""}>{entry.name}</span>
            </div>
          </TreeItemContent>
          {entry.children && entry.children.length > 0 && renderFileTree(entry.children)}
        </TreeItem>
      ));
    };

    // Initialize on mount
    useEffect(() => {
      if (webContainer) {
        initializeFileSystem();
      }
    }, [webContainer]);

    // Handler for tree selection change
    const handleSelectionChange = (keys: any) => {
      // Convert the Selection type to array of strings
      const selectedKeysArray = Array.from(keys).map(key => String(key));
      setSelectedKeys(selectedKeysArray);
      
      if (selectedKeysArray.length > 0) {
        openFile(selectedKeysArray[selectedKeysArray.length - 1]);
      }
    };

    return (
      <WebContainerDemo 
        title="File Browser with Code Editor" 
        description="Browse the file system and edit code files with Monaco Editor."
      >
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button 
              onClick={initializeFileSystem}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Reset Example Files'}
            </button>
            {currentFilePath && !isDirectory && (
              <button 
                onClick={saveFile}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save File
              </button>
            )}
            <button 
              onClick={() => buildFileTree()}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              disabled={isLoading}
            >
              Refresh Tree
            </button>
          </div>
          
          {message && (
            <div className="bg-gray-100 p-3 rounded border">
              {message}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* File Tree */}
            <div className="border rounded-md bg-white p-2 h-[500px] overflow-auto">
              <h3 className="font-semibold mb-2 p-2 bg-gray-100 rounded sticky top-0">File Explorer</h3>
              {fileTree.length > 0 ? (
                <Tree 
                  aria-label="File System" 
                  selectionMode="single"
                  selectedKeys={selectedKeys}
                  onSelectionChange={handleSelectionChange}
                  expandedKeys={expandedKeys}
                  onExpandedChange={keys => setExpandedKeys(Array.from(keys).map(key => String(key)))}
                >
                  {renderFileTree(fileTree)}
                </Tree>
              ) : (
                <div className="flex justify-center items-center h-full text-gray-500">
                  No files found
                </div>
              )}
            </div>
            
            {/* File Content / Editor */}
            <div className="border rounded-md bg-white col-span-2 h-[500px] overflow-hidden flex flex-col">
              {currentFilePath ? (
                <>
                  <div className="bg-gray-100 p-2 flex justify-between items-center sticky top-0">
                    <h3 className="font-semibold">
                      {currentFilePath}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                      {editorLanguage}
                    </span>
                  </div>
                  
                  {isDirectory ? (
                    <div className="flex-1 flex justify-center items-center p-4 text-gray-500">
                      This is a directory. Select a file to view its contents.
                    </div>
                  ) : (
                    <div className="flex-1">
                      <Editor
                        height="100%"
                        defaultLanguage={editorLanguage}
                        language={editorLanguage}
                        value={fileContent}
                        onChange={(value) => setFileContent(value || '')}
                        theme="vs-light"
                        options={{
                          minimap: { enabled: false },
                          wordWrap: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex justify-center items-center p-4 text-gray-500">
                  Select a file from the explorer to view its contents.
                </div>
              )}
            </div>
          </div>
        </div>
      </WebContainerDemo>
    );
  }
};
