// // Get the create -file form from the page
// const fileForm = document.getElementById('fileForm');
// //Get the message element for succes and error text.
// const message = document.getElementById('message');

// //Handle the Create File form without reloading the page
// fileForm.addEventListener('submit', async event => {
//     // Prevent the browser's normal form submission.
//     event.preventDefault();
//     //Read the user's filename.
//     const filename = document.getElementById('filename').value.trim();
//     //Read the user's file content.
//     const content = document.getElementById('content').value;
//     //Send the new file to the backend as JSON(java script object notation).
//     const response = await fetch('/api/files', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json'},
//         body: JSON.stringify({ filename, content })
//     });
//     //convert the server response into an object.
//     const data = await response.json();
//     //Display success or error text.
//     MessageChannel.textContent = data.message || data.error;
//     // clear the form and refresh the list after success
//     if(response.ok) { fileForm.reset();

//     }
// });

const filenameInput=document.getElementById("filename");
const filecontentInput=document.getElementById("content");
console.log("hello");
const messageInput=document.getElementById("message");

async function createFile(){
    const fileName=filenameInput.value.trim();
    const filecontent=filecontentInput.value;
    
    // Validate filename
    if (!fileName) {
        const modal = createModal('Error', '<p style="color: #dc3545;">Please enter a filename</p>');
        showModal(modal);
        setTimeout(() => hideModal(modal), 2000);
        return;
    }
    
    // Validate filename for path traversal
    if (fileName.includes("..") || fileName.startsWith("/") || fileName.includes("\\")) {
        const modal = createModal('Error', '<p style="color: #dc3545;">Invalid filename</p>');
        showModal(modal);
        setTimeout(() => hideModal(modal), 2000);
        return;
    }
    
    console.log(fileName,filecontent);
   const response=await fetch("/api/createFile",{
       method:"POST",
       headers:{
           "content-type":"application/json"
       },
       body:JSON.stringify({fileName:fileName,filecontent:filecontent})
   })

   const data= await response.json();
   console.log(data);
   
    if (response.ok) {
        const modal = createModal('Success', `<p style="color: #28a745;">${data.message || 'File created successfully!'}</p>`);
        showModal(modal);
        setTimeout(() => {
            hideModal(modal);
            filenameInput.value = "";
            filecontentInput.value = "";
            messageInput.textContent = '';
            // Refresh file list after successful creation
            getFiles();
        }, 2000);
    } else {
        const modal = createModal('Error', `<p style="color: #dc3545;">${data.message || 'Failed to create file'}</p>`);
        showModal(modal);
        setTimeout(() => hideModal(modal), 2000);
    }
}

// MY FILES FUNCTIONALITY
async function getFiles() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '<li>Loading files...</li>';
    
    try {
        const response = await fetch('/api/files');
        const data = await response.json();
        
        if (!response.ok) {
            messageInput.textContent = data.error || 'Failed to fetch files';
            messageInput.style.color = '#dc3545';
            throw new Error(data.error || 'Failed to fetch files');
        }
        
        if (data.files.length === 0) {
            fileList.innerHTML = '<li class="empty-state">No files found. Create your first file!</li>';
            return;
        }
        
        fileList.innerHTML = '';
        data.files.forEach(file => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.padding = '10px';
            li.style.borderBottom = '1px solid #eee';
            
            // File info
            const infoDiv = document.createElement('div');
            infoDiv.style.flex = '1';
            infoDiv.style.minWidth = '0';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = file.name;
            nameSpan.style.fontWeight = 'bold';
            nameSpan.style.display = 'block';
            
            const detailsSpan = document.createElement('span');
            detailsSpan.textContent = `Size: ${formatBytes(file.size)} • Modified: ${new Date(file.modified).toLocaleString()}`;
            detailsSpan.style.fontSize = '0.9em';
            detailsSpan.style.color = '#666';
            detailsSpan.style.display = 'block';
            
            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(detailsSpan);
            
            // Buttons container
            const buttonsDiv = document.createElement('div');
            buttonsDiv.style.display = 'flex';
            buttonsDiv.style.gap = '5px';
            
            // Read button
            const readBtn = document.createElement('button');
            readBtn.textContent = 'Read';
            readBtn.style.padding = '5px 10px';
            readBtn.style.backgroundColor = '#007bff';
            readBtn.style.color = 'white';
            readBtn.style.border = 'none';
            readBtn.style.borderRadius = '3px';
            readBtn.style.cursor = 'pointer';
            readBtn.onclick = () => readFile(file.name);
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.padding = '5px 10px';
            deleteBtn.style.backgroundColor = '#dc3545';
            deleteBtn.style.color = 'white';
            deleteBtn.style.border = 'none';
            deleteBtn.style.borderRadius = '3px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.onclick = () => deleteFile(file.name);
            
            buttonsDiv.appendChild(readBtn);
            buttonsDiv.appendChild(deleteBtn);
            
            li.appendChild(infoDiv);
            li.appendChild(buttonsDiv);
            fileList.appendChild(li);
        });
    } catch (error) {
        showToast('Error fetching files: ' + error.message, 'error');
        fileList.innerHTML = `<li>Error: ${error.message}</li>`;
        console.error('Error fetching files:', error);
    }
}

// Format bytes to human readable format
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Read file functionality
async function readFile(filename) {
    // Show loading modal
    const modal = createModal(`Reading ${filename}...`, '');
    showModal(modal);
    
    try {
        const response = await fetch(`/api/files/${encodeURIComponent(filename)}`);
        const data = await response.json();
        
        if (!response.ok) {
            messageInput.textContent = data.error || 'Failed to read file';
            messageInput.style.color = '#dc3545';
            throw new Error(data.error || 'Failed to read file');
        }
        
        // Update modal with file content
        const contentDiv = document.createElement('div');
        contentDiv.style.marginTop = '10px';
        contentDiv.style.maxHeight = '400px';
        contentDiv.style.overflowY = 'auto';
        contentDiv.style.border = '1px solid #ddd';
        contentDiv.style.padding = '10px';
        contentDiv.style.backgroundColor = '#f8f9fa';
        
        // Check if content appears to be binary (contains null byte)
        if (data.content.includes('\u0000')) {
            // Likely a binary file
            const infoDiv = document.createElement('div');
            infoDiv.style.textAlign = 'center';
            infoDiv.style.padding = '40px';
            infoDiv.style.color = '#666';
            
            const iconDiv = document.createElement('div');
            iconDiv.style.fontSize = '48px';
            iconDiv.style.marginBottom = '20px';
            iconDiv.textContent = '📄';
            
            const messageDiv = document.createElement('div');
            messageDiv.textContent = 'This appears to be a binary file';
            messageDiv.style.fontSize = '18px';
            messageDiv.style.fontWeight = 'bold';
            messageDiv.style.marginBottom = '10px';
            
            const detailDiv = document.createElement('div');
            detailDiv.textContent = 'Contents cannot be displayed as text';
            detailDiv.style.fontSize = '14px';
            
            infoDiv.appendChild(iconDiv);
            infoDiv.appendChild(messageDiv);
            infoDiv.appendChild(detailDiv);
            
            contentDiv.appendChild(infoDiv);
        } else {
            // For text content, preserve formatting
            const pre = document.createElement('pre');
            pre.textContent = data.content;
            pre.style.whiteSpace = 'pre-wrap';
            pre.style.wordWrap = 'break-word';
            
            contentDiv.appendChild(pre);
        }
        
        modal.querySelector('.modal-body').innerHTML = ''; // Clear loading
        modal.querySelector('.modal-body').appendChild(contentDiv);
        
        // Show success notification
        messageInput.textContent = 'File read successfully!';
        messageInput.style.color = '#28a745';
        
    } catch (error) {
        modal.querySelector('.modal-body').innerHTML = `<p>Error: ${error.message}</p>`;
        messageInput.textContent = 'Error reading file: ' + error.message;
        messageInput.style.color = '#dc3545';
        console.error('Error reading file:', error);
    }
}

// Delete file functionality
async function deleteFile(filename) {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (!response.ok) {
            messageInput.textContent = data.error || 'Failed to delete file';
            messageInput.style.color = '#dc3545';
            throw new Error(data.error || 'Failed to delete file');
        }
        
        // Show success message
        messageInput.textContent = 'File deleted successfully!';
        messageInput.style.color = '#28a745';
        // Refresh file list
        getFiles();
    } catch (error) {
        messageInput.textContent = 'Error deleting file: ' + error.message;
        messageInput.style.color = '#dc3545';
        console.error('Error deleting file:', error);
    }
}

// SYSTEM INFORMATION FUNCTIONALITY
async function getSystemInfo() {
    const systemInfoElem = document.getElementById('systemInfo');
    systemInfoElem.innerHTML = '<p>Loading system information...</p>';
    
    try {
        const response = await fetch('/api/system-info');
        const data = await response.json();
        
        if (!response.ok) {
            systemInfoElem.innerHTML = `<p style="color: #dc3545;">Error: ${data.error || 'Failed to fetch system info'}</p>`;
            return;
        }
        
        // Build HTML content for system information
        let html = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px;">
            
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; background: #f8f9fa;">
                    <h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Operating System</h3>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Name:</span><span>${data.os.name}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Platform:</span><span>${data.os.platform}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Version:</span><span>${data.os.version}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Release:</span><span>${data.os.release}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Architecture:</span><span>${data.os.architecture}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Hostname:</span><span>${data.os.hostname}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Uptime:</span><span>${formatUptime(data.os.uptime)}</span></div>
                </div>
                
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; background: #f8f9fa;">
                    <h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">CPU Information</h3>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Model:</span><span>${data.cpu.model}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Cores:</span><span>${data.cpu.cores}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Speed:</span><span>${data.cpu.speed ? data.cpu.speed + ' MHz' : 'Unknown'}</span></div>
                </div>
                
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; background: #f8f9fa;">
                    <h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Memory Information</h3>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Total:</span><span>${data.memory.formatted.total}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Used:</span><span>${data.memory.formatted.used}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Free:</span><span>${data.memory.formatted.free}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Usage:</span><span>${data.memory.formatted.usagePercent}</span></div>
                </div>
                
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; background: #f8f9fa;">
                    <h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Node.js Runtime</h3>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Version:</span><span>${data.node.version}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">V8 Engine:</span><span>${data.node.v8}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Platform:</span><span>${data.node.platform}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Architecture:</span><span>${data.node.architecture}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Process Uptime:</span><span>${formatUptime(data.node.uptime)}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Memory Usage:</span><span>${formatBytes(data.node.memoryUsage.heapUsed)} / ${formatBytes(data.node.memoryUsage.heapTotal)}</span></div>
                </div>
                
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; background: #f8f9fa;">
                    <h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Application Information</h3>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Port:</span><span>${data.app.port}</span></div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">Working Directory:</span><span>${data.app.cwd}</span></div>
                </div>
                
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; background: #f8f9fa;">
                    <h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Network Interfaces</h3>
                    ${Object.keys(data.network).map(iface => `
                        <div style="display: flex; justify-content: space-between; padding: 5px 0;"><span style="font-weight: bold; width: 120px;">${iface}:</span><span>${data.network[iface].join(', ')}</span></div>
                    `).join('')}
                </div>
                
            </div>
            
            <button onclick="getSystemInfo()" style="margin-top: 15px; padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">Refresh</button>
        `;
        
        systemInfoElem.innerHTML = html;
        messageInput.textContent = 'System information loaded successfully!';
        messageInput.style.color = '#28a745';
        
    } catch (error) {
        systemInfoElem.innerHTML = `<p style="color: #dc3545;">Error: ${error.message}</p>`;
        messageInput.textContent = 'Error fetching system info: ' + error.message;
        messageInput.style.color = '#dc3545';
        console.error('Error fetching system info:', error);
    }
}

// Helper function to create info section
function createInfoSection(title, dataRows) {
    const section = document.createElement('div');
    section.style.border = '1px solid #ddd';
    section.style.borderRadius = '5px';
    section.style.padding = '15px';
    section.style.backgroundColor = '#f8f9fa';
    
    const titleElem = document.createElement('h3');
    titleElem.textContent = title;
    titleElem.style.marginTop = '0';
    titleElem.style.borderBottom = '1px solid #eee';
    titleElem.style.paddingBottom = '10px';
    
    const content = document.createElement('div');
    dataRows.forEach(([label, value], index) => {
        if (index % 2 === 0 && index > 0) {
            // Add separator every 2 rows for readability
            const sep = document.createElement('div');
            sep.style.height = '10px';
            content.appendChild(sep);
        }
        
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.padding = '5px 0';
        
        const labelElem = document.createElement('span');
        labelElem.textContent = label;
        labelElem.style.fontWeight = 'bold';
        labelElem.style.width = '120px';
        labelElem.style.display = 'inline-block';
        
        const valueElem = document.createElement('span');
        valueElem.textContent = value;
        valueElem.style.flex = '1';
        
        row.appendChild(labelElem);
        row.appendChild(valueElem);
        content.appendChild(row);
    });
    
    section.appendChild(titleElem);
    section.appendChild(content);
    return section;
}

// Helper function to format uptime
function formatUptime(seconds) {
    if (seconds < 60) return `${Math.floor(seconds)} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
}

// Modal creation and management
function createModal(title, content) {
    // Remove any existing modals
    const existingModal = document.querySelector('.modal-backdrop');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
    backdrop.style.display = 'flex';
    backdrop.style.justifyContent = 'center';
    backdrop.style.alignItems = 'center';
    backdrop.style.zIndex = '1000';
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.backgroundColor = 'white';
    modal.style.borderRadius = '10px';
    modal.style.width = '90%';
    modal.style.maxWidth = '500px';
    modal.style.maxHeight = '90vh';
    modal.style.overflowY = 'auto';
    modal.style.position = 'relative';
    
    // Create header
    const header = document.createElement('div');
    header.style.padding = '15px 20px';
    header.style.borderBottom = '1px solid #eee';
    
    const titleElem = document.createElement('h3');
    titleElem.textContent = title;
    titleElem.style.margin = '0';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '15px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => hideModal(modal);
    
    header.appendChild(titleElem);
    header.appendChild(closeBtn);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.style.padding = '20px';
    if (content) {
        body.innerHTML = content;
    }
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    backdrop.appendChild(modal);
    
    // Add to document
    document.body.appendChild(backdrop);
    
    return modal;
}

function showModal(modal) {
    const backdrop = modal.parentElement;
    if (backdrop) {
        backdrop.style.display = 'flex';
    }
}

function hideModal(modal) {
    const backdrop = modal.parentElement;
    if (backdrop) {
        backdrop.remove();
    }
}

// Close modal when clicking outside content
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        hideModal(e.target.querySelector('.modal'));
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal');
        if (modal) {
            hideModal(modal);
        }
    }
});