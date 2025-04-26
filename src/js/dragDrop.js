let draggedItem = null;
let placeholder = null;
let widgetContainerRef = null; // Reference to the container

function createPlaceholder() {
    const p = document.createElement("div");
    p.classList.add("widget-placeholder");
    // Match placeholder size to dragged item (optional, might need refinement)
    if (draggedItem) {
        p.style.height = `${draggedItem.offsetHeight}px`;
        // p.style.width = `${draggedItem.offsetWidth}px`; // Grid handles width
    }
    return p;
}

export function setDragDropContainer(container) {
    widgetContainerRef = container;
}

export function handleDragStart(e) {
    draggedItem = this; // 'this' refers to the dragged widget element
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id); // Use plain text for ID

    // Create and insert placeholder after a short delay
    setTimeout(() => {
        if (!draggedItem) return;
        placeholder = createPlaceholder();
        draggedItem.parentNode.insertBefore(placeholder, draggedItem.nextSibling);
        draggedItem.style.opacity = '0.5'; // Visual feedback
    }, 0);
}

export function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Necessary to allow dropping
    }
    e.dataTransfer.dropEffect = 'move';

    // Move placeholder based on hover position
    if (placeholder && widgetContainerRef && this !== placeholder && this.classList.contains('widget')) {
        const container = widgetContainerRef;
        const children = Array.from(container.children).filter(el => el !== draggedItem);
        const targetIndex = children.indexOf(this);
        const placeholderIndex = children.indexOf(placeholder);

        // Determine if the placeholder should go before or after the hovered item
        const rect = this.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
            // Insert before
            container.insertBefore(placeholder, this);
        } else {
            // Insert after
            container.insertBefore(placeholder, this.nextSibling);
        }
    }
    return false;
}

export function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation(); // Stops the browser from redirecting.
    }

    if (draggedItem && placeholder && widgetContainerRef && this.classList.contains('widget')) {
        // Move the dragged item to the placeholder's position
        widgetContainerRef.replaceChild(draggedItem, placeholder);
        draggedItem.style.opacity = '1'; // Restore opacity immediately

        // Update widget order in storage
        const newOrder = Array.from(widgetContainerRef.children)
                           .filter(el => el.classList.contains('widget')) // Ensure only widgets are considered
                           .map(widget => parseInt(widget.dataset.id, 10)); // Get IDs as numbers
        updateStorageOrder(newOrder);
    } else if (placeholder) {
        // If dropped outside a valid target, remove placeholder
        placeholder.remove();
    }

    // Cleanup is handled in dragend
    // draggedItem = null;
    // placeholder = null; // Keep placeholder until dragend to avoid flicker

    return false;
}

export function handleDragEnd(e) {
    // Cleanup regardless of drop success
    if (draggedItem) {
      draggedItem.style.opacity = '1'; // Restore visual
    }
    if (placeholder) {
        placeholder.remove(); // Remove placeholder
    }
    draggedItem = null;
    placeholder = null;
}

// Function to update storage order
function updateStorageOrder(newOrder) {
    chrome.storage.sync.get(["widgets"], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error getting widgets for reorder:", chrome.runtime.lastError);
            return;
        }
        let widgets = result.widgets || [];
        // Create a map for quick lookup
        const widgetMap = new Map(widgets.map(w => [w.id, w]));
        // Reconstruct the array based on the new order
        const reorderedWidgets = newOrder.map(id => widgetMap.get(id)).filter(Boolean); // Filter out any potential undefined if IDs mismatch

        // If the number of widgets doesn't match (shouldn't happen ideally),
        // log an error but still save the reordered ones found.
        if (reorderedWidgets.length !== widgets.length) {
             console.warn("Widget count mismatch during reorder. Saving found widgets.");
        }

        chrome.storage.sync.set({ widgets: reorderedWidgets }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving reordered widgets:", chrome.runtime.lastError);
            }
        });
    });
}

// Function to update storage (placeholder)
/*
function updateStorageOrder(newOrder) {
    chrome.storage.sync.get(["widgets"], (result) => {
        let widgets = result.widgets || [];
        // Reorder the widgets array based on newOrder
        widgets.sort((a, b) => newOrder.indexOf(a.id.toString()) - newOrder.indexOf(b.id.toString()));
        chrome.storage.sync.set({ widgets });
    });
}
*/ 