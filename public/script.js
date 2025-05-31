document.addEventListener('DOMContentLoaded', function() {
    // Accordion functionality
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        
        header.addEventListener('click', () => {
            const currentlyActive = document.querySelector('.accordion-item.active');
            
            // If this item is already active, close it
            if (currentlyActive && currentlyActive !== item) {
                currentlyActive.classList.remove('active');
                currentlyActive.querySelector('.accordion-header i').className = 'fas fa-plus';
            }
            
            // Toggle current item
            item.classList.toggle('active');
            const icon = header.querySelector('i');
            icon.className = item.classList.contains('active') ? 'fas fa-minus' : 'fas fa-plus';
        });
    });
    
    // Download functionality
    const downloadBtn = document.getElementById('download-btn');
    const videoUrlInput = document.getElementById('video-url');
    const resultsContainer = document.getElementById('results-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    downloadBtn.addEventListener('click', fetchVideoInfo);
    
    videoUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchVideoInfo();
        }
    });
    
    function fetchVideoInfo() {
        const videoUrl = videoUrlInput.value.trim();
        
        if (!videoUrl) {
            alert('Please enter a YouTube video URL');
            return;
        }
        
        // Validate YouTube URL
        if (!isValidYouTubeUrl(videoUrl)) {
            alert('Please enter a valid YouTube video URL');
            return;
        }
        
        // Show loading spinner
        loadingSpinner.style.display = 'block';
        resultsContainer.style.display = 'none';
        
        // Fetch video info from backend
        fetch('/api/video-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: videoUrl })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            loadingSpinner.style.display = 'none';
            displayVideoInfo(data);
        })
        .catch(error => {
            console.error('Error:', error);
            loadingSpinner.style.display = 'none';
            alert('Failed to fetch video information. Please try again.');
        });
    }
    
    function isValidYouTubeUrl(url) {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        return pattern.test(url);
    }
    
    function displayVideoInfo(videoData) {
        // Format duration from seconds to HH:MM:SS
        const duration = formatDuration(videoData.duration);
        
        // Build formats HTML
        let formatsHTML = '';
        videoData.formats.forEach(format => {
            formatsHTML += `
                <div class="option-card">
                    <h5>${format.type.toUpperCase()} ${format.quality}</h5>
                    <p>${format.size} • ${format.container}</p>
                    <a href="/api/download?url=${encodeURIComponent(videoUrlInput.value)}&itag=${format.itag}" class="download-btn" download>
                        <i class="fas fa-download"></i> Download
                    </a>
                </div>
            `;
        });
        
        // Display results
        resultsContainer.innerHTML = `
            <div class="video-info">
                <img src="${videoData.thumbnail}" alt="${videoData.title}" class="video-thumbnail">
                <div class="video-details">
                    <h3>${videoData.title}</h3>
                    <p><i class="fas fa-clock"></i> Duration: ${duration}</p>
                    <p><i class="fas fa-user"></i> Channel: ${videoData.channel}</p>
                </div>
            </div>
            
            <div class="download-options">
                <h4>Available Download Options</h4>
                <div class="option-grid">
                    ${formatsHTML}
                </div>
            </div>
        `;
        
        resultsContainer.style.display = 'block';
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    function formatDuration(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 3600 % 60);
        
        return [h, m > 9 ? m : (h ? '0' + m : m || '0'), s > 9 ? s : '0' + s]
            .filter(a => a)
            .join(':');
    }
});