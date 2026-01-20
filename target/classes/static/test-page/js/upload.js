// upload-functions.js - File upload operations

// 2. Upload Vocal Track
async function uploadVocalTrack() {
    const songId = document.getElementById('uploadSongId').value;
    const file = document.getElementById('vocalFile').files[0];

    if (!songId || !file) {
        alert('Please enter Song ID and select a file');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${baseUrl}/vocal/${songId}`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            showStatus('uploadStatus', 'Vocal track uploaded successfully!');
            document.getElementById('vocalFile').value = '';
        } else {
            showStatus('uploadStatus', `Upload failed: ${response.statusText}`, true);
        }
    } catch (error) {
        showStatus('uploadStatus', `Error: ${error.message}`, true);
    }
}

// 2. Upload Audio Track
async function uploadAudioTrack() {
    const songId = document.getElementById('uploadSongId').value;
    const file = document.getElementById('audioFile').files[0];

    if (!songId || !file) {
        alert('Please enter Song ID and select a file');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${baseUrl}/audio/${songId}`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            showStatus('uploadStatus', 'Audio track uploaded successfully!');
            document.getElementById('audioFile').value = '';
        } else {
            showStatus('uploadStatus', `Upload failed: ${response.statusText}`, true);
        }
    } catch (error) {
        showStatus('uploadStatus', `Error: ${error.message}`, true);
    }
}

// 5. Save LRC File
async function saveLrcFile() {
    const file = document.getElementById('lrcFile').files[0];

    if (!file) {
        alert('Please select an LRC file');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${baseUrl}/lrc/save`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            showStatus('lrcStatus', 'LRC file saved successfully!');
            document.getElementById('lrcFile').value = '';
        } else {
            showStatus('lrcStatus', `Save failed: ${response.statusText}`, true);
        }
    } catch (error) {
        showStatus('lrcStatus', `Error: ${error.message}`, true);
    }
}