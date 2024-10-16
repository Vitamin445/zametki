const { ipcRenderer } = require('electron');
const notesList = document.getElementById('notes-list');
const noteEditor = document.getElementById('note-editor');
const newNoteBtn = document.getElementById('new-note-btn');
const saveNoteBtn = document.getElementById('save-note-btn');
const deleteNoteBtn = noteEditor.querySelector('.delete-btn');
const reminderInput = document.getElementById('reminder-date');


const displayNotes = async () => {
    notesList.innerHTML = '';
    const notes = await getNotes();
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        noteElement.textContent = note.title;
        noteElement.dataset.id = note.id;
        notesList.appendChild(noteElement);

        noteElement.addEventListener('click', async () => {
            const noteId = noteElement.dataset.id;
            const note = await getNoteById(noteId);
            noteEditor.style.display = 'block';
            document.getElementById('note-title').value = note.title;
            document.getElementById('note-content').value = note.content;
            reminderInput.value = note.reminderDate;
            noteEditor.dataset.id = noteId;
        });
    });
};


const getNotes = async () => {
    ipcRenderer.send('get-notes');
    return new Promise((resolve, reject) => {
        ipcRenderer.on('notes-response', (event, notes) => {
            resolve(notes);
        });
    });
};


const getNoteById = async (id) => {
    ipcRenderer.send('get-note-by-id', id);
    return new Promise((resolve, reject) => {
        ipcRenderer.on('note-response', (event, note) => {
            resolve(note);
        });
    });
};


const createNote = async (title, content, reminderDate) => {
    ipcRenderer.send('create-note', { title, content, reminderDate });
    return new Promise((resolve, reject) => {
        ipcRenderer.on('create-note-response', (event, success, id) => {
            if (success) {
                resolve(id);
            } else {
                reject(new Error('Ошибка создания заметки'));
            }
        });
    });
};


const updateNote = async (id, title, content, reminderDate) => {
    ipcRenderer.send('update-note', { id, title, content, reminderDate });
    return new Promise((resolve, reject) => {
        ipcRenderer.on('update-note-response', (event, success) => {
            if (success) {
                resolve();
            } else {
                reject(new Error('Ошибка обновления заметки'));
            }
        });
    });
};


const deleteNote = async (id) => {
    ipcRenderer.send('delete-note', id);
    return new Promise((resolve, reject) => {
        ipcRenderer.on('delete-note-response', (event, success) => {
            if (success) {
                resolve();
            } else {
                reject(new Error('Ошибка удаления заметки'));
            }
        });
    });
};


newNoteBtn.addEventListener('click', () => {
    noteEditor.style.display = 'block';
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    reminderInput.value = ''; 
    delete noteEditor.dataset.id;
});


saveNoteBtn.addEventListener('click', async () => {
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;
    const reminderDate = reminderInput.value; 
    let noteId = noteEditor.dataset.id;

    if (noteId) {
        await updateNote(noteId, title, content, reminderDate);
    } else {
        noteId = await createNote(title, content, reminderDate);
    }

    await displayNotes();
    noteEditor.style.display = 'none';
});


deleteNoteBtn.addEventListener('click', async () => {
    const noteId = noteEditor.dataset.id;
    if (noteId) {
        await deleteNote(noteId);
        await displayNotes();
        noteEditor.style.display = 'none';
    }
});


displayNotes();