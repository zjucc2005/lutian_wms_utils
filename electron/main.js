// import electron
const { BrowserWindow, app } = require('electron');
// init window
const createWindow = () => {
    const win = new BrowserWindow({
        width: 1080,
        height: 1000,
        minWidth: 480,
        minHeight: 960,
        // resizable: false,
        // maximizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            // nodeIntegration: true,
            // contenxtIsolation: false
            webSecurity: false
        }
    })
    
    win.webContents.on('before-input-event', (event, input) => {
        // console.log('before-input-event', event, input)
        if (input.control && input.key == '-') {
            event.preventDefault()
        }
    })
    
    // win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    //     callback({ 
    //         requestHeaders: { 
    //             Origin: '*', 
    //             ...details.requestHeaders 
    //         }
    //     })
    // });
    
    // win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    //     callback({
    //         responseHeaders: {
    //             'Access-Control-Allow-Origin': ['*'],
    //             ...details.responseHeaders
    //         }
    //     })
    // })
    
    win.loadFile('./app/index.html')
    // 打开调试窗口
    // win.webContents.openDevTools()
}

// init app
app.whenReady().then(() => {
    createWindow()
    
    // listener
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})