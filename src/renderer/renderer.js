// Application state
console.log('🚀 Renderer.js loaded - Version 2.0 with fixed action handling');

// i18n initialization
async function initializeI18n() {
    try {
        // Wait for i18n to be ready
        if (window.i18n) {
            await window.i18n.initializeLanguage();
            setupLanguageChangeListener();
        }
    } catch (error) {
        console.error('Failed to initialize i18n:', error);
    }
}

function setupLanguageChangeListener() {
    // Listen for language changes
    document.addEventListener('languageChanged', (event) => {
        const newLanguage = event.detail.language;
        console.log('Language changed to:', newLanguage);
        
        // Update language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = newLanguage;
        }
        
        // Re-render file list to update dynamic content
        if (currentDirectoryContents) {
            renderFileList();
        }
        
        // Update notifications and other dynamic content
        updateDynamicTranslations();
    });
}

function updateDynamicTranslations() {
    // Update file type labels and any other dynamic content
    const fileItems = document.querySelectorAll('.file-meta');
    fileItems.forEach(item => {
        const typeElement = item.querySelector('.file-type');
        if (typeElement) {
            const currentType = typeElement.textContent;
            // Update type translations if needed
            switch (currentType) {
                case 'Encrypted':
                case 'Cifrado':
                case 'एन्क्रिप्टेड':
                case '暗号化済み':
                    typeElement.textContent = window.i18n.t('fileList.encrypted');
                    break;
                case 'Directory':
                case 'Directorio':
                case 'डायरेक्टरी':
                case 'ディレクトリ':
                    typeElement.textContent = window.i18n.t('fileList.directory');
                    break;
            }
        }
    });
}

let currentDirectory = null;
let currentDirectoryContents = [];
let currentAction = null;
let currentFilePath = null;
let isProcessing = false;

// DOM elements
const selectDirectoryBtn = document.getElementById('selectDirectoryBtn');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const refreshBtn = document.getElementById('refreshBtn');
const currentPathElement = document.getElementById('currentPathText');
const fileList = document.getElementById('fileList');
const fileGrid = document.getElementById('fileGrid');
const emptyState = document.getElementById('emptyState');
const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const modalTitle = document.getElementById('passwordModalTitle');
const listViewBtn = document.getElementById('listViewBtn');
const gridViewBtn = document.getElementById('gridViewBtn');
const preferencesBtn = document.getElementById('preferencesBtn');
const preferencesModal = document.getElementById('preferencesModal');

// Event listeners
selectDirectoryBtn.addEventListener('click', selectDirectory);
encryptBtn.addEventListener('click', () => {
    console.log('Renderer: Encrypt button clicked');
    showPasswordModal('encrypt');
});
decryptBtn.addEventListener('click', () => {
    console.log('Renderer: Decrypt button clicked');
    showPasswordModal('decrypt');
});
refreshBtn.addEventListener('click', refreshDirectory);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handlePasswordConfirm();
    }
});

listViewBtn.addEventListener('click', () => switchView('list'));
gridViewBtn.addEventListener('click', () => switchView('grid'));
preferencesBtn.addEventListener('click', showPreferences);

// Setup preview event listeners (moved here to ensure elements are defined)
document.addEventListener('DOMContentLoaded', () => {
    const previewCloseBtn = document.getElementById('closePreviewBtn');
    const previewResizeHandle = document.querySelector('.resize-handle');
    
    if (previewCloseBtn) {
        previewCloseBtn.addEventListener('click', closePreviewPane);
    }
    
    if (previewResizeHandle) {
        previewResizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
            e.preventDefault();
        });
    }
    
    // Close preview with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentPreviewFile) {
            closePreviewPane();
        }
    });
});

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize i18n system first
    await initializeI18n();
    
    // Setup menu event listeners
    setupMenuListeners();
    
    // Setup preferences event listeners
    setupPreferencesListeners();
    setupHardwareAuthListeners();
    setupLicenseListeners();
    
    // Setup text editor

    
    // Load saved preferences
    loadPreferences();
    
    // Initialize hardware authentication
    initializeHardwareAuth();
    
    // Setup sidebar toggle
    setupSidebarToggle();
    
    // Setup tooltips
    setupTooltips();
    
    // Setup density slider
    setupDensitySlider();
    
    // Initialize banner system
    loadDismissedBanners();
    await fetchBanners();
    
    // Refresh banners periodically (every 5 minutes)
    setInterval(fetchBanners, 5 * 60 * 1000);
});

// Setup menu event listeners
function setupMenuListeners() {
    // Listen for preferences menu item
    window.electronAPI.onShowPreferences(() => {
        console.log('Menu: Show preferences triggered');
        showPreferences();
    });
    
    // Listen for select directory menu item
    window.electronAPI.onSelectDirectoryMenu(() => {
        console.log('Menu: Select directory triggered');
        selectDirectory();
    });
    
    // Listen for show about menu item
    window.electronAPI.onShowAbout(() => {
        console.log('Menu: Show about triggered');
        showPreferences();
        // Switch to about tab
        setTimeout(() => {
            const aboutTab = document.querySelector('[data-tab="about"]');
            if (aboutTab) {
                aboutTab.click();
            }
        }, 100);
    });
    
    // Also listen for Cmd+, shortcut directly in renderer
    document.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === ',') {
            event.preventDefault();
            console.log('Keyboard: Cmd+, shortcut triggered');
            showPreferences();
        }
    });
    
    // Setup new navigation menu items
    setupNavigationMenuItems();
}

// Setup navigation menu items
function setupNavigationMenuItems() {
    // No additional navigation items needed for encryption app
}

// Set active menu item
function setActiveMenuItem(activeId) {
    // Remove active class from all menu items
    const menuItems = document.querySelectorAll('.nav-menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active'); 
    });
    
    // Add active class to clicked item
    const activeItem = document.getElementById(activeId);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Directory selection
async function selectDirectory() {
    try {
        console.log('Renderer: Requesting directory selection...');
        const selectedPath = await window.electronAPI.selectDirectory();
        console.log('Renderer: Directory selection result:', selectedPath);
        
        if (selectedPath) {
            currentDirectory = selectedPath;
            console.log('Renderer: Set currentDirectory to:', currentDirectory);
            await loadDirectoryContents();
            enableButtons();
            updateCurrentPath();
            updateStatus('Directory loaded successfully');
            showNotification(
                window.i18n ? window.i18n.t('notifications.success') : 'Directory Selected', 
                `Loaded: ${selectedPath}`, 
                'success'
            );
        } else {
            console.log('Renderer: No directory selected');
        }
    } catch (error) {
        console.error('Renderer: Error selecting directory:', error);
        showNotification('Error', 'Failed to select directory', 'error');
    }
}

// Load directory contents
async function loadDirectoryContents() {
    if (!currentDirectory) return;

    try {
        showProgress('Loading directory contents...');
        const contents = await window.electronAPI.getDirectoryContents(currentDirectory);
        currentDirectoryContents = contents;
        renderFileList();
        updateStats();
        hideProgress();
    } catch (error) {
        console.error('Error loading directory contents:', error);
        hideProgress();
        showNotification('Error', 'Failed to load directory contents', 'error');
    }
}

// Render file list
function renderFileList() {
    // Clear existing content
    fileList.innerHTML = '';
    fileGrid.innerHTML = '';
    
    if (!currentDirectoryContents || currentDirectoryContents.length === 0) {
        emptyState.classList.remove('hidden');
        fileList.classList.add('hidden');
        fileGrid.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    
    const isGridView = gridViewBtn.classList.contains('active');
    
    if (isGridView) {
        fileList.classList.add('hidden');
        fileGrid.classList.remove('hidden');
        renderGridView();
    } else {
        fileGrid.classList.add('hidden');
        fileList.classList.remove('hidden');
        renderListView();
    }
}

function renderListView() {
    currentDirectoryContents.forEach((item, index) => {
        const isEncrypted = item.encrypted;
        const isDirectory = item.isDirectory;
        const icon = getFileIcon(item.name, isDirectory, isEncrypted);
        const size = formatFileSize(item.size);
        const modified = formatDate(item.modified);
        
        // Get translated labels
        const encryptedLabel = window.i18n ? window.i18n.t('fileList.encrypted') : 'Encrypted';
        const directoryLabel = window.i18n ? window.i18n.t('fileList.directory') : 'Directory';

        const listItem = document.createElement('li');
        listItem.className = 'file-item';
        listItem.style.animationDelay = `${index * 0.05}s`;
        
        listItem.innerHTML = `
            <div class="file-icon">
                <i class="${icon}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${item.name}</div>
                <div class="file-meta">
                    <span class="file-type">${isDirectory ? directoryLabel : size}</span>
                    <span>${modified}</span>
                    ${isEncrypted ? `<span style="color: #10b981;"><i class="fas fa-lock"></i> ${encryptedLabel}</span>` : ''}
                </div>
            </div>
            <div class="file-actions">
                ${!isDirectory ? `
                    ${isPreviewableFile(item.name) || isPreviewableEncryptedFile(item.name, isEncrypted) ? `
                        <button class="file-action-btn" data-action="preview" data-file-path="${item.path}" data-encrypted="${isEncrypted}" title="Preview">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                    ` : ''}
                    <button class="file-action-btn" data-action="encrypt" data-file-path="${item.path}">
                        <i class="fas fa-lock"></i> Encrypt
                    </button>
                    <button class="file-action-btn" data-action="decrypt" data-file-path="${item.path}">
                        <i class="fas fa-unlock"></i> Decrypt
                    </button>
                ` : ''}
            </div>
        `;
        
        // Add context menu event listener
        listItem.addEventListener('contextmenu', (e) => {
            showContextMenu(e, item.path, isEncrypted, isDirectory);
        });
        
        fileList.appendChild(listItem);
    });
    
    setupFileActionListeners();
}

function renderGridView() {
    currentDirectoryContents.forEach((item, index) => {
        const isEncrypted = item.encrypted;
        const isDirectory = item.isDirectory;
        const icon = getFileIcon(item.name, isDirectory, isEncrypted);
        const size = formatFileSize(item.size);
        
        // Get translated labels
        const encryptedLabel = window.i18n ? window.i18n.t('fileList.encrypted') : 'Encrypted';
        const directoryLabel = window.i18n ? window.i18n.t('fileList.directory') : 'Directory';

        const gridItem = document.createElement('div');
        gridItem.className = 'file-card';
        gridItem.style.animationDelay = `${index * 0.05}s`;
        
        gridItem.innerHTML = `
            <div class="file-icon">
                <i class="${icon}"></i>
            </div>
            <div class="file-name">${item.name}</div>
            <div class="file-meta">
                <span class="file-type">${isDirectory ? directoryLabel : size}</span>
                ${isEncrypted ? `<div style="color: #10b981; margin-top: 0.25rem;"><i class="fas fa-lock"></i> ${encryptedLabel}</div>` : ''}
            </div>
            <div class="file-actions">
                ${!isDirectory ? `
                                    ${isPreviewableFile(item.name) || isPreviewableEncryptedFile(item.name, isEncrypted) ? `
                    <button class="file-action-btn" data-action="preview" data-file-path="${item.path}" data-encrypted="${isEncrypted}" title="Preview">
                        <i class="fas fa-eye"></i>
                    </button>
                ` : ''}
                    <button class="file-action-btn" data-action="encrypt" data-file-path="${item.path}">
                        <i class="fas fa-lock"></i>
                    </button>
                    <button class="file-action-btn" data-action="decrypt" data-file-path="${item.path}">
                        <i class="fas fa-unlock"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        // Add context menu event listener
        gridItem.addEventListener('contextmenu', (e) => {
            showContextMenu(e, item.path, isEncrypted, isDirectory);
        });
        
        fileGrid.appendChild(gridItem);
    });
    
    setupFileActionListeners();
}

function getFileIcon(filename, isDirectory, isEncrypted) {
    if (isDirectory) return 'fas fa-folder';
    if (isEncrypted) return 'fas fa-lock';
    
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        // Images
        'jpg': 'fas fa-image', 'jpeg': 'fas fa-image', 'png': 'fas fa-image', 'gif': 'fas fa-image', 'svg': 'fas fa-image',
        // Documents
        'pdf': 'fas fa-file-pdf', 'doc': 'fas fa-file-word', 'docx': 'fas fa-file-word', 'txt': 'fas fa-file-text',
        // Code
        'js': 'fas fa-file-code', 'html': 'fas fa-file-code', 'css': 'fas fa-file-code', 'json': 'fas fa-file-code',
        // Archives
        'zip': 'fas fa-file-archive', 'rar': 'fas fa-file-archive', '7z': 'fas fa-file-archive',
        // Audio/Video
        'mp3': 'fas fa-file-audio', 'mp4': 'fas fa-file-video', 'avi': 'fas fa-file-video'
    };
    
    return iconMap[ext] || 'fas fa-file';
}

function isPreviewableFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const previewableExtensions = [
        // Images
        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
        // Videos
        'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
        // Text files
        'txt', 'md', 'js', 'html', 'css', 'json', 'xml', 'csv', 'log',
        // PDFs
        'pdf'
    ];
    
    return previewableExtensions.includes(ext);
}

function isPreviewableEncryptedFile(filename, isEncrypted) {
    if (!isEncrypted) return false;
    
    // For encrypted files, check the original extension (remove .enc if present)
    let originalName = filename;
    if (filename.toLowerCase().endsWith('.enc')) {
        originalName = filename.slice(0, -4); // Remove '.enc'
    }
    
    return isPreviewableFile(originalName);
}

function setupFileActionListeners() {
    // Add event listeners for all file action buttons
    document.querySelectorAll('.file-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            const filePath = btn.getAttribute('data-file-path');
            const isEncrypted = btn.getAttribute('data-encrypted') === 'true';
            
            if (action === 'preview') {
                previewFile(filePath, isEncrypted);
            } else {
                showSingleFilePasswordModal(action, filePath);
            }
        });
    });
}

// Password modal functions
function showPasswordModal(action) {
    console.log(`Renderer: showPasswordModal called with action: ${action}`);
    currentAction = action;
    console.log(`Renderer: currentAction set to: ${currentAction}`);
    const titleKey = action === 'encrypt' ? 'modals.encryptDirectory' : 'modals.decryptDirectory';
    modalTitle.textContent = window.i18n ? window.i18n.t(titleKey) : (action === 'encrypt' ? 'Encrypt Directory' : 'Decrypt Directory');
    passwordInput.value = '';
    passwordModal.classList.remove('hidden');
    passwordInput.focus();
}

function closePasswordModal() {
    console.log(`Renderer: closePasswordModal called, currentAction was: ${currentAction}`);
    passwordModal.classList.add('hidden');
    currentAction = null;
    currentFilePath = null;
    passwordInput.value = '';
}

function showSingleFilePasswordModal(action, filePath) {
    console.log(`Renderer: showSingleFilePasswordModal called with action: ${action}, file: ${filePath}`);
    currentAction = action;
    currentFilePath = filePath;
    const fileName = filePath.split('/').pop();
    const titleKey = action === 'encrypt' ? 'modals.encryptFile' : 'modals.decryptFile';
    const titleText = window.i18n ? window.i18n.t(titleKey) : (action === 'encrypt' ? 'Encrypt File' : 'Decrypt File');
    modalTitle.textContent = `${titleText}: ${fileName}`;
    passwordInput.value = '';
    passwordModal.classList.remove('hidden');
    passwordInput.focus();
}

function togglePasswordVisibility() {
    const input = passwordInput;
    const toggle = input.nextElementSibling;
    const icon = toggle.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Handle password confirmation
async function handlePasswordConfirm() {
    const password = passwordInput.value;
    console.log(`Renderer: Password confirm - Action: ${currentAction}, Directory: ${currentDirectory}`);
    
    if (!password) {
        showNotification('Error', 'Please enter a password', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Error', 'Password must be at least 6 characters long', 'error');
        return;
    }

    // Check if this is a single file operation or directory operation
    if (currentFilePath) {
        // Single file operation
        const actionToPerform = currentAction;
        const fileToProcess = currentFilePath;
        console.log(`Renderer: Single file operation - Action: ${actionToPerform}, File: ${fileToProcess}`);
        
        closePasswordModal();
        
        if (actionToPerform === 'encrypt') {
            console.log('Renderer: Starting single file encryption...');
            await encryptSingleFile(fileToProcess, password);
        } else if (actionToPerform === 'decrypt') {
            console.log('Renderer: Starting single file decryption...');
            await decryptSingleFile(fileToProcess, password);
        } else {
            console.error('Renderer: Unknown single file action:', actionToPerform);
            showNotification('Error', `Unknown action: ${actionToPerform}`, 'error');
        }
    } else {
        // Directory operation
        if (!currentDirectory) {
            showNotification('Error', 'No directory selected', 'error');
            return;
        }

        // Store the action before closing modal (which resets currentAction)
        const actionToPerform = currentAction;
        console.log(`Renderer: Stored action: ${actionToPerform}`);
        
        closePasswordModal();
        
        if (actionToPerform === 'encrypt') {
            console.log('Renderer: Starting encryption process...');
            await encryptDirectory(password);
        } else if (actionToPerform === 'decrypt') {
            console.log('Renderer: Starting decryption process...');
            await decryptDirectory(password);
        } else {
            console.error('Renderer: Unknown action:', actionToPerform);
            showNotification('Error', `Unknown action: ${actionToPerform}`, 'error');
        }
    }
}

// Encryption functions
async function encryptDirectory(password = null) {
    if (isProcessing) return;
    
    console.log(`Renderer: Starting directory encryption for ${currentDirectory}`);
    
    isProcessing = true;
    disableButtons();
    showProgress('Encrypting directory...');
    
    try {
        let authKey = password;
        
        // If no password provided, get authentication method (hardware or password)
        if (!authKey) {
            const auth = await getAuthenticationMethod();
            authKey = auth.key;
        }
        
        console.log('Renderer: Calling electronAPI.encryptDirectory...');
        const result = await window.electronAPI.encryptDirectory(currentDirectory, authKey);
        
        console.log('Renderer: Encryption result:', result);
        
        if (result.success) {
            showNotification('Success', result.message || 'Directory encrypted successfully', 'success');
            await loadDirectoryContents();
        } else {
            console.error('Renderer: Encryption failed:', result.error);
            showNotification('Error', result.error || 'Encryption failed', 'error');
        }
    } catch (error) {
        console.error('Renderer: Encryption error:', error);
        showNotification('Error', `Failed to encrypt directory: ${error.message}`, 'error');
    } finally {
        isProcessing = false;
        enableButtons();
        hideProgress();
    }
}

async function decryptDirectory(password = null) {
    if (isProcessing) return;
    
    console.log(`Renderer: Starting directory decryption for ${currentDirectory}`);
    
    isProcessing = true;
    disableButtons();
    showProgress('Decrypting directory...');
    
    try {
        let authKey = password;
        
        // If no password provided, get authentication method (hardware or password)
        if (!authKey) {
            const auth = await getAuthenticationMethod();
            authKey = auth.key;
        }
        
        console.log('Renderer: Calling electronAPI.decryptDirectory...');
        const result = await window.electronAPI.decryptDirectory(currentDirectory, authKey);
        
        console.log('Renderer: Decryption result:', result);
        
        if (result.success) {
            showNotification('Success', result.message || 'Directory decrypted successfully', 'success');
            await loadDirectoryContents();
        } else {
            console.error('Renderer: Decryption failed:', result.error);
            showNotification('Error', result.error || 'Decryption failed', 'error');
        }
    } catch (error) {
        console.error('Renderer: Decryption error:', error);
        showNotification('Error', `Failed to decrypt directory: ${error.message}`, 'error');
    } finally {
        isProcessing = false;
        enableButtons();
        hideProgress();
    }
}

// Single file encryption/decryption
async function encryptSingleFile(filePath, password = null) {
    if (isProcessing) return;
    
    console.log(`Renderer: Starting single file encryption for ${filePath}`);
    
    isProcessing = true;
    disableButtons();
    showProgress('Encrypting file...');
    
    try {
        let authKey = password;
        
        // If no password provided, get authentication method (hardware or password)
        if (!authKey) {
            const auth = await getAuthenticationMethod();
            authKey = auth.key;
        }
        
        const result = await window.electronAPI.encryptFile(filePath, authKey);
        
        if (result.success) {
            const fileName = filePath.split('/').pop();
            showNotification('Success', `File "${fileName}" encrypted successfully`, 'success');
            await loadDirectoryContents();
        } else {
            showNotification('Error', result.error || 'Encryption failed', 'error');
        }
    } catch (error) {
        console.error('File encryption error:', error);
        showNotification('Error', 'Failed to encrypt file', 'error');
    } finally {
        isProcessing = false;
        enableButtons();
        hideProgress();
    }
}

async function decryptSingleFile(filePath, password = null) {
    if (isProcessing) return;
    
    console.log(`Renderer: Starting single file decryption for ${filePath}`);
    
    isProcessing = true;
    disableButtons();
    showProgress('Decrypting file...');
    
    try {
        let authKey = password;
        
        // If no password provided, get authentication method (hardware or password)
        if (!authKey) {
            const auth = await getAuthenticationMethod();
            authKey = auth.key;
        }
        
        const result = await window.electronAPI.decryptFile(filePath, authKey);
        
        if (result.success) {
            const fileName = filePath.split('/').pop();
            showNotification('Success', `File "${fileName}" decrypted successfully`, 'success');
            await loadDirectoryContents();
        } else {
            showNotification('Error', result.error || 'Decryption failed', 'error');
        }
    } catch (error) {
        console.error('File decryption error:', error);
        showNotification('Error', 'Failed to decrypt file', 'error');
    } finally {
        isProcessing = false;
        enableButtons();
        hideProgress();
    }
}

// Refresh directory
async function refreshDirectory() {
    if (currentDirectory) {
        updateStatus('Refreshing directory...');
        await loadDirectoryContents();
        updateStatus('Directory refreshed');
        showNotification('Refreshed', 'Directory contents updated', 'info');
    }
}

// UI helper functions
function enableButtons() {
    encryptBtn.disabled = false;
    decryptBtn.disabled = false;
    refreshBtn.disabled = false;
}

function disableButtons() {
    encryptBtn.disabled = true;
    decryptBtn.disabled = true;
    refreshBtn.disabled = true;
}

function updateCurrentPath() {
    if (currentDirectory) {
        const pathSpan = currentPathElement.querySelector('span');
        pathSpan.textContent = currentDirectory;
        breadcrumbPath.textContent = currentDirectory;
    }
}

function updateStats() {
    const files = currentDirectoryContents.filter(item => !item.isDirectory);
    const directories = currentDirectoryContents.filter(item => item.isDirectory);
    const encrypted = currentDirectoryContents.filter(item => item.encrypted);

    totalFiles.textContent = files.length;
    totalDirs.textContent = directories.length;
    encryptedFiles.textContent = encrypted.length;
}

function showProgress(message) {
    if (progressContainer && progressText) {
        progressText.textContent = message;
        progressContainer.classList.remove('hidden');
        if (progressFill) progressFill.style.width = '100%';
    }
}

function hideProgress() {
    if (progressContainer) {
        progressContainer.classList.add('hidden');
        if (progressFill) progressFill.style.width = '0%';
    }
}

function updateStatus(message) {
    // Status message is now handled through notifications
    console.log('Status:', message);
}

function updateStatusTime() {
    // Status time is no longer needed in the new template
}

function switchView(viewType) {
    if (viewType === 'list') {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    } else {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    }
    
    // Re-render the file list with the new view
    renderFileList();
}

// Notification system
function showNotification(title, message, type = 'info') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    notification.innerHTML = `
        <div class="notification-content">
            <i class="notification-icon ${iconMap[type]}"></i>
            <div class="notification-text">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        </div>
    `;

    notificationContainer.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Notification styles are now handled in CSS

// Preferences functionality
function showPreferences() {
    console.log('Renderer: Opening preferences modal');
    preferencesModal.classList.remove('hidden');
    loadPreferences();
}

function closePreferences() {
    console.log('Renderer: Closing preferences modal');
    preferencesModal.classList.add('hidden');
}

function loadPreferences() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('maraikka-theme') || 'dark';
    applyTheme(savedTheme);
    
    // Update theme selector
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === savedTheme) {
            option.classList.add('active');
        }
    });
    
    // Additional preferences can be loaded here as needed
}

function applyTheme(theme) {
    console.log(`Renderer: Applying theme: ${theme}`);
    
    // Remove all theme classes
    document.body.classList.remove('light-theme', 'dark');
    
    // Apply the selected theme
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.add('dark');
    }
    
    localStorage.setItem('maraikka-theme', theme);
    
    // Broadcast theme change to all open editor windows
    if (window.electronAPI && window.electronAPI.broadcastThemeChange) {
        window.electronAPI.broadcastThemeChange(theme);
    }
}

// Setup preferences event listeners (called after DOM is loaded)
function setupPreferencesListeners() {
    // Preferences tab switching
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.tab-panel').forEach(content => {
                content.classList.remove('active');
                content.classList.add('hidden');
            });
            const targetPanel = document.getElementById(`${targetTab}Tab`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.classList.remove('hidden');
            }
        });
    });
    
    // Language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        // Set current language
        languageSelect.value = window.i18n ? window.i18n.getCurrentLanguage() : 'en';
        
        languageSelect.addEventListener('change', async (e) => {
            const selectedLanguage = e.target.value;
            if (window.i18n) {
                await window.i18n.changeLanguage(selectedLanguage);
                showNotification(
                    window.i18n.t('notifications.success'), 
                    `Language changed to ${selectedLanguage}`, 
                    'success'
                );
            }
        });
    }

    // Theme selector
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            
            // Update active theme option
            document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Apply theme
            applyTheme(theme);
            showNotification(
                window.i18n ? window.i18n.t('notifications.success') : 'Theme Updated', 
                window.i18n ? `Switched to ${window.i18n.t('preferences.theme' + (theme === 'dark' ? 'Dark' : 'Light'))} theme` : `Switched to ${theme} theme`, 
                'success'
            );
        });
    });
    
    // Additional preference controls can be added here as needed
}

// External link handler
function openExternal(url) {
    console.log(`Renderer: Opening external URL: ${url}`);
    // In a real Electron app, you would use shell.openExternal
    // For now, just show a notification
    showNotification('External Link', 'Link functionality will be implemented in production build', 'info');
}

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Handle escape key for all modals/panels in order of priority
        // Check if context menu is open
        if (contextMenu.classList.contains('show')) {
            hideContextMenu();
        }
        // Check if preview pane is open with password prompt
        else if (!previewPane.classList.contains('hidden') && 
            document.querySelector('.preview-password-prompt')) {
            // This is handled by the password prompt's own keydown listener
            return;
        }
        // Check modals in order of priority
        else if (!passwordModal.classList.contains('hidden')) {
            closePasswordModal();
        } else if (!preferencesModal.classList.contains('hidden')) {
            closePreferences();
        } else if (!document.getElementById('hardwareAuthModal').classList.contains('hidden')) {
            closeHardwareAuthModal();
        }
        // Close preview pane if it's open (and no password prompt)
        else if (!previewPane.classList.contains('hidden')) {
            closePreviewPane();
        }
    }
});

// Unified click-outside handling for all modals
function setupModalClickOutsideHandlers() {
    // Password modal click-outside handler
    passwordModal.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            closePasswordModal();
        }
    });

    // Preferences modal click-outside handler
    preferencesModal.addEventListener('click', (e) => {
        if (e.target === preferencesModal) {
            closePreferences();
        }
    });

    // Hardware auth modal click-outside handler
    const hardwareAuthModal = document.getElementById('hardwareAuthModal');
    if (hardwareAuthModal) {
        hardwareAuthModal.addEventListener('click', (e) => {
            if (e.target === hardwareAuthModal) {
                closeHardwareAuthModal();
            }
        });
    }
}

// Initialize modal handlers
setupModalClickOutsideHandlers();

// File Preview Functionality
let isResizing = false;
let currentPreviewFile = null;
let sidebarAutoHidden = false; // Track if sidebar was automatically hidden due to preview

// Preview pane elements
const previewPane = document.getElementById('previewPane');
const previewFileName = document.getElementById('previewFileName');
const previewContent = document.querySelector('.preview-content');
const previewLoader = document.getElementById('previewLoader');
const previewError = document.getElementById('previewError');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const resizeHandle = document.querySelector('.resize-handle');
const appContainer = document.querySelector('.app-container');

// Preview file function
async function previewFile(filePath, isEncrypted = false) {
    try {
        currentPreviewFile = filePath;
        const fileName = filePath.split('/').pop();
        
        // Clear existing content and set filename with proper structure
        previewFileName.innerHTML = '';
        const fileNameSpan = document.createElement('span');
        fileNameSpan.className = 'preview-filename';
        fileNameSpan.textContent = fileName;
        previewFileName.appendChild(fileNameSpan);
        
        // Open preview pane
        openPreviewPane();
        
        if (isEncrypted) {
            showPasswordPrompt(filePath);
        } else {
            // Show loading state
            showPreviewLoader();
            
            // Get file content based on type
            const ext = fileName.split('.').pop().toLowerCase();
            await renderPreviewContent(filePath, ext);
        }
        
    } catch (error) {
        console.error('Error previewing file:', error);
        showPreviewError();
    }
}

function updatePreviewFileNameWithPageCount(pageCount) {
    if (currentPreviewFile && previewFileName) {
        const fileName = currentPreviewFile.split('/').pop();
        
        // Clear existing content
        previewFileName.innerHTML = '';
        
        // Create filename element (primary text)
        const fileNameSpan = document.createElement('span');
        fileNameSpan.className = 'preview-filename';
        fileNameSpan.textContent = fileName;
        
        // Create page count element (secondary text)
        const pageCountSpan = document.createElement('span');
        pageCountSpan.className = 'preview-page-count';
        pageCountSpan.textContent = `(${pageCount} pages)`;
        
        // Append both elements
        previewFileName.appendChild(fileNameSpan);
        previewFileName.appendChild(pageCountSpan);
    }
}

function openPreviewPane() {
    previewPane.classList.remove('hidden');
    appContainer.classList.add('preview-open');
    
    // Set initial margin based on preview pane width
    const mainContent = document.querySelector('.main-content');
    const previewWidth = previewPane.offsetWidth || 480; // Default 30rem = 480px
    mainContent.style.marginRight = `${previewWidth}px`;
    
    // Auto-collapse sidebar if it's not already collapsed and preview would cause space issues
    autoManageSidebarForPreview(true);
}

function closePreviewPane() {
    previewPane.classList.add('hidden');
    appContainer.classList.remove('preview-open');
    
    // Reset main content margin to 0
    const mainContent = document.querySelector('.main-content');
    mainContent.style.marginRight = '0';
    
    clearPreviewContent();
    currentPreviewFile = null;
    
    // Auto-expand sidebar if it was auto-collapsed
    autoManageSidebarForPreview(false);
}

function showPreviewLoader() {
    previewLoader.classList.remove('hidden');
    previewError.classList.add('hidden');
    clearPreviewContent();
}

function showPreviewError() {
    previewLoader.classList.add('hidden');
    previewError.classList.remove('hidden');
    clearPreviewContent();
}

function clearPreviewContent() {
    // Remove any existing content except loader and error
    const existingContent = previewContent.querySelector('.preview-image-container, .preview-video-container, .preview-video, .preview-text, .preview-pdf, .preview-pdf-viewer, .preview-unsupported, .preview-password-prompt');
    if (existingContent) {
        existingContent.remove();
    }
}

function showPasswordPrompt(filePath) {
    previewLoader.classList.add('hidden');
    previewError.classList.add('hidden');
    clearPreviewContent();
    
    const fileName = filePath.split('/').pop();
    const promptDiv = document.createElement('div');
    promptDiv.className = 'preview-password-prompt';
    
    promptDiv.innerHTML = `
        <i class="fas fa-lock"></i>
        <h3>Encrypted File</h3>
        <p>Enter password to preview "${fileName}"</p>
        <div class="preview-password-form">
            <input type="password" class="preview-password-input" placeholder="Enter password" />
            <div class="preview-password-buttons">
                <button class="preview-password-btn secondary cancel-btn">Cancel</button>
                <button class="preview-password-btn primary unlock-btn">Unlock & Preview</button>
            </div>
            <div class="preview-error-message hidden"></div>
        </div>
    `;
    
    previewContent.appendChild(promptDiv);
    
    const passwordInput = promptDiv.querySelector('.preview-password-input');
    const unlockBtn = promptDiv.querySelector('.unlock-btn');
    const cancelBtn = promptDiv.querySelector('.cancel-btn');
    const errorDiv = promptDiv.querySelector('.preview-error-message');
    
    // Focus password input
    passwordInput.focus();
    
    // Handle unlock button
    const handleUnlock = async () => {
        const password = passwordInput.value.trim();
        if (!password) {
            showPasswordError(errorDiv, 'Please enter a password');
            return;
        }
        
        if (password.length < 6) {
            showPasswordError(errorDiv, 'Password must be at least 6 characters');
            return;
        }
        
        try {
            unlockBtn.disabled = true;
            unlockBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Decrypting...';
            hidePasswordError(errorDiv);
            
            await previewEncryptedFile(filePath, password);
        } catch (error) {
            console.error('Error decrypting file for preview:', error);
            showPasswordError(errorDiv, error.message || 'Failed to decrypt file');
        } finally {
            unlockBtn.disabled = false;
            unlockBtn.innerHTML = 'Unlock & Preview';
        }
    };
    
    // Handle cancel button
    const handleCancel = () => {
        closePreviewPane();
    };
    
    // Event listeners
    unlockBtn.addEventListener('click', handleUnlock);
    cancelBtn.addEventListener('click', handleCancel);
    
    // Enter key to unlock, Escape key to cancel
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !unlockBtn.disabled) {
            handleUnlock();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    });
}

function showPasswordError(errorDiv, message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hidePasswordError(errorDiv) {
    errorDiv.classList.add('hidden');
}

async function previewEncryptedFile(filePath, password) {
    try {
        const result = await window.electronAPI.decryptFileForPreview(filePath, password);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // Clear password prompt
        clearPreviewContent();
        showPreviewLoader();
        
        // Render the decrypted content
        await renderDecryptedPreviewContent(result);
        
    } catch (error) {
        console.error('Error previewing encrypted file:', error);
        throw error;
    }
}

async function renderDecryptedPreviewContent(decryptedData) {
    try {
        previewLoader.classList.add('hidden');
        previewError.classList.add('hidden');
        
        const { data, extension, mimeType } = decryptedData;
        
        if (isImageFile(extension)) {
            await renderDecryptedImagePreview(data, mimeType);
        } else if (isVideoFile(extension)) {
            await renderDecryptedVideoPreview(data, mimeType);
        } else if (isTextFile(extension)) {
            await renderDecryptedTextPreview(data);
        } else if (extension === 'pdf') {
            await renderDecryptedPDFPreview(data);
        } else {
            renderUnsupportedPreview();
        }
    } catch (error) {
        console.error('Error rendering decrypted preview:', error);
        showPreviewError();
    }
}

async function renderDecryptedImagePreview(data, mimeType) {
    // Create container for image and controls
    const container = document.createElement('div');
    container.className = 'preview-image-container';
    
    // Create image element
    const img = document.createElement('img');
    img.className = 'preview-image';
    img.alt = 'Preview';
    
    // Convert buffer to blob and create object URL
    const blob = new Blob([data], { type: mimeType });
    const imageUrl = URL.createObjectURL(blob);
    img.src = imageUrl;
    
    // Create controls
    const controls = document.createElement('div');
    controls.className = 'preview-image-controls';
    controls.innerHTML = `
        <button class="zoom-out-btn" title="Zoom Out">
            <i class="fas fa-search-minus"></i>
        </button>
        <div class="zoom-level-container">
            <div class="zoom-level" title="Click to select zoom level">100%</div>
            <div class="zoom-options hidden">
                <div class="zoom-option" data-zoom="0.5">50%</div>
                <div class="zoom-option" data-zoom="0.75">75%</div>
                <div class="zoom-option" data-zoom="1">100%</div>
                <div class="zoom-option" data-zoom="1.5">150%</div>
                <div class="zoom-option" data-zoom="2">200%</div>
                <div class="zoom-option" data-zoom="3">300%</div>
                <div class="zoom-option" data-zoom="4">400%</div>
                <div class="zoom-option" data-zoom="5">500%</div>
            </div>
        </div>
        <button class="zoom-in-btn" title="Zoom In">
            <i class="fas fa-search-plus"></i>
        </button>
    `;
    
    container.appendChild(img);
    container.appendChild(controls);
    
    img.onload = () => {
        previewContent.appendChild(container);
        setupImageZoomPan(container, img, controls);
    };
    
    img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        showPreviewError();
    };
    
    // Clean up URL when preview closes
    const originalClosePreview = closePreviewPane;
    closePreviewPane = () => {
        URL.revokeObjectURL(imageUrl);
        closePreviewPane = originalClosePreview;
        originalClosePreview();
    };
}

async function renderDecryptedVideoPreview(data, mimeType) {
    // Create container for video centering
    const container = document.createElement('div');
    container.className = 'preview-video-container';
    
    const video = document.createElement('video');
    video.className = 'preview-video';
    video.controls = true;
    video.preload = 'metadata';
    
    // Convert buffer to blob and create object URL
    const blob = new Blob([data], { type: mimeType });
    const videoUrl = URL.createObjectURL(blob);
    video.src = videoUrl;
    
    video.onloadedmetadata = () => {
        container.appendChild(video);
        previewContent.appendChild(container);
    };
    
    video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        showPreviewError();
    };
    
    // Clean up URL when preview closes
    const originalClosePreview = closePreviewPane;
    closePreviewPane = () => {
        URL.revokeObjectURL(videoUrl);
        closePreviewPane = originalClosePreview;
        originalClosePreview();
    };
}

async function renderDecryptedTextPreview(data) {
    const textDiv = document.createElement('div');
    textDiv.className = 'preview-text';
    textDiv.textContent = data.toString('utf8');
    
    previewContent.appendChild(textDiv);
}

async function renderDecryptedPDFPreview(data) {
    console.log('Rendering decrypted PDF with custom viewer');
    // Use the custom PDF viewer for decrypted PDFs too
    await createCustomPDFViewer(data);
}

async function renderPreviewContent(filePath, ext) {
    try {
        console.log(`Rendering preview for ${filePath} with extension ${ext}`);
        console.log('Preview content element:', previewContent);
        console.log('Preview loader element:', previewLoader);
        console.log('Preview error element:', previewError);
        
        previewLoader.classList.add('hidden');
        previewError.classList.add('hidden');
        
        if (isImageFile(ext)) {
            await renderImagePreview(filePath);
        } else if (isVideoFile(ext)) {
            await renderVideoPreview(filePath);
        } else if (isTextFile(ext)) {
            await renderTextPreview(filePath);
        } else if (ext === 'pdf') {
            console.log('Calling renderPDFPreview for:', filePath);
            await renderPDFPreview(filePath);
        } else {
            console.log('Rendering unsupported preview for extension:', ext);
            renderUnsupportedPreview();
        }
        console.log('Preview content rendered successfully');
    } catch (error) {
        console.error('Error rendering preview:', error);
        showPreviewError();
    }
}

function isImageFile(ext) {
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
}

function isVideoFile(ext) {
    return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext);
}

function isTextFile(ext) {
    return ['txt', 'md', 'js', 'html', 'css', 'json', 'xml', 'csv', 'log'].includes(ext);
}

async function renderImagePreview(filePath) {
    // Create container for image and controls
    const container = document.createElement('div');
    container.className = 'preview-image-container';
    
    // Create image element
    const img = document.createElement('img');
    img.className = 'preview-image';
    img.src = `file://${filePath}`;
    img.alt = 'Preview';
    
    // Create controls
    const controls = document.createElement('div');
    controls.className = 'preview-image-controls';
    controls.innerHTML = `
        <button class="zoom-out-btn" title="Zoom Out">
            <i class="fas fa-search-minus"></i>
        </button>
        <div class="zoom-level-container">
            <div class="zoom-level" title="Click to select zoom level">100%</div>
            <div class="zoom-options hidden">
                <div class="zoom-option" data-zoom="0.5">50%</div>
                <div class="zoom-option" data-zoom="0.75">75%</div>
                <div class="zoom-option" data-zoom="1">100%</div>
                <div class="zoom-option" data-zoom="1.5">150%</div>
                <div class="zoom-option" data-zoom="2">200%</div>
                <div class="zoom-option" data-zoom="3">300%</div>
                <div class="zoom-option" data-zoom="4">400%</div>
                <div class="zoom-option" data-zoom="5">500%</div>
            </div>
        </div>
        <button class="zoom-in-btn" title="Zoom In">
            <i class="fas fa-search-plus"></i>
        </button>
    `;
    
    container.appendChild(img);
    container.appendChild(controls);
    
    img.onload = () => {
        previewContent.appendChild(container);
        setupImageZoomPan(container, img, controls);
    };
    
    img.onerror = () => {
        showPreviewError();
    };
}

function setupImageZoomPan(container, img, controls) {
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastTranslateX = 0;
    let lastTranslateY = 0;
    
    const minScale = 0.1;
    const maxScale = 5;
    const scaleStep = 0.2;
    
    // Update transform
    function updateTransform() {
        // Apply bounds checking to keep image within visible area
        constrainImageBounds();
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        controls.querySelector('.zoom-level').textContent = `${Math.round(scale * 100)}%`;
    }
    
    // Constrain image bounds to keep it within the visible container
    function constrainImageBounds() {
        if (scale <= 1) {
            // When zoomed out to 100% or less, center the image
            translateX = 0;
            translateY = 0;
            return;
        }
        
        // Get container and image dimensions
        const containerRect = container.getBoundingClientRect();
        const imgWidth = img.naturalWidth * scale;
        const imgHeight = img.naturalHeight * scale;
        
        // Calculate maximum allowed translation to keep image visible
        const maxTranslateX = Math.max(0, (imgWidth - containerRect.width) / 2);
        const maxTranslateY = Math.max(0, (imgHeight - containerRect.height) / 2);
        
        // Constrain translation within bounds
        translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
        translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));
    }
    
    // Zoom to fit
    function zoomToFit() {
        const containerRect = container.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();
        
        const scaleX = containerRect.width / img.naturalWidth;
        const scaleY = containerRect.height / img.naturalHeight;
        scale = Math.min(scaleX, scaleY, 1);
        
        translateX = 0;
        translateY = 0;
        updateTransform();
    }
    
    // Reset zoom
    function resetZoom() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
    }
    
    // Zoom in/out
    function zoom(delta) {
        const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));
        if (newScale !== scale) {
            scale = newScale;
            updateTransform();
        }
    }
    
    // Mouse wheel zoom
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -scaleStep : scaleStep;
        zoom(delta);
    });
    
    // Mouse drag to pan
    container.addEventListener('mousedown', (e) => {
        if (scale > 1) {
            isDragging = true;
            container.classList.add('dragging');
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            lastTranslateX = translateX;
            lastTranslateY = translateY;
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            translateX = lastTranslateX + deltaX;
            translateY = lastTranslateY + deltaY;
            
            // Apply bounds checking during drag
            constrainImageBounds();
            
            // Update the drag start position to current constrained position
            // This prevents accumulating errors when dragging against bounds
            if (translateX !== lastTranslateX + deltaX || translateY !== lastTranslateY + deltaY) {
                lastTranslateX = translateX - deltaX;
                lastTranslateY = translateY - deltaY;
            }
            
            updateTransform();
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        container.classList.remove('dragging');
    });
    
    // Button controls
    controls.querySelector('.zoom-in-btn').addEventListener('click', () => zoom(scaleStep));
    controls.querySelector('.zoom-out-btn').addEventListener('click', () => zoom(-scaleStep));
    
    // Zoom level dropdown functionality
    const zoomLevel = controls.querySelector('.zoom-level');
    const zoomOptions = controls.querySelector('.zoom-options');
    const zoomOptionItems = controls.querySelectorAll('.zoom-option');
    
    // Toggle zoom options dropdown
    zoomLevel.addEventListener('click', (e) => {
        e.stopPropagation();
        zoomOptions.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!controls.contains(e.target)) {
            zoomOptions.classList.add('hidden');
        }
    });
    
    // Handle zoom option selection
    zoomOptionItems.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const zoomValue = parseFloat(option.dataset.zoom);
            scale = zoomValue;
            translateX = 0;
            translateY = 0;
            updateTransform();
            zoomOptions.classList.add('hidden');
        });
    });
    
    // Initial zoom at 100%
    updateTransform();
}

async function renderVideoPreview(filePath) {
    // Create container for video centering
    const container = document.createElement('div');
    container.className = 'preview-video-container';
    
    const video = document.createElement('video');
    video.className = 'preview-video';
    video.src = `file://${filePath}`;
    video.controls = true;
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
        container.appendChild(video);
        previewContent.appendChild(container);
    };
    
    video.onerror = () => {
        showPreviewError();
    };
}

async function renderTextPreview(filePath) {
    try {
        // Use Electron's fs to read text files
        const result = await window.electronAPI.readTextFile(filePath);
        
        if (result.success) {
            const textDiv = document.createElement('div');
            textDiv.className = 'preview-text';
            textDiv.textContent = result.content;
            
            previewContent.appendChild(textDiv);
        } else {
            console.error('Error reading text file:', result.error);
            showPreviewError();
        }
    } catch (error) {
        console.error('Error reading text file:', error);
        showPreviewError();
    }
}

async function renderPDFPreview(filePath) {
    try {
        console.log('Loading custom PDF preview for:', filePath);
        
        // Check if readBinaryFile API is available
        if (!window.electronAPI || !window.electronAPI.readBinaryFile) {
            console.error('readBinaryFile API not available');
            showPreviewError();
            return;
        }
        
        // Read the PDF file as binary data
        const pdfData = await window.electronAPI.readBinaryFile(filePath);
        console.log('PDF data loaded, size:', pdfData ? pdfData.length : 'null');
        
        if (!pdfData) {
            console.error('No PDF data received');
            showPreviewError();
            return;
        }
        
        // Create custom PDF viewer
        await createCustomPDFViewer(pdfData);
        
    } catch (error) {
        console.error('Error loading PDF:', error);
        showPreviewError();
    }
}

async function createCustomPDFViewer(pdfData) {
    // Hide loader and error states
    previewLoader.classList.add('hidden');
    previewError.classList.add('hidden');
    
    // Create PDF viewer container - start with just loading
    const viewerContainer = document.createElement('div');
    viewerContainer.className = 'preview-pdf-viewer';
    
    // PDF content area with loading state
    const contentArea = document.createElement('div');
    contentArea.className = 'pdf-content';
    
    // Loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'pdf-loading';
    loadingDiv.innerHTML = `
        <i class="fas fa-spinner"></i>
        <span>Loading PDF...</span>
    `;
    contentArea.appendChild(loadingDiv);
    
    // Start with just the content area - no toolbar yet
    viewerContainer.appendChild(contentArea);
    previewContent.appendChild(viewerContainer);
    
    // Initialize PDF.js
    try {
        console.log('Checking PDF.js availability...');
        
        // Check if PDF.js is available globally
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js library not loaded');
        }
        
        console.log('PDF.js found, configuring worker...');
        
        // Set worker source for Electron
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log('Worker configured, loading PDF document...');
        
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        console.log('Loading task created, waiting for PDF...');
        const pdf = await loadingTask.promise;
        console.log('PDF loading promise resolved');
        
        console.log('PDF loaded successfully, pages:', pdf.numPages);
        
        // Update filename with page count
        updatePreviewFileNameWithPageCount(pdf.numPages);
        
        // Hide loading, create scrollable pages container
        loadingDiv.style.display = 'none';
        
        const pagesContainer = document.createElement('div');
        pagesContainer.className = 'pdf-pages-container';
        contentArea.appendChild(pagesContainer);
        
        // PDF viewer state
        const zoom = 1.0; // Fixed zoom level
        let renderTasks = []; // Track all render operations
        let renderTimeout = null; // For debouncing render calls
        
        // Create all page containers
        const pageElements = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const pageContainer = document.createElement('div');
            pageContainer.className = 'pdf-page-container';
            
            const pageNumber = document.createElement('div');
            pageNumber.className = 'pdf-page-number';
            pageNumber.textContent = `Page ${i}`;
            
            const canvasContainer = document.createElement('div');
            canvasContainer.className = 'pdf-canvas-container';
            
            const canvas = document.createElement('canvas');
            canvas.className = 'pdf-canvas';
            canvas.dataset.pageNumber = i;
            
            canvasContainer.appendChild(canvas);
            pageContainer.appendChild(pageNumber);
            pageContainer.appendChild(canvasContainer);
            pagesContainer.appendChild(pageContainer);
            
            pageElements.push({
                container: pageContainer,
                canvas: canvas,
                pageNumber: i
            });
        }
        
        // Render all pages function with debouncing
        async function renderAllPages() {
            // Clear any pending render timeout
            if (renderTimeout) {
                clearTimeout(renderTimeout);
                renderTimeout = null;
            }
            
            // Debounce rapid render calls
            return new Promise((resolve) => {
                renderTimeout = setTimeout(async () => {
                    await doRenderAllPages();
                    resolve();
                }, 100); // 100ms debounce for all pages
            });
        }
        
        // Actual render all pages function
        async function doRenderAllPages() {
            try {
                // Cancel all previous render tasks
                renderTasks.forEach(task => {
                    if (task && !task._destroyed) {
                        task.cancel();
                    }
                });
                renderTasks = [];
                
                console.log(`Rendering all ${pdf.numPages} pages at zoom ${zoom}`);
                
                // Render all pages
                const renderPromises = pageElements.map(async (pageElement, index) => {
                    try {
                        const page = await pdf.getPage(pageElement.pageNumber);
                        const viewport = page.getViewport({ scale: zoom });
                        
                        // Set canvas dimensions
                        pageElement.canvas.width = viewport.width;
                        pageElement.canvas.height = viewport.height;
                        
                        // Render page
                        const ctx = pageElement.canvas.getContext('2d');
                        const renderContext = {
                            canvasContext: ctx,
                            viewport: viewport
                        };
                        
                        // Start render task
                        const renderTask = page.render(renderContext);
                        renderTasks.push(renderTask);
                        await renderTask.promise;
                        
                        console.log(`Rendered page ${pageElement.pageNumber}`);
                        
                    } catch (error) {
                        if (error.name === 'RenderingCancelledException') {
                            console.log(`Render cancelled for page ${pageElement.pageNumber} (expected)`);
                            return;
                        }
                        console.error(`Error rendering page ${pageElement.pageNumber}:`, error);
                    }
                });
                
                await Promise.all(renderPromises);
                console.log('All pages rendered successfully');
                
            } catch (error) {
                console.error('Error rendering pages:', error);
                showPDFError(contentArea);
            }
        }
        
        // Initial render
        await renderAllPages();
        
    } catch (error) {
        console.error('Error initializing PDF viewer:', error);
        showPDFError(contentArea);
    }
}

function showPDFError(container, toolbar = null) {
    // Remove toolbar if it exists
    if (toolbar && toolbar.parentNode) {
        toolbar.parentNode.removeChild(toolbar);
    }
    
    container.innerHTML = `
        <div class="pdf-error">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Failed to load PDF</h3>
            <p>There was an error loading this PDF file.</p>
        </div>
    `;
}

function renderUnsupportedPreview() {
    const unsupportedDiv = document.createElement('div');
    unsupportedDiv.className = 'preview-unsupported';
    unsupportedDiv.innerHTML = `
        <i class="fas fa-file"></i>
        <h3>Preview not available</h3>
        <p>This file type is not supported for preview.</p>
    `;
    
    previewContent.appendChild(unsupportedDiv);
}

// Event listeners for preview pane
closePreviewBtn.addEventListener('click', closePreviewPane);

// Resize functionality
resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
});

function handleResize(e) {
    if (!isResizing) return;
    
    const containerRect = appContainer.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;
    
    // Apply min/max constraints
    const minWidth = 320; // 20rem
    const maxWidthRem = 800; // 50rem
    const maxWidthViewport = window.innerWidth * 0.5; // 50% of viewport
    const maxWidth = Math.min(maxWidthRem, maxWidthViewport); // Use whichever is smaller
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    previewPane.style.width = `${constrainedWidth}px`;
    
    // Update main content margin
    if (appContainer.classList.contains('preview-open')) {
        document.querySelector('.main-content').style.marginRight = `${constrainedWidth}px`;
    }
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}

// Close preview with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !previewPane.classList.contains('hidden')) {
        closePreviewPane();
    }
});

// Hardware Authentication Functions
let hardwareAuthConfig = {
    isEnabled: false,
    hasCredentials: false,
    credentialIds: []
};

async function initializeHardwareAuth() {
    try {
        const config = await window.electronAPI.loadHardwareAuthConfig();
        if (config.success) {
            hardwareAuthConfig = config;
            updateHardwareAuthUI();
        }
    } catch (error) {
        console.error('Error loading hardware auth config:', error);
    }
}

function updateHardwareAuthUI() {
    const checkbox = document.getElementById('hardwareAuthEnabled');
    const statusDiv = document.getElementById('hardwareAuthStatus');
    const statusText = document.getElementById('hardwareAuthStatusText');
    const registerBtn = document.getElementById('registerHardwareAuth');
    const removeBtn = document.getElementById('removeHardwareAuth');
    
    if (checkbox) {
        // Check if FIDO feature is available with license
        const fidoAvailable = hasFeature('fido');
        checkbox.disabled = !fidoAvailable;
        
        if (!fidoAvailable) {
            checkbox.checked = false;
            statusDiv.classList.add('hidden');
            return;
        }
        
        checkbox.checked = hardwareAuthConfig.isEnabled;
        
        if (hardwareAuthConfig.isEnabled && hardwareAuthConfig.hasCredentials) {
            statusDiv.classList.remove('hidden');
            statusText.textContent = 'Hardware authenticator registered';
            statusText.parentElement.classList.add('success');
            registerBtn.classList.add('hidden');
            removeBtn.classList.remove('hidden');
        } else if (hardwareAuthConfig.isEnabled) {
            statusDiv.classList.remove('hidden');
            statusText.textContent = 'No authenticator registered';
            statusText.parentElement.classList.remove('success');
            registerBtn.classList.remove('hidden');
            removeBtn.classList.add('hidden');
        } else {
            statusDiv.classList.add('hidden');
        }
    }
}

function setupHardwareAuthListeners() {
    const checkbox = document.getElementById('hardwareAuthEnabled');
    const registerBtn = document.getElementById('registerHardwareAuth');
    const removeBtn = document.getElementById('removeHardwareAuth');
    
    if (checkbox) {
        checkbox.addEventListener('change', async (e) => {
            // Check if FIDO feature is available
            if (!hasFeature('fido')) {
                e.target.checked = false;
                showNotification('License Required', 'FIDO2 Hardware Authentication requires a valid license with FIDO features.', 'error');
                return;
            }
            
            if (e.target.checked) {
                // Enable hardware auth
                if (!hardwareAuthConfig.hasCredentials) {
                    // Need to register first
                    showHardwareAuthModal('register');
                } else {
                    hardwareAuthConfig.isEnabled = true;
                    updateHardwareAuthUI();
                }
            } else {
                // Disable hardware auth
                hardwareAuthConfig.isEnabled = false;
                updateHardwareAuthUI();
            }
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            showHardwareAuthModal('register');
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', async () => {
            if (confirm('Remove hardware authentication? You will need to re-register your authenticator to use this feature again.')) {
                try {
                    const result = await window.electronAPI.removeHardwareAuth();
                    if (result.success) {
                        hardwareAuthConfig = {
                            isEnabled: false,
                            hasCredentials: false,
                            credentialIds: []
                        };
                        updateHardwareAuthUI();
                        showNotification('Hardware Authentication', 'Authenticator removed successfully', 'success');
                    } else {
                        showNotification('Error', 'Failed to remove authenticator: ' + result.error, 'error');
                    }
                } catch (error) {
                    console.error('Error removing hardware auth:', error);
                    showNotification('Error', 'Failed to remove authenticator', 'error');
                }
            }
        });
    }
}

function showHardwareAuthModal(mode = 'register') {
    const modal = document.getElementById('hardwareAuthModal');
    const title = document.getElementById('hardwareAuthModalTitle');
    const content = document.getElementById('hardwareAuthContent');
    const startBtn = document.getElementById('startHardwareAuth');
    const cancelBtn = document.getElementById('cancelHardwareAuth');
    
    if (mode === 'register') {
        title.textContent = 'Register Hardware Authenticator';
        content.innerHTML = `
            <i class="fas fa-key"></i>
            <h3>Register Your Authenticator</h3>
            <p>Use your FIDO2 device (YubiKey, Touch ID, Windows Hello) to secure your encryption keys.</p>
            <div class="auth-progress hidden" id="authProgress">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Waiting for authenticator...</span>
            </div>
        `;
        startBtn.textContent = 'Register';
        startBtn.onclick = () => registerHardwareAuth();
    } else if (mode === 'authenticate') {
        title.textContent = 'Hardware Authentication';
        content.innerHTML = `
            <i class="fas fa-fingerprint"></i>
            <h3>Authenticate</h3>
            <p>Use your registered authenticator to unlock encryption.</p>
            <div class="auth-progress" id="authProgress">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Waiting for authenticator...</span>
            </div>
        `;
        startBtn.classList.add('hidden');
        // Auto-start authentication
        setTimeout(() => authenticateHardware(), 500);
    }
    
    cancelBtn.onclick = () => closeHardwareAuthModal();
    modal.classList.remove('hidden');
}

function closeHardwareAuthModal() {
    const modal = document.getElementById('hardwareAuthModal');
    modal.classList.add('hidden');
    
    // Reset checkbox if registration was cancelled
    const checkbox = document.getElementById('hardwareAuthEnabled');
    if (checkbox && !hardwareAuthConfig.hasCredentials) {
        checkbox.checked = false;
    }
}

async function registerHardwareAuth() {
    const progressDiv = document.getElementById('authProgress');
    const startBtn = document.getElementById('startHardwareAuth');
    
    try {
        // Check if WebAuthn is available
        if (!navigator.credentials || !navigator.credentials.create) {
            throw new Error('WebAuthn is not supported in this browser');
        }
        
        progressDiv.classList.remove('hidden');
        startBtn.disabled = true;
        
        // Generate challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        
        // Create credential options
        const publicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: "Maraikka",
                id: "localhost",
            },
            user: {
                id: crypto.getRandomValues(new Uint8Array(64)),
                name: "maraikka-user",
                displayName: "Maraikka User",
            },
            pubKeyCredParams: [
                {
                    alg: -7, // ES256
                    type: "public-key"
                },
                {
                    alg: -257, // RS256
                    type: "public-key"
                }
            ],
            authenticatorSelection: {
                authenticatorAttachment: "cross-platform", // Allow both platform and roaming authenticators
                userVerification: "preferred"
            },
            timeout: 60000,
            attestation: "direct"
        };
        
        // Create credential
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });
        
        if (credential) {
            // Convert challenge to base64 for storage
            const challengeBase64 = btoa(String.fromCharCode(...challenge));
            const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            
            // Save credential to backend
            const result = await window.electronAPI.saveHardwareAuthCredential(credentialId, challengeBase64);
            
            if (result.success) {
                hardwareAuthConfig = {
                    isEnabled: true,
                    hasCredentials: true,
                    credentialIds: [credentialId]
                };
                
                updateHardwareAuthUI();
                closeHardwareAuthModal();
                showNotification('Hardware Authentication', 'Authenticator registered successfully!', 'success');
            } else {
                throw new Error(result.error);
            }
        }
        
    } catch (error) {
        console.error('Hardware auth registration error:', error);
        progressDiv.classList.add('hidden');
        startBtn.disabled = false;
        
        let errorMessage = 'Failed to register authenticator';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Authentication was cancelled or not allowed';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'This authenticator is not supported';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showNotification('Registration Failed', errorMessage, 'error');
    }
}

async function authenticateHardware() {
    const progressDiv = document.getElementById('authProgress');
    
    try {
        if (!navigator.credentials || !navigator.credentials.get) {
            throw new Error('WebAuthn is not supported in this browser');
        }
        
        if (!hardwareAuthConfig.hasCredentials || hardwareAuthConfig.credentialIds.length === 0) {
            throw new Error('No registered authenticators found');
        }
        
        // Generate challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        
        // Convert credential IDs back to ArrayBuffer
        const allowCredentials = hardwareAuthConfig.credentialIds.map(id => ({
            id: Uint8Array.from(atob(id), c => c.charCodeAt(0)),
            type: 'public-key'
        }));
        
        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            allowCredentials: allowCredentials,
            timeout: 60000,
            userVerification: "preferred"
        };
        
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });
        
        if (assertion) {
            const challengeBase64 = btoa(String.fromCharCode(...challenge));
            const credentialId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
            
            // Verify with backend
            const result = await window.electronAPI.verifyHardwareAuth(challengeBase64, credentialId);
            
            if (result.success) {
                closeHardwareAuthModal();
                return result.masterKey;
            } else {
                throw new Error(result.error);
            }
        }
        
    } catch (error) {
        console.error('Hardware auth authentication error:', error);
        
        let errorMessage = 'Authentication failed';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Authentication was cancelled or not allowed';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'This authenticator is not supported';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        progressDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span style="color: #ef4444;">${errorMessage}</span>
        `;
        
        setTimeout(() => {
            closeHardwareAuthModal();
        }, 3000);
        
        throw error;
    }
}

async function isHardwareAuthEnabled() {
    try {
        const config = await window.electronAPI.loadHardwareAuthConfig();
        return config.success && config.isEnabled && config.hasCredentials;
    } catch (error) {
        console.error('Error checking hardware auth status:', error);
        return false;
    }
}

async function getAuthenticationMethod() {
    const isHardwareEnabled = await isHardwareAuthEnabled();
    
    if (isHardwareEnabled) {
        try {
            showHardwareAuthModal('authenticate');
            const masterKey = await authenticateHardware();
            return { method: 'hardware', key: masterKey };
        } catch (error) {
            console.error('Hardware auth failed, falling back to password:', error);
            // Fall back to password if hardware auth fails
        }
    }
    
    // Use password authentication
    return new Promise((resolve) => {
        const originalHandlePasswordConfirm = window.handlePasswordConfirm;
        
        window.handlePasswordConfirm = async () => {
            const password = document.getElementById('passwordInput').value;
            if (password) {
                closePasswordModal();
                resolve({ method: 'password', key: password });
                window.handlePasswordConfirm = originalHandlePasswordConfirm;
            }
        };
        
        showPasswordModal('encrypt');
    });
}

// Sidebar toggle functionality
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const appContainer = document.querySelector('.app-container');
    
    if (sidebarToggle && sidebar && appContainer) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            appContainer.classList.toggle('sidebar-collapsed');
            
            // Reset auto-hidden flag since user is manually controlling sidebar
            sidebarAutoHidden = false;
            
            // Save the state to localStorage
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
            
            console.log('Manual sidebar toggle - auto-hidden flag reset');
        });
    }
    
    // Restore sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
        appContainer.classList.add('sidebar-collapsed');
    }
}

// License Management
let currentLicense = null;
const LICENSE_SERVER_URL = 'http://localhost:3001';

// Banner Management
let activeBanners = [];
let dismissedBanners = new Set();

// Copy test key to license input
function copyToLicense(element) {
    const licenseKey = element.textContent;
    const licenseInput = document.getElementById('licenseKeyInput');
    if (licenseInput) {
        licenseInput.value = licenseKey;
        // Show a brief visual feedback
        element.style.backgroundColor = '#10b981';
        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 200);
    }
}

// Validate license key
async function validateLicenseKey() {
    const licenseInput = document.getElementById('licenseKeyInput');
    const validateBtn = document.getElementById('validateLicenseBtn');
    const statusIndicator = document.getElementById('licenseStatusIndicator');
    const statusText = document.getElementById('licenseStatusText');
    
    if (!licenseInput || !validateBtn) return;
    
    const licenseKey = licenseInput.value.trim();
    
    if (!licenseKey) {
        updateLicenseStatus(false, 'Please enter a license key');
        return;
    }
    
    // Show loading state
    validateBtn.disabled = true;
    validateBtn.textContent = 'Validating...';
    updateLicenseStatus(false, 'Validating license...');
    
    try {
        const response = await fetch(`${LICENSE_SERVER_URL}/api/validate-license`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ licenseKey })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentLicense = result.license;
            updateLicenseStatus(true, `Valid ${result.license.type} license`);
            updateFeatureStatus(result.license.features);
            saveLicenseToStorage(result.license);
            showNotification('License Validated', 'License key is valid and features have been unlocked!', 'success');
            // Refresh banners since user type changed
            await fetchBanners();
        } else {
            updateLicenseStatus(false, result.error || 'Invalid license key');
            updateFeatureStatus([]);
            currentLicense = null;
            clearLicenseFromStorage();
            // Refresh banners since user type changed
            await fetchBanners();
        }
        
    } catch (error) {
        console.error('License validation error:', error);
        updateLicenseStatus(false, 'Unable to validate license. Please check your connection.');
        updateFeatureStatus([]);
        currentLicense = null;
    } finally {
        validateBtn.disabled = false;
        validateBtn.textContent = 'Validate';
    }
}

// Update license status display
function updateLicenseStatus(isValid, message) {
    const statusIndicator = document.getElementById('licenseStatusIndicator');
    const statusText = document.getElementById('licenseStatusText');
    
    if (!statusIndicator || !statusText) return;
    
    const icon = statusIndicator.querySelector('i');
    
    if (isValid) {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#10b981';
        statusText.textContent = message;
    } else {
        icon.className = 'fas fa-times-circle';
        icon.style.color = '#ef4444';
        statusText.textContent = message;
    }
}

// Update feature status display
function updateFeatureStatus(features = []) {
    const featureElements = [
        { id: 'fidoFeature', feature: 'fido', status: 'fidoStatus' },
        { id: 'bulkFeature', feature: 'bulk', status: 'bulkStatus' },
        { id: 'cloudFeature', feature: 'cloud', status: 'cloudStatus' }
    ];
    
    featureElements.forEach(({ id, feature, status }) => {
        const statusElement = document.getElementById(status);
        if (!statusElement) return;
        
        const hasFeature = features.includes(feature);
        const icon = statusElement.querySelector('i');
        const span = statusElement.querySelector('span');
        
        if (hasFeature) {
            statusElement.classList.add('unlocked');
            icon.className = 'fas fa-unlock';
            span.textContent = 'Unlocked';
        } else {
            statusElement.classList.remove('unlocked');
            icon.className = 'fas fa-lock';
            icon.style.color = '#ef4444';
            span.textContent = 'Locked';
        }
    });
    
    // Update hardware authentication availability
    updateHardwareAuthAvailability(features.includes('fido'));
}

// Update hardware authentication availability
function updateHardwareAuthAvailability(isAvailable) {
    const hardwareAuthCheckbox = document.getElementById('hardwareAuthEnabled');
    const hardwareAuthStatus = document.getElementById('hardwareAuthStatus');
    
    if (hardwareAuthCheckbox) {
        hardwareAuthCheckbox.disabled = !isAvailable;
        
        if (!isAvailable) {
            hardwareAuthCheckbox.checked = false;
            if (hardwareAuthStatus) {
                hardwareAuthStatus.classList.add('hidden');
            }
        }
    }
}

// Save license to localStorage
function saveLicenseToStorage(license) {
    try {
        localStorage.setItem('maraikka_license', JSON.stringify(license));
    } catch (error) {
        console.error('Error saving license to storage:', error);
    }
}

// Clear license from localStorage
function clearLicenseFromStorage() {
    try {
        localStorage.removeItem('maraikka_license');
    } catch (error) {
        console.error('Error clearing license from storage:', error);
    }
}

// Load license from localStorage
function loadLicenseFromStorage() {
    try {
        const licenseData = localStorage.getItem('maraikka_license');
        if (licenseData) {
            const license = JSON.parse(licenseData);
            // Check if license is still valid (not expired)
            if (new Date(license.expiresAt) > new Date()) {
                currentLicense = license;
                
                // Update UI
                const licenseInput = document.getElementById('licenseKeyInput');
                if (licenseInput) {
                    licenseInput.value = license.key;
                }
                
                updateLicenseStatus(true, `Valid ${license.type} license`);
                updateFeatureStatus(license.features);
                return true;
            } else {
                // License expired, clear it
                clearLicenseFromStorage();
            }
        }
    } catch (error) {
        console.error('Error loading license from storage:', error);
        clearLicenseFromStorage();
    }
    return false;
}

// Check if feature is available
function hasFeature(feature) {
    return currentLicense && currentLicense.features && currentLicense.features.includes(feature);
}

// Setup license event listeners
function setupLicenseListeners() {
    const validateBtn = document.getElementById('validateLicenseBtn');
    const licenseInput = document.getElementById('licenseKeyInput');
    
    if (validateBtn) {
        validateBtn.addEventListener('click', validateLicenseKey);
    }
    
    if (licenseInput) {
        licenseInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                validateLicenseKey();
            }
        });
    }
    
    // Load saved license on startup
    loadLicenseFromStorage();
}

// Banner Management Functions

// Fetch banners from server
async function fetchBanners() {
    try {
        const userType = currentLicense ? 'premium' : 'free';
        const language = getCurrentLanguage();
        
        const response = await fetch(`${LICENSE_SERVER_URL}/api/banners?userType=${userType}&language=${language}`);
        const result = await response.json();
        
        if (result.success) {
            activeBanners = result.banners;
            displayBanners();
        } else {
            console.error('Failed to fetch banners:', result.error);
        }
    } catch (error) {
        console.error('Error fetching banners:', error);
    }
}

// Display banners in the UI
function displayBanners() {
    const bannerContainer = document.getElementById('bannerContainer');
    const appContainer = document.querySelector('.app-container');
    
    if (!bannerContainer || !appContainer) return;
    
    // Filter out dismissed banners
    const visibleBanners = activeBanners.filter(banner => !dismissedBanners.has(banner.id));
    
    if (visibleBanners.length === 0) {
        bannerContainer.classList.add('hidden');
        appContainer.classList.remove('has-banners');
        appContainer.style.setProperty('--banner-height', '0px');
        return;
    }
    
    // Clear existing banners
    bannerContainer.innerHTML = '';
    
    // Create banner elements
    visibleBanners.forEach(banner => {
        const bannerElement = createBannerElement(banner);
        bannerContainer.appendChild(bannerElement);
    });
    
    // Show banner container and adjust app layout
    bannerContainer.classList.remove('hidden');
    appContainer.classList.add('has-banners');
    
    // Calculate total banner height
    setTimeout(() => {
        const totalHeight = bannerContainer.offsetHeight;
        appContainer.style.setProperty('--banner-height', `${totalHeight}px`);
    }, 100);
}

// Create a banner element
function createBannerElement(banner) {
    const bannerDiv = document.createElement('div');
    bannerDiv.className = `banner ${banner.type}`;
    bannerDiv.setAttribute('data-banner-id', banner.id);
    
    // Get icon based on banner type
    const iconMap = {
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle',
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle'
    };
    
    bannerDiv.innerHTML = `
        <div class="banner-content">
            <i class="banner-icon ${iconMap[banner.type] || 'fas fa-info-circle'}"></i>
            <div class="banner-message">${banner.message}</div>
        </div>
        ${banner.dismissible ? `
            <button class="banner-close" onclick="dismissBanner('${banner.id}')">
                <i class="fas fa-times"></i>
            </button>
        ` : ''}
    `;
    
    return bannerDiv;
}

// Dismiss a banner
function dismissBanner(bannerId) {
    dismissedBanners.add(bannerId);
    saveDismissedBanners();
    displayBanners();
}

// Save dismissed banners to localStorage
function saveDismissedBanners() {
    try {
        localStorage.setItem('maraikka_dismissed_banners', JSON.stringify([...dismissedBanners]));
    } catch (error) {
        console.error('Error saving dismissed banners:', error);
    }
}

// Load dismissed banners from localStorage
function loadDismissedBanners() {
    try {
        const dismissed = localStorage.getItem('maraikka_dismissed_banners');
        if (dismissed) {
            dismissedBanners = new Set(JSON.parse(dismissed));
        }
    } catch (error) {
        console.error('Error loading dismissed banners:', error);
        dismissedBanners = new Set();
    }
}

// Get current language
function getCurrentLanguage() {
    return localStorage.getItem('maraikka_language') || 'en';
}

// Tooltip functionality for collapsed sidebar
function setupTooltips() {
    let currentTooltip = null;
    
    function createTooltip(text, isDisabled = false) {
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip ${isDisabled ? 'disabled' : ''}`;
        tooltip.textContent = isDisabled ? `${text} (Disabled)` : text;
        document.body.appendChild(tooltip);
        return tooltip;
    }
    
    function showTooltip(element, text, isDisabled = false) {
        // Remove any existing tooltip
        hideTooltip();
        
        // Only show tooltips when sidebar is collapsed
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar || !sidebar.classList.contains('collapsed')) {
            return;
        }
        
        currentTooltip = createTooltip(text, isDisabled);
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        currentTooltip.style.left = `${rect.right + 12}px`;
        currentTooltip.style.top = `${rect.top + rect.height / 2}px`;
        
        // Show tooltip with animation
        requestAnimationFrame(() => {
            currentTooltip.classList.add('show');
        });
    }
    
    function hideTooltip() {
        if (currentTooltip) {
            currentTooltip.remove();
            currentTooltip = null;
        }
    }
    
    // Setup event listeners for all nav menu items
    function attachTooltipListeners() {
        const menuItems = document.querySelectorAll('.nav-menu-item[data-tooltip]');
        
        menuItems.forEach(item => {
            const tooltipText = item.getAttribute('data-tooltip');
            const isDisabled = item.disabled;
            
            item.addEventListener('mouseenter', () => {
                showTooltip(item, tooltipText, isDisabled);
            });
            
            item.addEventListener('mouseleave', () => {
                hideTooltip();
            });
        });
    }
    
    // Initial setup
    attachTooltipListeners();
    
    // Re-attach listeners when sidebar state changes
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            setTimeout(attachTooltipListeners, 100); // Small delay for transition
        });
    }
    
    // Hide tooltip when scrolling or clicking elsewhere
    document.addEventListener('scroll', hideTooltip);
    document.addEventListener('click', hideTooltip);
}

// Setup density slider functionality
function setupDensitySlider() {
    const densitySlider = document.getElementById('densitySlider');
    const densityLabel = document.getElementById('densityLabel');
    const densityDescription = document.getElementById('densityDescription');
    const densitySteps = document.querySelectorAll('.density-step');
    
    if (!densitySlider) return;
    
    // Load saved density preference
    const savedDensity = localStorage.getItem('fileDensity') || '3';
    densitySlider.value = savedDensity;
    updateDensityDisplay(parseInt(savedDensity));
    applyDensity(parseInt(savedDensity));
    
    // Handle slider changes
    densitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        updateDensityDisplay(value);
        applyDensity(value);
        
        // Save preference
        localStorage.setItem('fileDensity', value.toString());
    });
    
    function updateDensityDisplay(value) {
        const labels = {
            1: { name: 'Very Spacious', description: 'Maximum spacing with large file cards' },
            2: { name: 'Spacious', description: 'Generous spacing for comfortable viewing' },
            3: { name: 'Balanced', description: 'Comfortable spacing for most users' },
            4: { name: 'Compact', description: 'Efficient use of space with smaller gaps' },
            5: { name: 'Dense', description: 'Maximum files visible with minimal spacing' }
        };
        
        const current = labels[value];
        densityLabel.textContent = current.name;
        densityDescription.textContent = current.description;
        
        // Update step indicators
        densitySteps.forEach((step, index) => {
            if (index + 1 <= value) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Update range background
        const percentage = ((value - 1) / 4) * 100;
        const gradient = `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${percentage}%, ${
            document.body.classList.contains('dark') ? '#4b5563' : '#e5e7eb'
        } ${percentage}%, ${
            document.body.classList.contains('dark') ? '#4b5563' : '#e5e7eb'
        } 100%)`;
        densitySlider.style.background = gradient;
    }
    
    function applyDensity(value) {
        const fileGrid = document.querySelector('.file-grid');
        if (!fileGrid) return;
        
        // Remove existing density classes
        fileGrid.classList.remove('density-1', 'density-2', 'density-3', 'density-4', 'density-5');
        
        // Add new density class
        fileGrid.classList.add(`density-${value}`);
    }
}

// Intelligent sidebar management for preview pane
function autoManageSidebarForPreview(isPreviewOpening) {
    const sidebar = document.querySelector('.sidebar');
    const isSidebarCollapsed = sidebar && sidebar.classList.contains('collapsed');
    
    if (isPreviewOpening) {
        // Preview is opening - collapse sidebar if it's not already collapsed
        if (!isSidebarCollapsed) {
            // Check if we should auto-collapse based on window width
            if (shouldAutoCollapseSidebar()) {
                sidebar.classList.add('collapsed');
                appContainer.classList.add('sidebar-collapsed');
                sidebarAutoHidden = true;
                
                console.log('Auto-collapsed sidebar for preview');
                
                // Don't save to localStorage - this is temporary auto-collapse
                // The user's manual preference remains intact
            }
        }
    } else {
        // Preview is closing - expand sidebar if it was auto-collapsed
        if (sidebarAutoHidden && isSidebarCollapsed) {
            sidebar.classList.remove('collapsed');
            appContainer.classList.remove('sidebar-collapsed');
            sidebarAutoHidden = false;
            
            console.log('Auto-expanded sidebar after preview closed');
            
            // Don't save to localStorage - restore to original state
        }
    }
}

// Determine if sidebar should be auto-collapsed based on available space
function shouldAutoCollapseSidebar() {
    // Auto-collapse if window width is less than a threshold where sidebar + content + preview becomes cramped
    const windowWidth = window.innerWidth;
    const sidebarWidth = 280; // Approximate sidebar width
    const previewWidth = 480; // Approximate preview width  
    const minContentWidth = 400; // Minimum space needed for file content
    
    return windowWidth < (sidebarWidth + minContentWidth + previewWidth + 100); // 100px buffer
}

// Handle window resize for sidebar auto-management
let resizeTimer;
function handleWindowResize() {
    // Debounce resize events to prevent excessive calls
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Only manage sidebar if preview is currently open
        if (!previewPane.classList.contains('hidden')) {
            const sidebar = document.querySelector('.sidebar');
            const isSidebarCollapsed = sidebar && sidebar.classList.contains('collapsed');
            
            if (shouldAutoCollapseSidebar()) {
                // Window is now small - collapse sidebar if not already collapsed and not manually set
                if (!isSidebarCollapsed && !sidebarAutoHidden) {
                    sidebar.classList.add('collapsed');
                    appContainer.classList.add('sidebar-collapsed');
                    sidebarAutoHidden = true;
                    console.log('Auto-collapsed sidebar due to window resize');
                }
            } else {
                // Window is now large enough - expand sidebar if it was auto-hidden
                if (sidebarAutoHidden && isSidebarCollapsed) {
                    sidebar.classList.remove('collapsed');
                    appContainer.classList.remove('sidebar-collapsed');
                    sidebarAutoHidden = false;  
                    console.log('Auto-expanded sidebar due to window resize');
                }
            }
        }
    }, 150); // 150ms debounce
}

// Add window resize listener
window.addEventListener('resize', handleWindowResize);

// Context menu state
let contextMenuTarget = null;
let contextMenuAnimating = false;
const contextMenu = document.getElementById('fileContextMenu');

// Initialize context menu
setupContextMenu();

// Context Menu Functionality
function setupContextMenu() {
    // Hide context menu on click outside or scroll
    document.addEventListener('click', hideContextMenu);
    document.addEventListener('scroll', hideContextMenu, true);
    
    // Handle context menu item clicks
    contextMenu.addEventListener('click', handleContextMenuClick);
    
    // Prevent context menu on context menu itself
    contextMenu.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

function showContextMenu(e, filePath, isEncrypted, isDirectory) {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent showing if already animating
    if (contextMenuAnimating) return;
    
    // Store target information
    contextMenuTarget = {
        filePath,
        isEncrypted,
        isDirectory
    };
    
    // Update menu items based on file type
    updateContextMenuItems();
    
    // Position and show context menu with animation
    positionContextMenu(e.clientX, e.clientY);
    
    // Remove hidden class and add show class for animation
    contextMenu.classList.remove('hidden', 'hide');
    
    // Trigger animation on next frame
    requestAnimationFrame(() => {
        contextMenuAnimating = true;
        contextMenu.classList.add('show');
        
        // Reset animation flag after animation completes
        setTimeout(() => {
            contextMenuAnimating = false;
        }, 150);
    });
}

function hideContextMenu() {
    if (contextMenu.classList.contains('hidden') || contextMenuAnimating) {
        return;
    }
    
    contextMenuAnimating = true;
    
    // Add hide class for exit animation
    contextMenu.classList.remove('show');
    contextMenu.classList.add('hide');
    
    // After animation completes, fully hide the menu
    setTimeout(() => {
        contextMenu.classList.add('hidden');
        contextMenu.classList.remove('hide');
        contextMenuTarget = null;
        contextMenuAnimating = false;
    }, 150);
}

function positionContextMenu(x, y) {
    const menuRect = contextMenu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Adjust position if menu would go off screen
    let left = x;
    let top = y;
    
    if (x + menuRect.width > windowWidth) {
        left = x - menuRect.width;
    }
    
    if (y + menuRect.height > windowHeight) {
        top = y - menuRect.height;
    }
    
    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;
}

function updateContextMenuItems() {
    if (!contextMenuTarget) return;
    
    const { filePath, isEncrypted, isDirectory } = contextMenuTarget;
    const previewItem = contextMenu.querySelector('[data-action="preview"]');
    const editItem = contextMenu.querySelector('[data-action="edit"]');
    const annotateItem = contextMenu.querySelector('[data-action="annotate"]');
    const encryptItem = contextMenu.querySelector('[data-action="encrypt"]');
    const decryptItem = contextMenu.querySelector('[data-action="decrypt"]');
    
    // Handle preview availability
    if (isDirectory) {
        previewItem.classList.add('disabled');
    } else {
        const canPreview = isPreviewableFile(filePath.split('/').pop()) || 
                          isPreviewableEncryptedFile(filePath.split('/').pop(), isEncrypted);
        
        if (canPreview) {
            previewItem.classList.remove('disabled');
        } else {
            previewItem.classList.add('disabled');
        }
    }
    
    // Handle edit availability for text files
    if (isDirectory) {
        editItem.classList.add('disabled');
    } else {
        const fileName = filePath.split('/').pop();
        let canEdit = false;
        
        if (isEncrypted) {
            // For encrypted files, check the original extension
            const originalName = fileName.replace(/\.enc$/, '');
            const ext = originalName.split('.').pop().toLowerCase();
            canEdit = isTextFile(ext);
        } else {
            // For regular files, check extension directly
            const ext = fileName.split('.').pop().toLowerCase();
            canEdit = isTextFile(ext);
        }
        
        if (canEdit) {
            editItem.classList.remove('disabled');
        } else {
            editItem.classList.add('disabled');
        }
    }
    
    // Handle annotate availability for image files (only non-encrypted for now)
    if (isDirectory || isEncrypted) {
        annotateItem.classList.add('disabled');
    } else {
        const fileName = filePath.split('/').pop();
        const ext = fileName.split('.').pop().toLowerCase();
        const canAnnotate = isImageFile(ext);
        
        if (canAnnotate) {
            annotateItem.classList.remove('disabled');
        } else {
            annotateItem.classList.add('disabled');
        }
    }
    
    // Encrypt/Decrypt are always available for files
    if (isDirectory) {
        encryptItem.classList.add('disabled');
        decryptItem.classList.add('disabled');
    } else {
        encryptItem.classList.remove('disabled');
        decryptItem.classList.remove('disabled');
    }
}

function handleContextMenuClick(e) {
    e.stopPropagation();
    
    const item = e.target.closest('.context-menu-item');
    if (!item || item.classList.contains('disabled') || !contextMenuTarget) {
        return;
    }
    
    const action = item.getAttribute('data-action');
    const { filePath, isEncrypted } = contextMenuTarget;
    
    // Hide context menu first
    hideContextMenu();
    
    // Execute the action
    switch (action) {
        case 'preview':
            previewFile(filePath, isEncrypted);
            break;
        case 'edit':
            openTextEditor(filePath, isEncrypted);
            break;
        case 'annotate':
            openImageEditor(filePath);
            break;
        case 'encrypt':
        case 'decrypt':
            showSingleFilePasswordModal(action, filePath);
            break;
        default:
            console.warn('Unknown context menu action:', action);
    }
}

// Text Editor Functionality - Window-based implementation

// Open text editor for a file in a new window
async function openTextEditor(filePath, isEncrypted) {
    console.log('Opening text editor window for:', filePath, 'Encrypted:', isEncrypted);
    
    try {
        const result = await window.electronAPI.openTextEditorWindow(filePath, isEncrypted);
        
        if (!result.success) {
            console.error('Failed to open text editor window:', result.error);
            showNotification('Error', 
                window.i18n ? window.i18n.t('editor.failedToOpen') : 'Failed to open text editor', 
                'error'
            );
        }
    } catch (error) {
        console.error('Error opening text editor window:', error);
        showNotification('Error', 
            window.i18n ? window.i18n.t('editor.failedToOpen') : 'Failed to open text editor', 
            'error'
        );
    }
}

// Image Editor Functionality - Window-based implementation

// Open image editor for a file in a new window
async function openImageEditor(filePath) {
    console.log('Opening image editor window for:', filePath);
    
    try {
        const result = await window.electronAPI.openImageEditorWindow(filePath);
        
        if (!result.success) {
            console.error('Failed to open image editor window:', result.error);
            showNotification('Error', 
                window.i18n ? window.i18n.t('editor.failedToOpenImage') : 'Failed to open image editor', 
                'error'
            );
        }
    } catch (error) {
        console.error('Error opening image editor window:', error);
        showNotification('Error', 
            window.i18n ? window.i18n.t('editor.failedToOpenImage') : 'Failed to open image editor', 
            'error'
        );
    }
}

// Update notification handling
function initializeUpdateSystem() {
    // Listen for update events
    window.electronAPI.onUpdateAvailable((event, info) => {
        showUpdateNotification('available', info);
    });

    window.electronAPI.onUpdateDownloadProgress((event, progress) => {
        updateDownloadProgress(progress);
    });

    window.electronAPI.onUpdateDownloaded((event, info) => {
        showUpdateNotification('downloaded', info);
    });

    window.electronAPI.onUpdateError((event, error) => {
        showUpdateNotification('error', { error });
    });
}

function showUpdateNotification(type, data) {
    const existingNotification = document.querySelector('.update-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'update-notification';
    
    switch (type) {
        case 'available':
            notification.innerHTML = `
                <div class="update-content">
                    <div class="update-icon">🔄</div>
                    <div class="update-text">
                        <h4>Update Available</h4>
                        <p>Maraikka ${data.version} is ready to download</p>
                    </div>
                    <div class="update-actions">
                        <button class="btn btn-primary" onclick="downloadUpdate()">Download</button>
                        <button class="btn btn-secondary" onclick="dismissUpdate()">Later</button>
                    </div>
                </div>
            `;
            break;
            
        case 'downloaded':
            notification.innerHTML = `
                <div class="update-content">
                    <div class="update-icon">✅</div>
                    <div class="update-text">
                        <h4>Update Ready</h4>
                        <p>Maraikka ${data.version} has been downloaded</p>
                    </div>
                    <div class="update-actions">
                        <button class="btn btn-primary" onclick="installUpdate()">Restart & Install</button>
                        <button class="btn btn-secondary" onclick="dismissUpdate()">Later</button>
                    </div>
                </div>
            `;
            break;
            
        case 'error':
            notification.innerHTML = `
                <div class="update-content">
                    <div class="update-icon">❌</div>
                    <div class="update-text">
                        <h4>Update Error</h4>
                        <p>Failed to check for updates: ${data.error}</p>
                    </div>
                    <div class="update-actions">
                        <button class="btn btn-secondary" onclick="dismissUpdate()">Dismiss</button>
                    </div>
                </div>
            `;
            break;
    }
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 10 seconds for error notifications
    if (type === 'error') {
        setTimeout(() => {
            dismissUpdate();
        }, 10000);
    }
}

function updateDownloadProgress(progress) {
    const notification = document.querySelector('.update-notification');
    if (notification) {
        const progressBar = notification.querySelector('.progress-bar');
        if (!progressBar) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            progressContainer.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.percent}%"></div>
                </div>
                <div class="progress-text">${progress.percent}% downloaded</div>
            `;
            notification.querySelector('.update-text').appendChild(progressContainer);
        } else {
            const fill = progressBar.querySelector('.progress-fill');
            const text = notification.querySelector('.progress-text');
            fill.style.width = `${progress.percent}%`;
            text.textContent = `${progress.percent}% downloaded`;
        }
    }
}

async function downloadUpdate() {
    try {
        await window.electronAPI.downloadUpdate();
        // Update UI will be handled by the download progress events
    } catch (error) {
        showUpdateNotification('error', { error: error.message });
    }
}

async function installUpdate() {
    try {
        await window.electronAPI.installUpdate();
        // App will restart automatically
    } catch (error) {
        showUpdateNotification('error', { error: error.message });
    }
}

function dismissUpdate() {
    const notification = document.querySelector('.update-notification');
    if (notification) {
        notification.remove();
    }
}

// Manual update check function
async function checkForUpdates() {
    try {
        await window.electronAPI.checkForUpdates();
    } catch (error) {
        showUpdateNotification('error', { error: error.message });
    }
}

// Initialize update system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeUpdateSystem();
});



