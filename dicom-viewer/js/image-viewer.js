class ImageViewer {
    constructor(dicomLoader) {
        this.dicomLoader = dicomLoader;
        this.element = document.getElementById('dicomViewer');
        this.isPlaying = false;
        this.playInterval = null;
        this.currentTool = 'pan';
        
        this.initViewer();
        this.setupEventListeners();
    }

    initViewer() {
        // Enable Cornerstone on the element
        cornerstone.enable(this.element);
        
        // Initialize tools
        this.initTools();
    }

    initTools() {
        // Add Cornerstone tools
        const { PanTool, ZoomTool, WwwcTool, LengthTool, AngleTool } = cornerstoneTools;
        
        cornerstoneTools.addTool(PanTool);
        cornerstoneTools.addTool(ZoomTool);
        cornerstoneTools.addTool(WwwcTool);
        cornerstoneTools.addTool(LengthTool);
        cornerstoneTools.addTool(AngleTool);
        
        // Set initial tool
        this.setTool('pan');
    }

    setTool(toolName) {
        this.currentTool = toolName;
        
        // Deactivate all tools first
        cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 0 });
        cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 0 });
        cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 0 });
        cornerstoneTools.setToolActive('Length', { mouseButtonMask: 0 });
        cornerstoneTools.setToolActive('Angle', { mouseButtonMask: 0 });
        
        // Activate selected tool
        switch(toolName) {
            case 'pan':
                cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 });
                break;
            case 'zoom':
                cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 1 });
                break;
            case 'wwwl':
                cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
                break;
            case 'measureLength':
                cornerstoneTools.setToolActive('Length', { mouseButtonMask: 1 });
                break;
            case 'measureAngle':
                cornerstoneTools.setToolActive('Angle', { mouseButtonMask: 1 });
                break;
        }
        
        // Update UI
        this.updateToolButtons();
    }

    updateToolButtons() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[id="${this.currentTool}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    setupEventListeners() {
        // Tool buttons
        document.getElementById('pan').addEventListener('click', () => this.setTool('pan'));
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('wwwl').addEventListener('click', () => this.setTool('wwwl'));
        document.getElementById('reset').addEventListener('click', () => this.resetView());
        document.getElementById('measureLength').addEventListener('click', () => this.setTool('measureLength'));
        document.getElementById('measureAngle').addEventListener('click', () => this.setTool('measureAngle'));
        
        // Slice navigation
        document.getElementById('sliceSlider').addEventListener('input', (e) => {
            this.dicomLoader.displayImage(parseInt(e.target.value));
        });
        
        // Play/Pause
        document.getElementById('playPause').addEventListener('click', () => this.togglePlay());
        
        // Window/Level
        document.getElementById('windowSlider').addEventListener('input', (e) => {
            this.updateWindowLevel();
        });
        document.getElementById('levelSlider').addEventListener('input', (e) => {
            this.updateWindowLevel();
        });
    }

    zoom(factor) {
        const viewport = cornerstone.getViewport(this.element);
        viewport.scale *= factor;
        cornerstone.setViewport(this.element, viewport);
    }

    resetView() {
        cornerstone.reset(this.element);
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const button = document.getElementById('playPause');
        
        if (this.isPlaying) {
            button.textContent = '⏸️';
            this.startPlayback();
        } else {
            button.textContent = '▶️';
            this.stopPlayback();
        }
    }

    startPlayback() {
        let currentIndex = this.dicomLoader.currentImageIndex;
        
        this.playInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % this.dicomLoader.images.length;
            this.dicomLoader.displayImage(currentIndex);
        }, 200); // 5 FPS
    }

    stopPlayback() {
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }

    updateWindowLevel() {
        const windowWidth = parseInt(document.getElementById('windowSlider').value);
        const windowCenter = parseInt(document.getElementById('levelSlider').value);
        
        document.getElementById('windowValue').textContent = windowWidth;
        document.getElementById('levelValue').textContent = windowCenter;
        
        const viewport = cornerstone.getViewport(this.element);
        viewport.voi.windowWidth = windowWidth;
        viewport.voi.windowCenter = windowCenter;
        cornerstone.setViewport(this.element, viewport);
    }
}