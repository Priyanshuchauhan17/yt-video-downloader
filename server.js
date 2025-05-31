const express = require('express');
const app = express();
const path = require('path');
const ytdl = require('ytdl-core');
const fs = require('fs');
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get video info
app.post('/api/video-info', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }
        
        const info = await ytdl.getInfo(url);
        
        const formats = info.formats
            .filter(format => format.hasVideo || format.hasAudio)
            .map(format => ({
                itag: format.itag,
                type: format.hasVideo ? 'video' : 'audio',
                quality: format.qualityLabel || format.audioQuality || 'unknown',
                container: format.container,
                size: format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(2) + ' MB' : 'unknown',
                url: format.url
            }));
        
        const videoData = {
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
            duration: info.videoDetails.lengthSeconds,
            channel: info.videoDetails.ownerChannelName,
            formats
        };
        
        res.json(videoData);
    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).json({ error: 'Failed to fetch video information' });
    }
});

// API endpoint to download video
app.get('/api/download', async (req, res) => {
    try {
        const { url, itag } = req.query;
        
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }
        
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: itag });
        
        res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.${format.container}"`);
        ytdl(url, { format }).pipe(res);
    } catch (error) {
        console.error('Error downloading video:', error);
        res.status(500).json({ error: 'Failed to download video' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});