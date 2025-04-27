// src/js/widgets/shortcut.js

let currentlyEditing = null; // { widgetId: id, listItem: li, originalData: {title, url} }

// Helper to create a single shortcut item element
function createShortcutElement(shortcut, id, updateWidgetContent, getShortcuts, listElement, formElements) {
    const li = document.createElement('li');
    li.classList.add('shortcut-item');
    li.dataset.title = shortcut.title; // Store data for easier lookup
    li.dataset.url = shortcut.url;

    const link = document.createElement('a');
    link.href = shortcut.url;
    link.textContent = shortcut.title;
    link.target = '_blank'; // Open in new tab
    link.title = shortcut.url; // Show URL on hover
    link.classList.add('shortcut-link');

    const controls = document.createElement('div');
    controls.classList.add('shortcut-controls');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');
    editBtn.onclick = () => {
        // If already editing another item, reset it first
        if (currentlyEditing && currentlyEditing.widgetId === id && currentlyEditing.listItem !== li) {
            currentlyEditing.listItem.classList.remove('editing');
        }

        // Highlight this item
        li.classList.add('editing');

        // Populate the form
        formElements.titleInput.value = shortcut.title;
        formElements.urlInput.value = shortcut.url;
        formElements.addButton.textContent = '저장'; // Change button to Save

        // Store editing state
        currentlyEditing = { widgetId: id, listItem: li, originalData: { ...shortcut } };

        formElements.titleInput.focus(); // Focus title input
        console.log('Editing started for:', shortcut);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.onclick = () => {
        // If deleting the item being edited, reset the form
        if (currentlyEditing && currentlyEditing.widgetId === id && currentlyEditing.listItem === li) {
            formElements.titleInput.value = '';
            formElements.urlInput.value = '';
            formElements.addButton.textContent = '추가';
            currentlyEditing = null;
        }
        // Delete logic remains the same
        const currentShortcuts = getShortcuts().filter(s => !(s.title === shortcut.title && s.url === shortcut.url));
        updateWidgetContent(id, JSON.stringify(currentShortcuts));
        li.remove();
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

    // Store form elements for access by createShortcutElement
    const formElements = { titleInput: null, urlInput: null, addButton: null };

    // Now load shortcuts, passing formElements to the helper
    shortcuts.forEach(shortcut => {
        console.log(`[Shortcut Debug ${id}] Processing shortcut:`, shortcut);
        if (shortcut && shortcut.title && shortcut.url) {
            const element = createShortcutElement(shortcut, id, updateWidgetContent, getShortcutsFromState, list, formElements);
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

    // Store form elements for access by createShortcutElement
    formElements.titleInput = titleInput;
    formElements.urlInput = urlInput;
    formElements.addButton = addButton;

    // Add/Save Button Logic
    addButton.onclick = () => {
        const newTitle = titleInput.value.trim();
        const newUrl = urlInput.value.trim();

        if (!newTitle || !newUrl) {
            alert('이름과 URL을 모두 입력해주세요.');
            return;
        }
        if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
            alert('URL은 http:// 또는 https:// 로 시작해야 합니다.');
            return;
        }

        let currentShortcuts = getShortcutsFromState();

        // Check if Editing
        if (currentlyEditing && currentlyEditing.widgetId === id) {
            const originalData = currentlyEditing.originalData;
            const listItem = currentlyEditing.listItem;

            // Find the index of the shortcut being edited
            const indexToUpdate = currentShortcuts.findIndex(s => 
                s.title === originalData.title && s.url === originalData.url
            );

            if (indexToUpdate > -1) {
                // Update the shortcut in the array
                currentShortcuts[indexToUpdate] = { title: newTitle, url: newUrl };
                updateWidgetContent(id, JSON.stringify(currentShortcuts)); // Save updated list

                // Update DOM element
                const link = listItem.querySelector('.shortcut-link');
                if (link) {
                    link.href = newUrl;
                    link.textContent = newTitle;
                    link.title = newUrl;
                }
                 listItem.dataset.title = newTitle; // Update dataset too
                 listItem.dataset.url = newUrl;
                 listItem.classList.remove('editing'); // Remove editing highlight
                console.log('Shortcut updated:', currentShortcuts[indexToUpdate]);
            } else {
                console.error('Could not find shortcut to update:', originalData);
                listItem.classList.remove('editing'); // Still remove highlight
            }

            // Reset form and editing state
            titleInput.value = '';
            urlInput.value = '';
            addButton.textContent = '추가';
            currentlyEditing = null;

        } else {
            // Adding New Shortcut
            const newShortcut = { title: newTitle, url: newUrl };
            currentShortcuts.push(newShortcut);
            updateWidgetContent(id, JSON.stringify(currentShortcuts));

            const newElement = createShortcutElement(newShortcut, id, updateWidgetContent, getShortcutsFromState, list, formElements);
            list.appendChild(newElement);
            
            titleInput.value = '';
            urlInput.value = '';
            console.log('New shortcut added:', newShortcut);
        }
    };

    form.appendChild(titleInput);
    form.appendChild(urlInput);
    form.appendChild(addButton);

    container.appendChild(list);
    container.appendChild(form);
    contentContainer.appendChild(container);
} 