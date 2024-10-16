const { app, BrowserWindow, ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const notifier = require('node-notifier');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    const dbPath = path.join(app.getPath('userData'), 'notes.db');
    const db = new sqlite3.Database(dbPath);

    db.run('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, reminderDate TEXT)');

    
    ipcMain.on('get-notes', (event) => {
        db.all('SELECT * FROM notes', (err, rows) => {
            if (err) {
                console.error(err);
                event.reply('notes-response', []);
            } else {
                event.reply('notes-response', rows);
            }
        });
    });

    ipcMain.on('create-note', (event, data) => {
        db.run('INSERT INTO notes (title, content, reminderDate) VALUES (?, ?, ?)', [data.title, data.content, data.reminderDate], function (err) {
            if (err) {
                console.error(err);
                event.reply('create-note-response', false);
            } else {
                event.reply('create-note-response', true, this.lastID);
              
                if (data.reminderDate) {
                    scheduleReminder(data.reminderDate, data.title);
                }
            }
        });
    });

    ipcMain.on('update-note', (event, data) => {
        db.run('UPDATE notes SET title = ?, content = ?, reminderDate = ? WHERE id = ?', [data.title, data.content, data.reminderDate, data.id], (err) => {
            if (err) {
                console.error(err);
                event.reply('update-note-response', false);
            } else {
                event.reply('update-note-response', true);
                
                if (data.reminderDate) {
                    scheduleReminder(data.reminderDate, data.title);
                }
            }
        });
    });

    ipcMain.on('delete-note', (event, id) => {
        db.run('DELETE FROM notes WHERE id = ?', [id], (err) => {
            if (err) {
                console.error(err);
                event.reply('delete-note-response', false);
            } else {
                event.reply('delete-note-response', true);
            }
        });
    });

    ipcMain.on('get-note-by-id', (event, id) => {
        db.get('SELECT * FROM notes WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error(err);
                event.reply('note-response', null);
            } else {
                event.reply('note-response', row);
            }
        });
    });

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


function scheduleReminder(reminderDate, title) {
    const reminderDateObj = new Date(reminderDate);
    const now = new Date();
    const diff = reminderDateObj.getTime() - now.getTime();

    if (diff > 0) {
        setTimeout(() => {
            notifier.notify({
                title: 'Напоминание!',
                message: `Напоминание о заметке: ${title}`,
            });
        }, diff);
    }
}