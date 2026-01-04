
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 850,
    title: "Mobil Market",
    autoHideMenuBar: true, // Menü çubuğunu gizle (Gerçek uygulama hissi)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    // Uygulama ikonu varsa buraya ekleyebilirsin
    // icon: path.join(__dirname, 'assets/icon.png')
  });

  // Sunucunun başlaması için 2 saniye bekle ve sonra yükle
  setTimeout(() => {
    mainWindow.loadURL('http://127.0.0.1:5000');
  }, 2000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Flask Backend'i Başlat
function startPython() {
  // Python sanal ortam yolunu belirle
  const pythonPath = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
  const scriptPath = path.join(__dirname, 'app.py');

  pythonProcess = spawn(pythonPath, [scriptPath]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Hata: ${data}`);
  });
}

app.on('ready', () => {
  startPython();
  createWindow();
});

// Uygulama kapandığında Python'u da kapat
app.on('window-all-closed', function () {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
