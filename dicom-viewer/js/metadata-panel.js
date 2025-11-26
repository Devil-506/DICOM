class MetadataPanel {
    constructor(dicomLoader) {
        this.dicomLoader = dicomLoader;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('toggleMetadata').addEventListener('click', () => {
            this.toggleVisibility();
        });
    }

    toggleVisibility() {
        const content = document.getElementById('metadataContent');
        const button = document.getElementById('toggleMetadata');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            button.textContent = '▼';
        } else {
            content.style.display = 'none';
            button.textContent = '▶';
        }
    }

    updateMetadata() {
        if (!this.dicomLoader.currentImage) return;
        
        const image = this.dicomLoader.currentImage.image;
        const data = image.data;
        
        this.updatePatientMetadata(data);
        this.updateStudyMetadata(data);
        this.updateSeriesMetadata(data);
        this.updateAcquisitionMetadata(data);
        this.updateImageMetadata(data);
    }

    updatePatientMetadata(data) {
        const container = document.getElementById('patientMetadata');
        const metadata = {
            'Patient Name': data.string('x00100010'),
            'Patient ID': data.string('x00100020'),
            'Birth Date': data.string('x00100030'),
            'Sex': data.string('x00100040'),
            'Age': data.string('x00101010'),
            'Weight': data.string('x00101030') + ' kg'
        };
        
        this.renderMetadata(container, metadata);
    }

    updateStudyMetadata(data) {
        const container = document.getElementById('studyMetadata');
        const metadata = {
            'Study Date': data.string('x00080020'),
            'Study Time': data.string('x00080030'),
            'Study Description': data.string('x00081030'),
            'Study ID': data.string('x00200010'),
            'Accession Number': data.string('x00080050'),
            'Referring Physician': data.string('x00080090')
        };
        
        this.renderMetadata(container, metadata);
    }

    updateSeriesMetadata(data) {
        const container = document.getElementById('seriesMetadata');
        const metadata = {
            'Series Description': data.string('x0008103e'),
            'Series Number': data.string('x00200011'),
            'Modality': data.string('x00080060'),
            'Body Part': data.string('x00180015'),
            'Patient Position': data.string('x00185100'),
            'Protocol Name': data.string('x00181030')
        };
        
        this.renderMetadata(container, metadata);
    }

    updateAcquisitionMetadata(data) {
        const container = document.getElementById('acquisitionMetadata');
        const metadata = {
            'Slice Thickness': data.string('x00180050') + ' mm',
            'KVp': data.string('x00180060') + ' kV',
            'Exposure Time': data.string('x00181150') + ' ms',
            'X-Ray Tube Current': data.string('x00181151') + ' mA',
            'Exposure': data.string('x00181152') + ' μAs',
            'Filter Type': data.string('x00187060'),
            'Convolution Kernel': data.string('x00181210'),
            'Rotation Direction': data.string('x00181130')
        };
        
        this.renderMetadata(container, metadata);
    }

    updateImageMetadata(data) {
        const container = document.getElementById('imageMetadata');
        const metadata = {
            'Instance Number': data.string('x00200013'),
            'Image Position': data.string('x00200032'),
            'Image Orientation': data.string('x00200037'),
            'Pixel Spacing': data.string('x00280030') + ' mm',
            'Window Center': data.string('x00281050'),
            'Window Width': data.string('x00281051'),
            'Rescale Intercept': data.string('x00281052'),
            'Rescale Slope': data.string('x00281053'),
            'Bits Stored': data.string('x00280101'),
            'Bits Allocated': data.string('x00280100'),
            'High Bit': data.string('x00280102')
        };
        
        this.renderMetadata(container, metadata);
    }

    renderMetadata(container, metadata) {
        container.innerHTML = '';
        
        for (const [label, value] of Object.entries(metadata)) {
            if (value && value !== 'undefined') {
                const item = document.createElement('div');
                item.className = 'metadata-item';
                item.innerHTML = `
                    <div class="metadata-label">${label}:</div>
                    <div class="metadata-value">${value}</div>
                `;
                container.appendChild(item);
            }
        }
        
        if (container.children.length === 0) {
            container.innerHTML = '<div class="empty-message">No metadata available</div>';
        }
    }
}