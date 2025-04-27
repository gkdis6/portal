let draggedItem = null;
let placeholder = null;
let widgetContainerRef = null; // Reference to the container

function createPlaceholder() {
    const p = document.createElement("div");
    p.classList.add("widget-placeholder");
    // Size matching will be handled by copying classes
    // if (draggedItem) {
    //     p.style.height = `${draggedItem.offsetHeight}px`; 
    // }
    return p;
}

export function setDragDropContainer(container) {
    widgetContainerRef = container;
}

export function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);

    // Create placeholder and copy classes immediately
    placeholder = createPlaceholder();
    if (draggedItem.classList.contains('widget-size-tall')) {
        placeholder.classList.add('widget-size-tall');
    }
    if (draggedItem.classList.contains('widget-size-wide')) {
        placeholder.classList.add('widget-size-wide');
    }

    // Replace dragged item with placeholder in the DOM immediately
    // Need to delay this slightly to allow drag image generation
    setTimeout(() => {
        if (draggedItem && draggedItem.parentNode) {
            try {
                 draggedItem.parentNode.replaceChild(placeholder, draggedItem);
                 draggedItem.style.opacity = '0.5'; // Style the ghost image being dragged
            } catch (err) {
                 console.error("Error replacing node on drag start:", err);
                 placeholder = null; // Reset placeholder if replacement fails
            }
        }
    }, 0);
}

export function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Necessary to allow dropping
    }
    e.dataTransfer.dropEffect = 'move';
    if (!placeholder || !widgetContainerRef || !draggedItem) { return false; }
    const targetElement = e.target.closest('.widget, .widget-placeholder'); // Can hover over placeholder too
    if (!targetElement || targetElement === draggedItem) { return false; }
    // Avoid moving placeholder onto itself
    if (targetElement === placeholder) return false; 
    
    const container = widgetContainerRef;
    const rect = targetElement.getBoundingClientRect();
    const isPlaceholderTarget = targetElement.classList.contains('widget-placeholder');
    let targetWidgetElement = isPlaceholderTarget ? null : targetElement;
    
    // If hovering over placeholder, find nearest widget neighbour to determine position
    if (isPlaceholderTarget) {
         // Simplified: don't move if hovering over placeholder itself? Might be jerky.
         // Let's try moving relative to neighbours of placeholder.
         let before = placeholder.previousElementSibling;
         let after = placeholder.nextElementSibling;
         // Determine target based on cursor Y pos relative to placeholder bounds?
         // For now, let's prevent moving when over placeholder to avoid complexity
         return false; 
    }
    
    // --- Move placeholder relative to targetWidgetElement --- 
    const midpoint = rect.top + rect.height / 2; 
    const insertBeforeTarget = e.clientY < midpoint;
    
    if (insertBeforeTarget) {
         container.insertBefore(placeholder, targetWidgetElement);
    } else {
         container.insertBefore(placeholder, targetWidgetElement.nextSibling);
    }

    return false;
}

export function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    // Check if the drop occurred on the placeholder or within the container
    if (draggedItem && placeholder && placeholder.parentNode === widgetContainerRef) {
        try {
            // Replace the placeholder with the dragged item
            placeholder.parentNode.replaceChild(draggedItem, placeholder);
            draggedItem.style.opacity = '1'; // Restore opacity
            placeholder = null; // Placeholder is removed

            // Update storage order
            const newOrder = Array.from(widgetContainerRef.children)
                               .filter(el => el.classList.contains('widget'))
                               .map(widget => parseInt(widget.dataset.id, 10));
            updateStorageOrder(newOrder);

        } catch (error) {
            console.error("Error replacing placeholder on drop:", error);
            // Attempt cleanup if error occurs
             if (placeholder && placeholder.parentNode) placeholder.remove();
             // Try to put dragged item back if it's detached
            if (draggedItem && !draggedItem.parentNode && widgetContainerRef) {
                widgetContainerRef.appendChild(draggedItem);
                 draggedItem.style.opacity = '1';
            }
             placeholder = null;
        }
    } else if (placeholder && placeholder.parentNode) {
         // Drop outside valid area, just remove placeholder (dragEnd will put item back)
         // placeholder.remove(); // Let dragEnd handle putting item back
    }

    // Final cleanup in dragEnd
    return false;
}

export function handleDragEnd(e) {
    // If placeholder still exists, drop was unsuccessful or cancelled
    if (placeholder && placeholder.parentNode) {
        try {
            // Put the original item back where the placeholder was
            placeholder.parentNode.replaceChild(draggedItem, placeholder);
        } catch (error) {
             console.error("Error putting dragged item back on drag end:", error);
             // If replace failed, try removing placeholder and appending item
             placeholder.remove();
             if (draggedItem && !draggedItem.parentNode && widgetContainerRef) {
                 widgetContainerRef.appendChild(draggedItem);
             }
        }
    }
    
    // Restore opacity if draggedItem still exists
    if (draggedItem) {
      draggedItem.style.opacity = '1';
    }

    // Final cleanup
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