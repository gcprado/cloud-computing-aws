let API_URL = '';
let CONFIG = null;

function updateApiSourceLabel(labelText) {
  const label = document.getElementById('api-source-label');
  if (!label) return;
  label.textContent = `Active API: ${labelText}`;
}

function showSnackbar(message, type = 'info') {
  const snackbar = document.getElementById('snackbar');
  if (!snackbar) return;
  
  snackbar.textContent = message;
  snackbar.className = `snackbar ${type} show`;
  
  setTimeout(() => {
    snackbar.className = snackbar.className.replace('show', '');
  }, 3000);
}

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
      showSnackbar('Custom API URL set', 'success');
      updateApiSourceLabel('Manual URL');
      loadItems();
    } else {
      showSnackbar('Please enter an API URL', 'error');
    }
    return;
  }
  
  // Lambda or ECS from config
  if (!CONFIG) {
    showSnackbar('Configuration not loaded yet', 'error');
    return;
  }
  
  if (selectedOption === 'lambda') {
    if (CONFIG.api.lambda && CONFIG.api.lambda !== '') {
      API_URL = CONFIG.api.lambda;
      showSnackbar('Lambda API connected', 'success');
      updateApiSourceLabel('Lambda (from config)');
      loadItems();
    } else {
      showSnackbar('Lambda API not deployed', 'error');
    }
    return;
  }
  
  if (selectedOption === 'ecs') {
    if (CONFIG.api.ecs && CONFIG.api.ecs !== '') {
      API_URL = CONFIG.api.ecs;
      showSnackbar('ECS API connected', 'success');
      updateApiSourceLabel('ECS (from config)');
      loadItems();
    } else {
      showSnackbar('ECS API not deployed', 'error');
    }
    return;
  }
  
  if (selectedOption === '') {
    showSnackbar('Please select an API source', 'error');
  }
}

async function testHealth() {
  if (!API_URL) {
    showSnackbar('Please set an API URL first', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.data && data.data.status === 'OK') {
      showSnackbar('API is healthy!', 'success');
    } else {
      showSnackbar('API responded but health check failed', 'error');
    }
  } catch (error) {
    showSnackbar('Health check failed: Unable to connect', 'error');
  }
}

async function loadItems() {
  if (!API_URL) {
    showSnackbar('Please set an API URL first', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/items`);
    
    if (!response.ok) {
      showSnackbar('Failed to load items from API', 'error');
      displayItems([]);
      return;
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      showSnackbar('Invalid API response. Check your API URL.', 'error');
      displayItems([]);
      return;
    }
    
    const data = await response.json();
    displayItems(data.data || []);
  } catch (error) {
    showSnackbar('Error loading items. Check API connection.', 'error');
    displayItems([]);
  }
}

function displayItems(items) {
  const container = document.getElementById('items-container');
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No items found</p>
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
        <button class="btn-edit" onclick='openEditModal(${JSON.stringify(item)})'>Edit</button>
        <button class="btn-delete" onclick='openDeleteModal(${JSON.stringify(item)})'>Delete</button>
      </div>
    </div>
  `).join('');
}

async function createItem(event) {
  event.preventDefault();
  
  if (!API_URL) {
    showSnackbar('Please set an API URL first', 'error');
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
    
    showSnackbar('Item created successfully!', 'success');
    document.getElementById('create-form').reset();
    document.getElementById('item-id').value = generateUUID();
    loadItems();
  } catch (error) {
    showSnackbar('Error creating item', 'error');
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
    showSnackbar('Please set an API URL first', 'error');
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
    
    showSnackbar('Item updated successfully!', 'success');
    closeEditModal();
    loadItems();
  } catch (error) {
    showSnackbar('Error updating item', 'error');
  }
}

let deleteItemId = null;
let deleteItemName = null;

function openDeleteModal(item) {
  deleteItemId = item.id;
  deleteItemName = item.name;
  
  const modal = document.getElementById('delete-modal');
  const preview = document.getElementById('delete-item-preview');
  
  preview.textContent = `${item.name} (ID: ${item.id})`;
  modal.style.display = 'block';
}

function closeDeleteModal() {
  const modal = document.getElementById('delete-modal');
  modal.style.display = 'none';
  deleteItemId = null;
  deleteItemName = null;
}

async function confirmDelete() {
  if (!deleteItemId) return;
  
  try {
    const response = await fetch(`${API_URL}/items/${deleteItemId}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete item');
    }
    
    showSnackbar('Item deleted successfully!', 'success');
    closeDeleteModal();
    loadItems();
  } catch (error) {
    showSnackbar('Error deleting item', 'error');
    closeDeleteModal();
  }
}

window.onclick = function(event) {
  const editModal = document.getElementById('edit-modal');
  const deleteModal = document.getElementById('delete-modal');
  
  if (event.target === editModal) {
    closeEditModal();
  }
  if (event.target === deleteModal) {
    closeDeleteModal();
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
