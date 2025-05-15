document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const fileLabel = document.querySelector('.file-label');
    const uploadSection = document.querySelector('.upload-section');
    const fileNameDisplay = document.getElementById('fileName');
    const fileSizeDisplay = document.getElementById('fileSize');
    const controlsSection = document.querySelector('.controls-section');
    const partsInput = document.getElementById('partsInput');
    const partSizeInfo = document.getElementById('partSizeInfo');
    const splitButton = document.getElementById('splitButton');
    const resultsSection = document.querySelector('.results-section');
    const downloadLinksContainer = document.getElementById('downloadLinks');
    const errorMessagesDiv = document.getElementById('errorMessages');

    let selectedFile = null;
    let originalFileName = '';
    let originalFileExtension = '';

    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadSection.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false); // Prevent browser from opening file
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadSection.addEventListener(eventName, () => uploadSection.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadSection.addEventListener(eventName, () => uploadSection.classList.remove('dragover'), false);
    });

    uploadSection.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            fileInput.files = files; // Assign dropped files to input
            handleFileSelect({ target: fileInput });
        }
    }

    function handleFileSelect(event) {
        clearErrors();
        resetResults();
        selectedFile = event.target.files[0];
        if (selectedFile) {
            if (!isValidFileType(selectedFile.name)) {
                showError(`Invalid file type. Please upload a text-based file (e.g., .txt, .csv, .log, .json, .xml, .html, .css, .js).`);
                resetFileInput();
                return;
            }

            originalFileName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'));
            originalFileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.'));

            fileNameDisplay.textContent = `Selected: ${selectedFile.name}`;
            fileSizeDisplay.textContent = `File size: ${formatBytes(selectedFile.size)}`;
            controlsSection.style.display = 'block';
            resultsSection.style.display = 'none';
            downloadLinksContainer.innerHTML = '';
            updatePartSizeInfo();
        } else {
            resetFileInput();
        }
    }

    function isValidFileType(fileName) {
        const allowedExtensions = /(\.txt|\.csv|\.log|\.json|\.xml|\.html|\.css|\.js)$/i;
        return allowedExtensions.exec(fileName);
    }

    function resetFileInput() {
        selectedFile = null;
        originalFileName = '';
        originalFileExtension = '';
        fileInput.value = ''; // Clear the file input
        fileNameDisplay.textContent = 'No file selected';
        fileSizeDisplay.textContent = 'File size: N/A';
        controlsSection.style.display = 'none';
        partSizeInfo.textContent = 'Each part will be approx. N/A';
        resetResults();
    }

    function resetResults() {
        resultsSection.style.display = 'none';
        downloadLinksContainer.innerHTML = '';
    }

    partsInput.addEventListener('input', updatePartSizeInfo);
    partsInput.addEventListener('change', updatePartSizeInfo); // For up/down arrows

    function updatePartSizeInfo() {
        if (selectedFile && partsInput.value) {
            const numParts = parseInt(partsInput.value, 10);
            if (numParts > 0 && selectedFile.size > 0) {
                const approxPartSize = Math.ceil(selectedFile.size / numParts);
                partSizeInfo.textContent = `Each part will be approx. ${formatBytes(approxPartSize)}`;
            } else {
                partSizeInfo.textContent = 'Each part will be approx. N/A';
            }
        } else {
            partSizeInfo.textContent = 'Each part will be approx. N/A';
        }
    }

    splitButton.addEventListener('click', () => {
        clearErrors();
        resetResults();

        if (!selectedFile) {
            showError('Please select a file first.');
            return;
        }

        const numParts = parseInt(partsInput.value, 10);
        if (isNaN(numParts) || numParts < 2) {
            showError('Please enter a valid number of parts (minimum 2).');
            partsInput.focus();
            return;
        }

        if (numParts > selectedFile.size) {
            showError('Number of parts cannot exceed the number of bytes in the file.');
            partsInput.focus();
            return;
        }

        processFile(selectedFile, numParts);
    });

    function processFile(file, numParts) {
        const reader = new FileReader();

        reader.onload = (event) => {
            const content = event.target.result;
            const totalLength = content.length;
            const partSize = Math.ceil(totalLength / numParts);
            const parts = [];

            for (let i = 0; i < numParts; i++) {
                const start = i * partSize;
                const end = Math.min(start + partSize, totalLength);
                if (start < totalLength) { // Ensure we don't create empty parts if numParts is too high (already checked, but good practice)
                    parts.push(content.substring(start, end));
                }
            }
            generateDownloadLinks(parts);
        };

        reader.onerror = () => {
            showError('Error reading file.');
            resetFileInput();
        };

        reader.readAsText(file); // Assuming text-based files
    }

    function generateDownloadLinks(parts) {
        downloadLinksContainer.innerHTML = ''; // Clear previous links
        parts.forEach((partContent, index) => {
            const partNumber = index + 1;
            const blob = new Blob([partContent], { type: 'text/plain' }); // Adjust MIME type if necessary
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${originalFileName}_part${partNumber}${originalFileExtension}`;
            link.textContent = `Download ${originalFileName}_part${partNumber}${originalFileExtension}`;
            downloadLinksContainer.appendChild(link);
        });
        resultsSection.style.display = 'block';
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function showError(message) {
        errorMessagesDiv.textContent = message;
        errorMessagesDiv.style.display = 'block';
    }

    function clearErrors() {
        errorMessagesDiv.textContent = '';
        errorMessagesDiv.style.display = 'none';
    }
});