const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

// Start the background server in production
if (!isDev) {
    // Set environment variables for the packaged server
    process.env.NODE_ENV = 'production';
    process.env.PORT = '5000'; // Keep port consistent with development

    try {
        // Require the bundled server logic
        // It will call httpServer.listen() automatically
        require(path.join(__dirname, 'dist/index.cjs'));
    } catch (e) {
        console.error("Failed to start background server:", e);
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 820,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false, // Allow Vite dev server scripts in development
        },
        title: "EventFold Studio",
        backgroundColor: '#000000',
        show: false
    });

    win.center();

    // Allow all content in dev mode (fixes CSP blocking React/Vite)
    if (isDev) {
        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [
                        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * ws: wss:;"
                    ]
                }
            });
        });
        win.loadURL('http://127.0.0.1:5000');
        win.webContents.openDevTools();
    } else {
        // In production, we still load from the local loopback server 
        // that we started at the top of this file.
        win.loadURL('http://127.0.0.1:5000');
    }

    win.once('ready-to-show', () => {
        win.show();
    });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`Failed to load: ${validatedURL} — ${errorDescription} (${errorCode})`);
        // Retry after 2 seconds if server isn't ready yet
        setTimeout(() => {
            if (isDev) win.loadURL('http://127.0.0.1:5000');
        }, 2000);
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
