class DICOMLoader {
    constructor() {
        this.series = [];
        this.currentSeries = null;
        this.currentImage = null;
        this.images = [];
        
        // Initialize Cornerstone
        this.initCornerstone();
    }

    initCornerstone() {
        // Configure Cornerstone
        cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
        cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
        
        // Configure web worker
        const config = {
            maxWebWorkers: navigator.hardwareConcurrency || 1,
            startWebWorkersOnDemand: true,
            webWorkerTaskPaths: []
        };
        cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
    }

    async loadDICOMFiles(files) {
        this.showLoadingModal(true);
        this.series = [];
        this.images = [];

        try {
            // Group files by series
            const seriesMap = new Map();
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                this.updateLoadProgress(i, files.length, `Loading ${file.name}`);
                
                try {
                    const imageId = this.createImageId(file);
                    const image = await this.loadImage(imageId);
                    
                    if (image) {
                        const seriesInstanceUID = image.data.string('x0020000e');
                        
                        if (!seriesMap.has(seriesInstanceUID)) {
                            seriesMap.set(seriesInstanceUID, []);
                        }
                        
                        seriesMap.get(seriesInstanceUID).push({
                            imageId,
                            image,
                            file
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to load ${file.name}:`, error);
                }
            }

            // Create series objects
            for (const [seriesUID, images] of seriesMap) {
                const series = {
                    uid: seriesUID,
                    description: images[0].image.data.string('x0008103e') || 'Unknown Series',
                    modality: images[0].image.data.string('x00080060') || 'OT',
                    images: images.sort((a, b) => {
                        // Sort by instance number
                        const aNum = a.image.data.intString('x00200013') || 0;
                        const bNum = b.image.data.intString('x00200013') || 0;
                        return aNum - bNum;
                    }),
                    patientName: images[0].image.data.string('x00100010'),
                    studyDate: images[0].image.data.string('x00080020')
                };
                
                this.series.push(series);
            }

            this.updateLoadProgress(files.length, files.length, 'Complete!');
            
            if (this.series.length > 0) {
                this.selectSeries(this.series[0]);
            }
            
            return this.series;
            
        } catch (error) {
            console.error('Error loading DICOM files:', error);
            this.showError('Failed to load DICOM files: ' + error.message);
        } finally {
            setTimeout(() => this.showLoadingModal(false), 1000);
        }
    }

    createImageId(file) {
        return `wadouri:${URL.createObjectURL(file)}`;
    }

    async loadImage(imageId) {
        return new Promise((resolve, reject) => {
            cornerstone.loadImage(imageId).then(resolve).catch(reject);
        });
    }

    selectSeries(series) {
        this.currentSeries = series;
        this.images = series.images;
        this.currentImageIndex = 0;
        
        // Update UI
        this.updateSeriesList();
        this.updateThumbnails();
        this.displayImage(0);
        this.updateMetadata();
    }

    displayImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        this.currentImageIndex = index;
        this.currentImage = this.images[index];
        
        const element = document.getElementById('dicomViewer');
        cornerstone.enable(element);
        
        cornerstone.loadImage(this.currentImage.imageId).then((image) => {
            cornerstone.displayImage(element, image);
            this.updateImageInfo();
            this.updateSliceSlider();
        });
    }

    updateSeriesList() {
        const container = document.getElementById('seriesItems');
        container.innerHTML = '';
        
        this.series.forEach(series => {
            const item = document.createElement('div');
            item.className = `series-item ${series === this.currentSeries ? 'active' : ''}`;
            item.innerHTML = `
                <strong>${series.modality}</strong><br>
                <small>${series.description}</small><br>
                <small>${series.images.length} images</small>
            `;
            item.onclick = () => this.selectSeries(series);
            container.appendChild(item);
        });
    }

    updateThumbnails() {
        const container = document.getElementById('thumbnails');
        container.innerHTML = '';
        
        this.images.slice(0, 20).forEach((image, index) => {
            const thumb = document.createElement('div');
            thumb.className = `thumbnail ${index === this.currentImageIndex ? 'active' : ''}`;
            thumb.innerHTML = `<small>Slice ${index + 1}</small>`;
            thumb.onclick = () => this.displayImage(index);
            container.appendChild(thumb);
        });
    }

    updateImageInfo() {
        const container = document.getElementById('imageInfo');
        if (!this.currentImage) return;
        
        const image = this.currentImage.image;
        const info = `
            Instance: ${image.data.intString('x00200013') || 'N/A'}<br>
            Position: ${image.data.string('x00200032') || 'N/A'}<br>
            Thickness: ${image.data.string('x00180050') || 'N/A'} mm
        `;
        container.innerHTML = info;
    }

    updateSliceSlider() {
        const slider = document.getElementById('sliceSlider');
        const frameInfo = document.getElementById('frameInfo');
        
        slider.min = 0;
        slider.max = this.images.length - 1;
        slider.value = this.currentImageIndex;
        
        frameInfo.textContent = `Slice: ${this.currentImageIndex + 1}/${this.images.length}`;
    }

    updateLoadProgress(current, total, status) {
        const progress = document.getElementById('loadProgress');
        const statusEl = document.getElementById('loadStatus');
        
        const percent = (current / total) * 100;
        progress.style.width = `${percent}%`;
        statusEl.textContent = status;
    }

    showLoadingModal(show) {
        const modal = document.getElementById('loadingModal');
        modal.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        alert('Error: ' + message);
    }
}