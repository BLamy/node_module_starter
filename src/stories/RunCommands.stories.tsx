import React, { useEffect, useState, useRef } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { useWebContainer } from '../src/wmcp/Webcontainer';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const meta: Meta = {
  title: 'WebContainer/RunCommands',
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

// Story: Running Commands with Interactive Terminal
export const RunCommands: Story = {
  render: () => {
    const webContainer = useWebContainer();
    const [isInitialized, setIsInitialized] = useState(false);
    const [message, setMessage] = useState('Waiting for WebContainer...');
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminalInstanceRef = useRef<Terminal | null>(null);
    const shellProcessRef = useRef<any>(null);
    const initAttemptedRef = useRef(false);
    
    // Initialize terminal and start shell
    const initializeTerminal = async () => {
      if (!webContainer || !terminalRef.current || isInitialized) {
        console.log('Cannot initialize terminal:', {
          hasWebContainer: !!webContainer,
          hasTerminalRef: !!terminalRef.current,
          isAlreadyInitialized: isInitialized
        });
        return;
      }
      
      // Mark that we've attempted initialization
      initAttemptedRef.current = true;
      
      try {
        setMessage('Initializing terminal...');
        console.log('Terminal initialization started');
        
        // Create terminal instance
        const terminal = new Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'Menlo, monospace',
          theme: {
            background: '#1e1e1e',
            foreground: '#f8f8f8',
            cursor: '#f8f8f8',
            black: '#000000',
            red: '#e06c75',
            green: '#98c379',
            yellow: '#e5c07b',
            blue: '#61afef',
            magenta: '#c678dd',
            cyan: '#56b6c2',
            white: '#d0d0d0'
          }
        });
        
        // Add fit addon
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        
        // Open terminal in the container
        terminal.open(terminalRef.current);
        fitAddon.fit();
        console.log('Terminal opened');
        
        // Start a shell
        let shellProcess = null;
        
        try {
          // Try jsh first (the shell used in the WebContainer examples)
          console.log('Trying to spawn jsh...');
          shellProcess = await webContainer.spawn('jsh', {
            terminal: {
              cols: terminal.cols,
              rows: terminal.rows
            }
          });
          console.log('Successfully spawned jsh');
        } catch (jshErr) {
          console.log('jsh not available, trying bash...', jshErr);
          try {
            // Fallback to bash
            shellProcess = await webContainer.spawn('bash', {
              terminal: {
                cols: terminal.cols,
                rows: terminal.rows
              }
            });
            console.log('Successfully spawned bash');
          } catch (bashErr) {
            console.log('bash not available, trying sh...', bashErr);
            try {
              // Last resort, try sh
              shellProcess = await webContainer.spawn('sh', {
                terminal: {
                  cols: terminal.cols,
                  rows: terminal.rows
                }
              });
              console.log('Successfully spawned sh');
            } catch (shErr) {
              console.error('All shell spawn attempts failed:', shErr);
              throw new Error('Could not spawn any shell (jsh, bash, or sh)');
            }
          }
        }
        
        shellProcessRef.current = shellProcess;
        
        if (shellProcessRef.current) {
          // Pipe the shell output to the terminal
          shellProcessRef.current.output.pipeTo(
            new WritableStream({
              write(data) {
                terminal.write(data);
              }
            })
          );
          
          // Set up terminal input to write to shell
          const input = shellProcessRef.current.input.getWriter();
          terminal.onData((data) => {
            input.write(data);
          });
          
          // Handle window resize
          const handleResize = () => {
            fitAddon.fit();
            shellProcessRef.current?.resize({
              cols: terminal.cols,
              rows: terminal.rows
            });
          };
          
          window.addEventListener('resize', handleResize);
          
          // Save terminal instance for cleanup
          terminalInstanceRef.current = terminal;
          
          // Send some initial commands to show the terminal is working
          input.write('echo "Terminal initialized successfully"\n');
          input.write('ls -la\n');
          
          setIsInitialized(true);
          setMessage('Terminal ready! Type commands directly in the terminal.');
          console.log('Terminal fully initialized');
        } else {
          setMessage('Failed to start a shell process. No supported shell found.');
          console.error('Shell process failed to initialize');
        }
      } catch (err) {
        console.error('Terminal initialization error:', err);
        setMessage(`Error initializing terminal: ${err}`);
      }
    };
    
    // Clean up on unmount
    useEffect(() => {
      return () => {
        if (shellProcessRef.current) {
          console.log('Cleaning up shell process');
          shellProcessRef.current.kill();
        }
        if (terminalInstanceRef.current) {
          console.log('Disposing terminal instance');
          terminalInstanceRef.current.dispose();
        }
      };
    }, []);
    
    // Initialize terminal when webcontainer is ready
    useEffect(() => {
      if (webContainer && terminalRef.current && !isInitialized && !initAttemptedRef.current) {
        console.log('WebContainer available, attempting to initialize terminal');
        // Small delay to ensure the DOM is fully rendered
        const timer = setTimeout(() => {
          initializeTerminal();
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }, [webContainer, isInitialized]);
    
    // Fallback for when the effect doesn't trigger
    useEffect(() => {
      if (webContainer && !isInitialized && !initAttemptedRef.current) {
        console.log('Backup initialization check triggered');
        const timer = setTimeout(() => {
          if (!isInitialized && !initAttemptedRef.current && terminalRef.current) {
            console.log('Attempting backup initialization');
            initializeTerminal();
          }
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }, [webContainer, isInitialized]);

    return (
      <WebContainerDemo 
        title="Interactive Terminal" 
        description="Interactive terminal running in the WebContainer environment. Type commands directly into the terminal."
      >
        <div className="space-y-4">
          {message && (
            <div className="bg-gray-100 p-3 rounded border">
              {message}
            </div>
          )}
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Terminal:</h3>
            <div
              ref={terminalRef}
              className="rounded border h-96 bg-[#1e1e1e] overflow-hidden"
            />
            
            {!isInitialized && (
              <p className="text-gray-500 text-sm mt-2">
                Terminal initializing... Please wait.
              </p>
            )}
            {isInitialized && (
              <p className="text-gray-500 text-sm mt-2">
                The terminal is fully interactive. Type commands and press Enter to execute them.
              </p>
            )}
          </div>
          
          {!isInitialized && webContainer && terminalRef.current && !initAttemptedRef.current && (
            <button 
              onClick={initializeTerminal}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Manual Initialize Terminal
            </button>
          )}
        </div>
      </WebContainerDemo>
    );
  }
};
