// src/js/widgets/shortcut.js

// Helper to create a single shortcut item element
function createShortcutElement(shortcut, id, updateWidgetContent, getShortcuts, listElement) {
    const li = document.createElement('li');
    li.classList.add('shortcut-item');

    const link = document.createElement('a');
    link.href = shortcut.url;
    link.textContent = shortcut.title;
    link.target = '_blank'; // Open in new tab
    link.title = shortcut.url; // Show URL on hover
    link.classList.add('shortcut-link');

    const controls = document.createElement('div');
    controls.classList.add('shortcut-controls');

    // TODO: Implement Edit functionality
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');
    editBtn.disabled = true; // Disable edit for now
    editBtn.onclick = () => {
        // TODO: Show edit form, populate with current values
        console.log('Edit clicked for:', shortcut);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.onclick = () => {
        const currentShortcuts = getShortcuts().filter(s => !(s.title === shortcut.title && s.url === shortcut.url));
        updateWidgetContent(id, JSON.stringify(currentShortcuts));
        li.remove(); // Remove from DOM
    };

    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(link);
    li.appendChild(controls);

    return li;
}

// Main function to create the shortcut widget content
export function createShortcutContent(contentContainer, content, id, updateWidgetContent) {
    const container = document.createElement('div');
    container.classList.add('shortcut-widget-container');

    const list = document.createElement('ul');
    list.classList.add('shortcut-list');

    // Function to get current shortcuts from DOM (or internal state)
    // This is needed for delete functionality to know the current state
    const getShortcutsFromState = () => {
        // Simple way: re-parse from storage. More robust would be internal state.
        try {
            return JSON.parse(content || '[]');
        } catch { return []; }
    };

    // Load existing shortcuts
    console.log(`[Shortcut Debug ${id}] Received content:`, content);
    let shortcuts = [];
    try {
        shortcuts = JSON.parse(content || '[]');
        if (!Array.isArray(shortcuts)) shortcuts = [];
        console.log(`[Shortcut Debug ${id}] Parsed shortcuts:`, shortcuts);
    } catch (e) {
        console.error(`[Shortcut Debug ${id}] Error parsing shortcuts content:`, e);
        shortcuts = [];
    }

    if (shortcuts.length === 0) {
        console.log(`[Shortcut Debug ${id}] No shortcuts found or parsed.`);
    }

    shortcuts.forEach(shortcut => {
        console.log(`[Shortcut Debug ${id}] Processing shortcut:`, shortcut);
        if (shortcut && shortcut.title && shortcut.url) {
            const element = createShortcutElement(shortcut, id, updateWidgetContent, getShortcutsFromState, list);
            console.log(`[Shortcut Debug ${id}] Appending element:`, element);
            list.appendChild(element);
        } else {
             console.warn(`[Shortcut Debug ${id}] Invalid shortcut data found:`, shortcut);
        }
    });

    // Add new shortcut form
    const form = document.createElement('div');
    form.classList.add('add-shortcut-form');

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.placeholder = '이름';

    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.placeholder = 'URL (https://...)';

    const addButton = document.createElement('button');
    addButton.textContent = '추가';
    addButton.onclick = () => {
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();

        if (title && url) {
            // Basic URL validation (starts with http/https)
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                alert('URL은 http:// 또는 https:// 로 시작해야 합니다.');
                return;
            }

            const newShortcut = { title, url };
            const currentShortcuts = getShortcutsFromState(); // Get current state
            currentShortcuts.push(newShortcut);
            updateWidgetContent(id, JSON.stringify(currentShortcuts)); // Save updated list

            // Add to DOM
            list.appendChild(createShortcutElement(newShortcut, id, updateWidgetContent, getShortcutsFromState, list));

            // Clear inputs
            titleInput.value = '';
            urlInput.value = '';
        } else {
            alert('이름과 URL을 모두 입력해주세요.');
        }
    };

    form.appendChild(titleInput);
    form.appendChild(urlInput);
    form.appendChild(addButton);

    container.appendChild(list);
    container.appendChild(form);
    contentContainer.appendChild(container);
} 