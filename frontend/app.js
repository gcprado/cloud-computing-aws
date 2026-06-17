let API_URL = '';
let CONFIG = null;

// Load configuration on page load
async function loadConfig() {
  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      CONFIG = await response.json();
      console.log('Configuration loaded:', CONFIG);
    } else {
      console.warn('config.json not found, using manual mode only');
      CONFIG = { api: { lambda: '', ecs: '' } };
    }
  } catch (error) {
    console.warn('Failed to load config.json:', error.message);
    CONFIG = { api: { lambda: '', ecs: '' } };
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function updateUrlField() {
  const select = document.getElementById('api-select');
  const urlInput = document.getElementById('custom-api-url');
  const selectedOption = select.value;
  
  if (!CONFIG) return;
  
  if (selectedOption === 'lambda') {
    if (CONFIG.api.lambda && CONFIG.api.lambda !== '') {
      urlInput.value = CONFIG.api.lambda;
      urlInput.disabled = true;
      urlInput.style.backgroundColor = '#f5f5f5';
    } else {
      urlInput.value = 'Lambda not deployed';
      urlInput.disabled = true;
      urlInput.style.backgroundColor = '#ffebee';
    }
  } else if (selectedOption === 'ecs') {
    if (CONFIG.api.ecs && CONFIG.api.ecs !== '') {
      urlInput.value = CONFIG.api.ecs;
      urlInput.disabled = true;
      urlInput.style.backgroundColor = '#f5f5f5';
    } else {
      urlInput.value = 'ECS not deployed';
      urlInput.disabled = true;
      urlInput.style.backgroundColor = '#ffebee';
    }
  } else if (selectedOption === 'manual') {
    urlInput.value = '';
    urlInput.disabled = false;
    urlInput.style.backgroundColor = '';
    urlInput.placeholder = 'Enter custom API URL';
  } else {
    urlInput.value = '';
    urlInput.disabled = true;
    urlInput.style.backgroundColor = '#f5f5f5';
    urlInput.placeholder = 'Select an API source first';
  }
}

function setApiUrl() {
  const select = document.getElementById('api-select');
  const customUrl = document.getElementById('custom-api-url').value.trim();
  const selectedOption = select.value;
  
  // Manual API input
  if (selectedOption === 'manual') {
    if (customUrl) {
      API_URL = customUrl.replace(/\/$/, '');
      showStatus(`Custom API URL set: ${API_URL}`, 'success');
      loadItems();
    } else {
      showStatus('Please enter an API URL in the text field', 'error');
    }
    return;
  }
  
  // Lambda or ECS from config
  if (!CONFIG) {
    showStatus('Configuration not loaded yet, please wait...', 'error');
    return;
  }
  
  if (selectedOption === 'lambda') {
    if (CONFIG.api.lambda && CONFIG.api.lambda !== '') {
      API_URL = CONFIG.api.lambda;
      showStatus(`Lambda API set: ${API_URL}`, 'success');
      loadItems();
    } else {
      showStatus('Lambda API not deployed yet. Deploy it first using: ./infra-script.sh deploy lambda', 'error');
    }
    return;
  }
  
  if (selectedOption === 'ecs') {
    if (CONFIG.api.ecs && CONFIG.api.ecs !== '') {
      API_URL = CONFIG.api.ecs;
      showStatus(`ECS API set: ${API_URL}`, 'success');
      loadItems();
    } else {
      showStatus('ECS API not deployed yet. Deploy it first using: ./infra-script.sh deploy ecs', 'error');
    }
    return;
  }
  
  if (selectedOption === '') {
    showStatus('Please select an API source', 'error');
  }
}

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  setTimeout(() => {
    statusDiv.className = 'status';
  }, 5000);
}

async function testHealth() {
  if (!API_URL) {
    showStatus('Please set an API URL first', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.data && data.data.status === 'OK') {
      showStatus('✅ API is healthy!', 'success');
    } else {
      showStatus('⚠️ API responded but health check failed', 'error');
    }
  } catch (error) {
    showStatus(`❌ Health check failed: ${error.message}`, 'error');
  }
}

async function loadItems() {
  if (!API_URL) {
    showStatus('Please set an API URL first', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/items`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load items');
    }
    
    displayItems(data.data || []);
    showStatus(`Loaded ${data.data.length} items`, 'success');
  } catch (error) {
    showStatus(`Error loading items: ${error.message}`, 'error');
    displayItems([]);
  }
}

function displayItems(items) {
  const container = document.getElementById('items-container');
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>📭 No items found</p>
        <p>Create your first item using the form</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = items.map(item => `
    <div class="item-card">
      <div class="item-header">
        <span class="item-name">${item.name || 'Unnamed'}</span>
        <span class="item-quantity">Qty: ${item.quantity || 0}</span>
      </div>
      <div class="item-details">
        <strong>ID:</strong> <span class="item-id">${item.id}</span>
      </div>
      ${item.description ? `<div class="item-details"><strong>Description:</strong> ${item.description}</div>` : ''}
      ${item.category ? `<div class="item-details"><strong>Category:</strong> ${item.category}</div>` : ''}
      ${item.unit_value ? `<div class="item-details"><strong>Unit Value:</strong> $${item.unit_value}</div>` : ''}
      <div class="item-actions">
        <button class="btn-edit" onclick='openEditModal(${JSON.stringify(item)})'>✏️ Edit</button>
        <button class="btn-delete" onclick="deleteItem('${item.id}')">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

async function createItem(event) {
  event.preventDefault();
  
  if (!API_URL) {
    showStatus('Please set an API URL first', 'error');
    return;
  }
  
  const item = {
    id: document.getElementById('item-id').value.trim() || generateUUID(),
    name: document.getElementById('item-name').value.trim(),
    quantity: parseInt(document.getElementById('item-quantity').value),
    description: document.getElementById('item-description').value.trim(),
    category: document.getElementById('item-category').value.trim(),
    unit_value: parseFloat(document.getElementById('item-unit-value').value) || undefined
  };
  
  try {
    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create item');
    }
    
    showStatus('✅ Item created successfully!', 'success');
    document.getElementById('create-form').reset();
    loadItems();
  } catch (error) {
    showStatus(`❌ Error creating item: ${error.message}`, 'error');
  }
}

function openEditModal(item) {
  document.getElementById('edit-id').value = item.id;
  document.getElementById('edit-name').value = item.name || '';
  document.getElementById('edit-quantity').value = item.quantity || 0;
  document.getElementById('edit-description').value = item.description || '';
  document.getElementById('edit-category').value = item.category || '';
  document.getElementById('edit-unit-value').value = item.unit_value || '';
  
  document.getElementById('edit-modal').style.display = 'block';
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

async function updateItem(event) {
  event.preventDefault();
  
  if (!API_URL) {
    showStatus('Please set an API URL first', 'error');
    return;
  }
  
  const id = document.getElementById('edit-id').value;
  const updates = {
    name: document.getElementById('edit-name').value.trim(),
    quantity: parseInt(document.getElementById('edit-quantity').value),
    description: document.getElementById('edit-description').value.trim() || undefined,
    category: document.getElementById('edit-category').value.trim() || undefined,
    unit_value: parseFloat(document.getElementById('edit-unit-value').value) || undefined
  };
  
  try {
    const response = await fetch(`${API_URL}/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update item');
    }
    
    showStatus('✅ Item updated successfully!', 'success');
    closeEditModal();
    loadItems();
  } catch (error) {
    showStatus(`❌ Error updating item: ${error.message}`, 'error');
  }
}

async function deleteItem(id) {
  if (!confirm(`Are you sure you want to delete item ${id}?`)) {
    return;
  }
  
  if (!API_URL) {
    showStatus('Please set an API URL first', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/items/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete item');
    }
    
    showStatus('✅ Item deleted successfully!', 'success');
    loadItems();
  } catch (error) {
    showStatus(`❌ Error deleting item: ${error.message}`, 'error');
  }
}

window.onclick = function(event) {
  const modal = document.getElementById('edit-modal');
  if (event.target === modal) {
    closeEditModal();
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadConfig();
  document.getElementById('item-id').value = generateUUID();
  
  // Add event listener to update URL field when selection changes
  const apiSelect = document.getElementById('api-select');
  apiSelect.addEventListener('change', updateUrlField);
  
  // Initialize URL field state
  updateUrlField();
});
