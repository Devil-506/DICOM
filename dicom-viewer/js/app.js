class DICOMViewerApp {
    constructor() {
        this.dicomLoader = new DICOMLoader();
        this.imageViewer = new ImageViewer(this.dicomLoader);
        this.metadataPanel = new MetadataPanel(this.dicomLoader);
        this.tools = new DICOMTools(this.dicomLoader, this.imageViewer);
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // Folder selection
        document.getElementById('loadFolder').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }

    setupDragAndDrop() {
        const dropZone = document.body;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = '#2a2a2a';
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = '';
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = '';
            
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.name.toLowerCase().endsWith('.dcm') || 
                file.name.toLowerCase().endsWith('.dicom')
            );
            
            if (files.length > 0) {
                this.handleFiles(files);
            }
        });
    }

    async handleFiles(files) {
        if (files.length === 0) return;
        
        // Update patient info
        document.getElementById('patientInfo').textContent = `Loading ${files.length} DICOM files...`;
        
        // Load DICOM files
        const series = await this.dicomLoader.loadDICOMFiles(files);
        
        if (series.length > 0) {
            const firstSeries = series[0];
            document.getElementById('patientInfo').textContent = 
                `Patient: ${firstSeries.patientName} | Study: ${firstSeries.studyDate}`;
        }
    }

    handleKeyboard(e) {
        if (!this.dicomLoader.currentSeries) return;
        
        const images = this.dicomLoader.images;
        const currentIndex = this.dicomLoader.currentImageIndex;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.dicomLoader.displayImage(Math.max(0, currentIndex - 1));
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                this.dicomLoader.displayImage(Math.min(images.length - 1, currentIndex + 1));
                break;
                
            case ' ':
                e.preventDefault();
                this.imageViewer.togglePlay();
                break;
                
            case 'r':
                e.preventDefault();
                this.imageViewer.resetView();
                break;
                
            case '1':
                e.preventDefault();
                this.tools.applyWindowingPreset('lung');
                break;
                
            case '2':
                e.preventDefault();
                this.tools.applyWindowingPreset('brain');
                break;
                
            case '3':
                e.preventDefault();
                this.tools.applyWindowingPreset('bone');
                break;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dicomViewerApp = new DICOMViewerApp();
});