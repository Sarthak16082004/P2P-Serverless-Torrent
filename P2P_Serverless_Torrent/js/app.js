// Initialize WebTorrent client with enhanced configuration
const client = new WebTorrent({
    tracker: {
        announce: [
            'wss://tracker.openwebtorrent.com',
            'wss://tracker.btorrent.xyz',
            'wss://tracker.fastcast.nz'
        ]
    },
    maxConns: 55, // Maximum number of connections
    webSeeds: true // Enable web seeds
});

// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const uploadInfo = document.getElementById('uploadInfo');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = uploadProgress.querySelector('.progress-bar');
const progressText = uploadProgress.querySelector('.progress-text');
const infoHash = document.getElementById('infoHash');
const magnetLink = document.getElementById('magnetLink');
const copyMagnetBtn = document.getElementById('copyMagnet');
const torrentInput = document.getElementById('torrentInput');
const downloadBtn = document.getElementById('downloadBtn');
const torrentList = document.getElementById('torrentList');
const playerSection = document.getElementById('playerSection');
const videoPlayer = document.getElementById('videoPlayer');
const fileName = document.getElementById('fileName');
const downloadSpeed = document.getElementById('downloadSpeed');
const peerCount = document.getElementById('peerCount');
const downloadProgress = document.getElementById('downloadProgress');
const logContainer = document.getElementById('logContainer');
const clearLogBtn = document.getElementById('clearLog');
const darkModeToggle = document.getElementById('darkMode');

// File type icons mapping
const fileIcons = {
    'video': 'fa-video',
    'audio': 'fa-music',
    'image': 'fa-image',
    'document': 'fa-file-alt',
    'archive': 'fa-file-archive',
    'code': 'fa-code',
    'default': 'fa-file'
};

// Get file type icon
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mkv', 'avi'].includes(ext)) return fileIcons.video;
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return fileIcons.audio;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return fileIcons.image;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return fileIcons.document;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return fileIcons.archive;
    if (['js', 'html', 'css', 'py', 'java', 'cpp'].includes(ext)) return fileIcons.code;
    return fileIcons.default;
}

// Dark Mode Toggle
darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', darkModeToggle.checked);
    localStorage.setItem('darkMode', darkModeToggle.checked ? 'true' : 'false');
    log('Theme changed to ' + (darkModeToggle.checked ? 'dark' : 'light'), 'info');
});

// Load saved dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
}

// Copy Magnet Link
copyMagnetBtn.addEventListener('click', () => {
    const magnet = magnetLink.href;
    navigator.clipboard.writeText(magnet).then(() => {
        log('Magnet link copied to clipboard', 'success');
        copyMagnetBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
        setTimeout(() => {
            copyMagnetBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
    }).catch(err => {
        log('Failed to copy magnet link: ' + err, 'error');
    });
});

// Clear Log
clearLogBtn.addEventListener('click', () => {
    logContainer.innerHTML = '';
    log('Log cleared', 'info');
});

// Drag and Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropArea.classList.add('active');
}

function unhighlight() {
    dropArea.classList.remove('active');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// File Input
fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
});

// Handle file uploads
function handleFiles(files) {
    if (files.length === 0) return;
    log('Starting upload of ' + files.length + ' file(s)', 'info');
    uploadInfo.classList.remove('hidden');
    
    // Reset progress UI
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    
    try {
        client.seed(files, {
            announce: [
                'wss://tracker.openwebtorrent.com',
                'wss://tracker.btorrent.xyz',
                'wss://tracker.fastcast.nz'
            ]
        }, (torrent) => {
            log('Upload complete!', 'success');
            infoHash.textContent = torrent.infoHash;
            magnetLink.href = torrent.magnetURI;
            magnetLink.textContent = torrent.magnetURI;
            
            // Set progress to 100%
            progressBar.style.width = '100%';
            progressText.textContent = '100%';
            
            log('Magnet link generated', 'info');
            
            // Track upload progress
            torrent.on('upload', (bytes) => {
                log(`Uploaded: ${formatBytes(torrent.uploaded)} (${torrent.numPeers} peers)`, 'info');
            });
            
            // Log peer connections
            torrent.on('wire', (wire) => {
                log(`New peer connected for upload`, 'info');
            });
        });
    } catch (error) {
        log(`Error seeding files: ${error.message}`, 'error');
    }
}

// Download torrent
downloadBtn.addEventListener('click', () => {
    const torrentId = torrentInput.value.trim();
    if (!torrentId) {
        log('Please enter a magnet link or info hash', 'warning');
        return;
    }
    
    // Normalize the torrent ID (convert hash to magnet if needed)
    let normalizedId = torrentId;
    if (/^[a-f0-9]{40}$/i.test(torrentId)) {
        normalizedId = `magnet:?xt=urn:btih:${torrentId}`;
        log('Converted hash to magnet URI', 'info');
    }
    
    log('Starting download...', 'info');
    try {
        client.add(normalizedId, {
            announce: [
                'wss://tracker.openwebtorrent.com',
                'wss://tracker.btorrent.xyz',
                'wss://tracker.fastcast.nz'
            ]
        }, (torrent) => {
            log('Download started: ' + torrent.name, 'success');
            torrentInput.value = '';
            updateTorrentList();
            
            // Set up download progress tracking
            torrent.on('download', (bytes) => {
                const progress = Math.round(torrent.progress * 100);
                log(`Downloading ${torrent.name}: ${progress}% complete`, 'info');
                updateTorrentList(); 
            });
            
            // Handle download completion
            torrent.on('done', () => {
                log(`Download complete: ${torrent.name}`, 'success');
                saveToLocalStorage(torrent);
                updateTorrentList();
            });
            
            // Handle errors
            torrent.on('error', (err) => {
                log(`Error downloading ${torrent.name}: ${err.message}`, 'error');
            });
            
            // Handle peer connections
            torrent.on('wire', () => {
                log(`New peer connected for ${torrent.name}`, 'info');
                updateTorrentList();
            });
        });
    } catch (error) {
        log(`Error adding torrent: ${error.message}`, 'error');
    }
});

// Update torrent list with enhanced UI
function updateTorrentList() {
    torrentList.innerHTML = '';
    
    if (client.torrents.length === 0) {
        torrentList.innerHTML = '<div class="empty-message">No active torrents</div>';
        return;
    }
    
    client.torrents.forEach(torrent => {
        const torrentElement = document.createElement('div');
        torrentElement.className = 'torrent-item';
        
        // Get file type icon (handle case where files array might be empty)
        let fileIcon = fileIcons.default;
        if (torrent.files && torrent.files.length > 0) {
            fileIcon = getFileIcon(torrent.files[0].name);
        }
        
        const progress = Math.round(torrent.progress * 100);
        
        torrentElement.innerHTML = `
            <div class="torrent-item-header">
                <div class="torrent-info">
                    <i class="fas ${fileIcon} torrent-icon"></i>
                    <h3>${torrent.name}</h3>
                </div>
                <div class="torrent-actions">
                    ${torrent.files && torrent.files.length > 0 && hasPlayableFile(torrent) ? `
                        <button class="btn btn-small" onclick="playFile('${torrent.infoHash}')">
                            <i class="fas fa-play"></i> Play
                        </button>
                    ` : ''}
                    <button class="btn btn-small" onclick="downloadFile('${torrent.infoHash}')">
                        <i class="fas fa-download"></i> Save
                    </button>
                    <button class="btn btn-small" onclick="removeTorrent('${torrent.infoHash}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progress}%"></div>
                <span class="progress-text">${progress}%</span>
            </div>
            <div class="torrent-stats">
                <span><i class="fas fa-tachometer-alt"></i> ${formatSpeed(torrent.downloadSpeed)}</span>
                <span><i class="fas fa-users"></i> ${torrent.numPeers} peers</span>
                <span><i class="fas fa-hdd"></i> ${formatBytes(torrent.length || 0)}</span>
            </div>
        `;
        torrentList.appendChild(torrentElement);
    });
}

// Check if torrent has playable files
function hasPlayableFile(torrent) {
    if (!torrent.files || torrent.files.length === 0) return false;
    return torrent.files.some(file => isPlayableFile(file.name));
}

// Check if file is playable
function isPlayableFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'mkv', 'mp3', 'wav', 'ogg'].includes(ext);
}

// Play file with enhanced streaming
function playFile(infoHash) {
    const torrent = client.get(infoHash);
    if (!torrent) {
        log('Torrent not found', 'error');
        return;
    }
    
    if (!torrent.files || torrent.files.length === 0) {
        log('No files in torrent', 'warning');
        return;
    }
    
    // Find playable file
    const file = torrent.files.find(file => isPlayableFile(file.name));
    if (!file) {
        log('No playable file found in torrent', 'warning');
        return;
    }
    
    // Show player section and update file name
    playerSection.classList.remove('hidden');
    fileName.textContent = file.name;
    
    // Reset display of video player (might have been hidden for audio)
    videoPlayer.style.display = 'block';
    
    // Remove any previous audio elements
    const playerContainer = videoPlayer.parentElement;
    const previousAudio = playerContainer.querySelector('audio');
    if (previousAudio) {
        playerContainer.removeChild(previousAudio);
    }
    
    // Determine file type
    const fileType = file.name.split('.').pop().toLowerCase();
    
    try {
        log(`Preparing to stream: ${file.name}`, 'info');
        
        // For all video files - using the progressive streaming approach
        if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(fileType)) {
            log(`Starting video stream`, 'info');
            
            // Immediately start streaming as file downloads
            // Use direct streaming approach with blob URL for maximum compatibility
            const fileStream = file.createReadStream();
            
            // Set up direct streaming with MediaSource if supported
            if ('MediaSource' in window) {
                const mediaSource = new MediaSource();
                videoPlayer.src = URL.createObjectURL(mediaSource);
                
                mediaSource.addEventListener('sourceopen', function() {
                    try {
                        // Detect mime type
                        let mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
                        if (fileType === 'webm') {
                            mimeType = 'video/webm; codecs="vp8, vorbis"';
                        }
                        
                        // Create source buffer with 'segments' mode for better streaming
                        const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                        sourceBuffer.mode = 'segments';
                        
                        // Queue for managing chunks
                        let queue = [];
                        let isAppending = false;
                        let initialDataReceived = false;
                        
                        // Process incoming data chunks
                        const processChunk = (chunk) => {
                            const arrayBuffer = new Uint8Array(chunk).buffer;
                            queue.push(arrayBuffer);
                            
                            // If we're not currently appending and have data, start appending
                            if (!isAppending && queue.length) {
                                appendNextChunk();
                            }
                            
                            // Start playback as soon as we get ANY data (don't wait for 500KB)
                            if (videoPlayer.paused && !initialDataReceived) {
                                initialDataReceived = true;
                                // Slight delay to allow buffer to build up just a bit
                                setTimeout(() => {
                                    videoPlayer.play().catch(e => {
                                        log(`Autoplay issue: ${e}. Will retry...`, 'warning');
                                        // Set up retry mechanism
                                        const playbackRetry = setInterval(() => {
                                            if (videoPlayer.readyState >= 2) { // HAVE_CURRENT_DATA
                                                videoPlayer.play().catch(() => {});
                                                clearInterval(playbackRetry);
                                            }
                                        }, 200);
                                    });
                                }, 300);
                            }
                        };
                        
                        const appendNextChunk = () => {
                            if (queue.length === 0 || isAppending) {
                                return;
                            }
                            
                            isAppending = true;
                            const chunk = queue.shift();
                            sourceBuffer.appendBuffer(chunk);
                        };
                        
                        // Handle end of chunk append
                        sourceBuffer.addEventListener('updateend', () => {
                            isAppending = false;
                            
                            // Continue appending if we have more chunks
                            if (queue.length > 0) {
                                appendNextChunk();
                            }
                            
                            // If video is paused but we have enough data, try to play
                            if (videoPlayer.paused && videoPlayer.readyState >= 2) { // HAVE_CURRENT_DATA
                                videoPlayer.play().catch(() => {}); // Silent catch
                            }
                        });
                        
                        // Handle data from stream
                        fileStream.on('data', (chunk) => {
                            processChunk(chunk);
                        });
                        
                        // Handle end of stream
                        fileStream.on('end', () => {
                            if (queue.length === 0) {
                                try {
                                    mediaSource.endOfStream();
                                } catch (e) {
                                    log(`Error ending stream: ${e}`, 'warning');
                                }
                            }
                        });
                        
                        // Monitor playback and buffer
                        const bufferHealthCheck = setInterval(() => {
                            // If video is stalled and we have data, try to continue
                            if ((videoPlayer.paused || videoPlayer.readyState < 2) && queue.length > 0) {
                                appendNextChunk();
                                // Try to play
                                if (videoPlayer.paused && videoPlayer.readyState >= 2) {
                                    videoPlayer.play().catch(() => {});
                                }
                            }
                            
                            // Clear interval if torrent is removed
                            if (!client.get(infoHash)) {
                                clearInterval(bufferHealthCheck);
                            }
                        }, 500);
                        
                    } catch (e) {
                        log(`MediaSource error: ${e}. Falling back to Blob URL.`, 'warning');
                        useBlob();
                    }
                });
                
                mediaSource.addEventListener('error', () => {
                    log('MediaSource error occurred. Falling back to Blob URL.', 'warning');
                    useBlob();
                });
                
            } else {
                // Fallback for browsers without MediaSource
                log('MediaSource not supported. Using blob URL.', 'info');
                useBlob();
            }
            
            // Fallback function to use blob URL
            function useBlob() {
                // Using file.renderTo for immediate streaming
                log('Using direct streaming for playback', 'info');
                
                // First try direct rendering (lowest latency)
                try {
                    file.renderTo(videoPlayer, {
                        autoplay: true,
                        controls: true,
                    }, (err) => {
                        if (err) {
                            log(`Direct render failed: ${err}. Trying getBlobURL...`, 'warning');
                            // Fallback to blob URL
                            file.getBlobURL((err, url) => {
                                if (err) {
                                    log(`Failed to get blob URL: ${err}`, 'error');
                                    return;
                                }
                                videoPlayer.src = url;
                                videoPlayer.load();
                                videoPlayer.play().catch(e => log(`Playback error: ${e}`, 'warning'));
                            });
                        }
                    });
                } catch (err) {
                    log(`Render error: ${err}. Using blob URL instead.`, 'warning');
                    // Fallback to blob URL
                    file.getBlobURL((err, url) => {
                        if (err) {
                            log(`Failed to get blob URL: ${err}`, 'error');
                            return;
                        }
                        videoPlayer.src = url;
                        videoPlayer.load();
                        videoPlayer.play().catch(e => log(`Playback error: ${e}`, 'warning'));
                    });
                }
            }
            
            // Prioritize pieces near the playback position
            prioritizePlayback(file, torrent);
        } 
        // For audio files
        else if (['mp3', 'wav', 'ogg', 'flac'].includes(fileType)) {
            log(`Starting audio stream for ${fileType} file`, 'info');
            
            // Hide video player
            videoPlayer.style.display = 'none';
            
            // Create an audio element
            const audioElement = document.createElement('audio');
            audioElement.controls = true;
            audioElement.style.width = '100%';
            audioElement.style.marginTop = '20px';
            
            // Add to player container
            playerContainer.appendChild(audioElement);
            
            // For audio, use direct streaming for immediate playback
            try {
                // Try direct rendering first for lowest latency
                file.renderTo(audioElement, {
                    autoplay: true,
                    controls: true
                }, (err) => {
                    if (err) {
                        // Fallback to blob URL
                        file.getBlobURL((err, url) => {
                            if (err) {
                                log(`Failed to get audio URL: ${err.message}`, 'error');
                                return;
                            }
                            audioElement.src = url;
                            audioElement.load();
                            audioElement.play().catch(e => log(`Autoplay error: ${e.message}`, 'warning'));
                        });
                    }
                });
            } catch (err) {
                // Fallback to blob URL
                file.getBlobURL((err, url) => {
                    if (err) {
                        log(`Failed to get audio URL: ${err.message}`, 'error');
                        return;
                    }
                    audioElement.src = url;
                    audioElement.load();
                    audioElement.play().catch(e => log(`Autoplay error: ${e.message}`, 'warning'));
                });
            }
        }
    } catch (error) {
        log(`Error in streaming setup: ${error.message}`, 'error');
    }
    
    // Update torrent stats more frequently while playing
    const statsInterval = setInterval(() => {
        if (!client.get(infoHash)) {
            clearInterval(statsInterval);
            return;
        }
        
        const t = client.get(infoHash);
        downloadSpeed.textContent = formatSpeed(t.downloadSpeed);
        peerCount.textContent = t.numPeers;
        
        const progress = Math.round(t.progress * 100);
        downloadProgress.textContent = progress + '%';
        
        // Update download info in logs occasionally
        if (progress % 10 === 0 && t.progress < 1 && t._lastReportedProgress !== progress) {
            t._lastReportedProgress = progress;
            log(`Download progress: ${progress}% at ${formatSpeed(t.downloadSpeed)}`, 'info');
        }
        
        // If download is complete, clear interval
        if (t.progress === 1 && !t._hasReportedComplete) {
            t._hasReportedComplete = true;
            log(`Download complete for: ${file.name}`, 'success');
        }
    }, 1000);
    
    // Register stream error handler
    torrent.on('error', err => {
        log(`Streaming error: ${err.message}`, 'error');
        clearInterval(statsInterval);
    });
    
    // Scroll to player section
    playerSection.scrollIntoView({behavior: 'smooth'});
}

// Function to prioritize pieces near the current playback position
function prioritizePlayback(file, torrent) {
    // Get the piece length
    const pieceLength = torrent.pieceLength;
    
    // Create a prioritization function
    function prioritizePieces() {
        if (!videoPlayer || videoPlayer.paused) return;
        
        // Get current time and file length
        const currentTime = videoPlayer.currentTime;
        const fileLength = file.length;
        const duration = videoPlayer.duration || 0;
        
        if (duration > 0 && fileLength > 0) {
            // Calculate byte position based on current time
            const bytePosition = Math.floor((currentTime / duration) * fileLength);
            
            // Calculate piece index from byte position
            const piece = Math.floor(bytePosition / pieceLength);
            
            // Prioritize the next few pieces (higher priority for closer pieces)
            for (let i = 0; i < 10; i++) {
                const nextPiece = piece + i;
                if (nextPiece < torrent.pieces.length) {
                    // Higher priority for closest pieces
                    const priority = 5 - Math.min(i, 5);
                    torrent.select(nextPiece, nextPiece + 1, priority);
                }
            }
        }
    }
    
    // Run the prioritization regularly
    const prioritizeInterval = setInterval(() => {
        if (!client.get(torrent.infoHash)) {
            clearInterval(prioritizeInterval);
            return;
        }
        prioritizePieces();
    }, 5000);
    
    // Also prioritize when seeking
    videoPlayer.addEventListener('seeked', prioritizePieces);
}

// Download file to local storage
function downloadFile(infoHash) {
    const torrent = client.get(infoHash);
    if (!torrent) {
        log('Torrent not found', 'error');
        return;
    }
    
    if (!torrent.files || torrent.files.length === 0) {
        log('No files in torrent', 'warning');
        return;
    }
    
    log(`Saving ${torrent.files.length} file(s) from ${torrent.name}`, 'info');
    
    torrent.files.forEach(file => {
        file.getBlobURL((err, url) => {
            if (err) {
                log(`Error saving ${file.name}: ${err.message}`, 'error');
                return;
            }
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            log(`Saved: ${file.name}`, 'success');
        });
    });
}

// Save torrent info to local storage
function saveToLocalStorage(torrent) {
    try {
        const savedTorrents = JSON.parse(localStorage.getItem('savedTorrents') || '[]');
        savedTorrents.push({
            infoHash: torrent.infoHash,
            name: torrent.name,
            magnetURI: torrent.magnetURI,
            timestamp: Date.now()
        });
        localStorage.setItem('savedTorrents', JSON.stringify(savedTorrents));
        log(`Torrent saved to local storage: ${torrent.name}`, 'info');
    } catch (error) {
        log(`Error saving to local storage: ${error.message}`, 'error');
    }
}

// Remove torrent
function removeTorrent(infoHash) {
    const torrent = client.get(infoHash);
    if (!torrent) {
        log('Torrent not found', 'error');
        return;
    }
    
    const torrentName = torrent.name;
    
    client.remove(infoHash, err => {
        if (err) {
            log(`Error removing torrent: ${err.message}`, 'error');
            return;
        }
        
        log(`Torrent removed: ${torrentName}`, 'success');
        updateTorrentList();
        
        // Hide player if no torrents are left
        if (client.torrents.length === 0) {
            playerSection.classList.add('hidden');
        }
    });
}

// Logging
function log(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-type-${type}">${message}</span>
    `;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Limit log entries to prevent memory issues
    if (logContainer.children.length > 100) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

// Format bytes to human-readable string
function formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// Format speed
function formatSpeed(bytes) {
    if (!bytes || bytes === 0) return '0 KB/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Update stats periodically
setInterval(() => {
    if (client.torrents.length > 0 && !playerSection.classList.contains('hidden')) {
        // Find the active torrent (first one that's not done, or the first one)
        const activeTorrent = client.torrents.find(t => !t.done) || client.torrents[0];
        
        downloadSpeed.textContent = formatSpeed(activeTorrent.downloadSpeed);
        peerCount.textContent = activeTorrent.numPeers;
        downloadProgress.textContent = Math.round(activeTorrent.progress * 100) + '%';
    }
}, 1000);

// Also update the torrent list periodically
setInterval(updateTorrentList, 3000);

// Load saved torrents on startup
function loadSavedTorrents() {
    try {
        const savedTorrents = JSON.parse(localStorage.getItem('savedTorrents') || '[]');
        if (savedTorrents.length > 0) {
            log(`Loading ${savedTorrents.length} saved torrent(s)`, 'info');
            
            savedTorrents.forEach(saved => {
                try {
                    if (!client.get(saved.infoHash)) {
                        client.add(saved.magnetURI, torrent => {
                            log(`Loaded saved torrent: ${torrent.name}`, 'success');
                            updateTorrentList();
                        });
                    }
                } catch (err) {
                    log(`Error loading saved torrent: ${err.message}`, 'error');
                }
            });
        }
    } catch (error) {
        log(`Error loading saved torrents: ${error.message}`, 'error');
    }
}

// Make functions available globally
window.playFile = playFile;
window.downloadFile = downloadFile;
window.removeTorrent = removeTorrent;

// Initialize
loadSavedTorrents();
updateTorrentList();
log('MiniUI started', 'info'); 
