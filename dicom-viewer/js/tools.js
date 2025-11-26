class DICOMTools {
    constructor(dicomLoader, imageViewer) {
        this.dicomLoader = dicomLoader;
        this.imageViewer = imageViewer;
        this.measurements = [];
        this.annotations = [];
        
        this.setupMeasurementTools();
    }

    setupMeasurementTools() {
        // Length measurement completed
        cornerstoneTools.eventTarget.addEventListener('cornerstonetoolsmeasurementadded', (e) => {
            if (e.detail.toolType === 'Length') {
                this.addMeasurement(e.detail.measurement);
            }
        });
        
        // Angle measurement completed
        cornerstoneTools.eventTarget.addEventListener('cornerstonetoolsmeasurementadded', (e) => {
            if (e.detail.toolType === 'Angle') {
                this.addMeasurement(e.detail.measurement);
            }
        });
    }

    addMeasurement(measurement) {
        this.measurements.push(measurement);
        this.updateMeasurementsDisplay();
    }

    updateMeasurementsDisplay() {
        const container = document.getElementById('measurements');
        container.innerHTML = '<strong>Measurements:</strong><br>';
        
        this.measurements.forEach((measurement, index) => {
            let value = '';
            
            if (measurement.toolType === 'Length') {
                value = `Length: ${measurement.length.toFixed(2)} mm`;
            } else if (measurement.toolType === 'Angle') {
                value = `Angle: ${measurement.rAngle.toFixed(1)}°`;
            }
            
            const item = document.createElement('div');
            item.textContent = value;
            item.style.fontSize = '0.8rem';
            item.style.marginTop = '0.2rem';
            container.appendChild(item);
        });
    }

    // Export functionality
    exportMeasurements() {
        const data = {
            patient: this.dicomLoader.currentSeries.patientName,
            study: this.dicomLoader.currentSeries.studyDate,
            series: this.dicomLoader.currentSeries.description,
            measurements: this.measurements,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `measurements_${this.dicomLoader.currentSeries.patientName}_${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Screenshot functionality
    takeScreenshot() {
        const element = document.getElementById('dicomViewer');
        const canvas = element.querySelector('canvas');
        
        if (canvas) {
            const link = document.createElement('a');
            link.download = `screenshot_${this.dicomLoader.currentSeries.patientName}_${this.dicomLoader.currentImageIndex + 1}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    }

    // Advanced windowing presets
    applyWindowingPreset(preset) {
        const presets = {
            'lung': { window: 1500, level: -600 },
            'brain': { window: 80, level: 40 },
            'bone': { window: 2000, level: 300 },
            'abdomen': { window: 400, level: 40 },
            'liver': { window: 150, level: 30 }
        };
        
        if (presets[preset]) {
            document.getElementById('windowSlider').value = presets[preset].window;
            document.getElementById('levelSlider').value = presets[preset].level;
            this.imageViewer.updateWindowLevel();
        }
    }
}