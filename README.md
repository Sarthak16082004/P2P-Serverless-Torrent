# P2P Serverless torrent "MiniUi" - Browser-based P2P File Sharing

A browser-based torrent client that allows P2P file sharing with progressive video streaming capabilities, built entirely with JavaScript, HTML, and CSS using the WebTorrent library.

## Features

- **Browser-based P2P file sharing** - No server required, works entirely in the browser
- **Progressive video streaming** - Start watching videos while they download parallel means prograssive streaming concept
- **advance intuitive UI** - Easy to use interface for uploading and downloading files
- **Real-time progress tracking** - See download progress, peer count, and speed in real-time
- **Dark mode support** - Toggle between light and dark themes
- **Activity logging** - View a log of events happening in the application
- **Drag and drop support** - Easily drag files into the browser to share them

## How to Use

### Sharing Files

1. Click the "Select Files" button or drag and drop files into the upload area
2. Once the files are added, a torrent will be created
3. Copy the generated magnet link to share with others
4. The files will remain available for download as long as your browser window stays open

### Downloading Files

1. Paste a magnet link or torrent info hash into the download input box
2. Click the "Download" button
3. The download will start and show progress in real-time
4. For video/audio files, you can click "Play" to start streaming while downloading

### Playing Media

1. When downloading a torrent with media files, click the "Play" button
2. The media player will appear and start playing the file
3. You can continue downloading while watching/listening

## Technical Details

This application uses the following technologies:

- **WebTorrent** - A streaming torrent client for the web
- **WebRTC** - For peer-to-peer data exchange between browsers
- **JavaScript** - For application logic
- **HTML/CSS** - For the user interface

## Browser Compatibility

This application works best in modern browsers that support WebRTC:

- Chrome
- Firefox
- Edge
- Safari (recent versions)

## Running Locally

To run this application locally:

1. Clone this repository
2. Open `index.html` in your browser
3. No build steps or server setup required!

## Security Considerations

- This application runs entirely in your browser
- Files are shared directly between peers, without going through a central server
- The application will ask for permission before using your camera or microphone (if attempting to play DRM content)

## License

This project is open source, feel free to modify and use it according to your needs.

## Disclaimer

This tool is intended for sharing legal content only. Do not use it to share copyrighted material without permission. 
