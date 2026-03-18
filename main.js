const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const isDev = !app.isPackaged;

// Start Express in production (Standalone)
if (!isDev) {
    process.env.NODE_ENV = 'production';
    process.env.PORT = '5000';
    process.env.LOCAL_SOFTWARE_MODE = 'true';
    
    // In Electron, app.getAppPath() points to the folder containing package.json (or the contents of app.asar)
    const appDir = app.getAppPath();
    process.env.APP_PATH = appDir;

    // Relative to main.js, find the server bundle
    const serverBundle = path.join(__dirname, 'dist', 'index.cjs');
    
    // Load local config (.env) if exists next to the EXE
    const exeDir = path.dirname(process.execPath);
    const externalEnv = path.join(exeDir, '.env');
    if (fs.existsSync(externalEnv)) {
        require('dotenv').config({ path: externalEnv });
    }

    try {
        console.log('[main] Booting server from:', serverBundle);
        require(serverBundle);
    } catch (e) {
        console.error('[main] Server boot failed:', e);
    }
} else {
    process.env.LOCAL_SOFTWARE_MODE = 'true';
}

const SERVER_URL = 'http://127.0.0.1:5000';

function waitForServer(retries, delay, onReady, onFail) {
    http.get(SERVER_URL, (res) => {
        // Only accept successful/ok responses to prevent blank pages during early boot
        if (res.statusCode === 200 || res.statusCode === 302 || res.statusCode === 404) {
            onReady();
        } else {
            setTimeout(() => waitForServer(retries - 1, delay, onReady, onFail), delay);
        }
    }).on('error', () => {
        if (retries <= 0) onFail();
        else setTimeout(() => waitForServer(retries - 1, delay, onReady, onFail), delay);
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        backgroundColor: '#030303',
        show: false,
        title: "EventFold Studio Elite v1.0.2",
        icon: path.join(__dirname, 'client/public/branding material/fevicon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false
        }
    });

    win.setMenuBarVisibility(false);
    win.removeMenu();

    if (isDev) {
        win.loadURL(SERVER_URL);
        win.webContents.openDevTools();
        win.show();
    } else {
        // PRODUCTION: Wait for port 5000 to be alive
        waitForServer(60, 500, 
            () => {
                win.loadURL(SERVER_URL);
                win.once('ready-to-show', () => win.show());
            },
            () => {
                console.error('[main] Server timeout. Loading anyway...');
                win.loadURL(SERVER_URL);
                win.show();
            }
        );
    }

    win.webContents.on('did-fail-load', () => {
        setTimeout(() => win.loadURL(SERVER_URL), 2000);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('quit-app', () => app.quit());
