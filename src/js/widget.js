import { widgetStrategies } from './strategies.js';
import { handleDragStart, handleDragOver, handleDrop, handleDragEnd } from './dragDrop.js';
import { cleanupTimer } from './widgets/timer.js';

// 위젯 내용 업데이트 (Storage)
export function updateWidgetContent(id, content) {
    chrome.storage.sync.get(["widgets"], (result) => {
        const widgets = result.widgets || [];
        const updatedWidgets = widgets.map(widget =>
            widget.id === id ? { ...widget, content } : widget
        );
        chrome.storage.sync.set({ widgets: updatedWidgets }, () => {
             if (chrome.runtime.lastError) {
                 console.error("Error saving widget content:", chrome.runtime.lastError);
             }
        });
    });
}

// 위젯 삭제 함수 (DOM & Storage)
function removeWidget(id, widgetElement) {
    if (widgetElement.dataset.type === 'timer' && typeof cleanupTimer === 'function') {
        cleanupTimer(id);
    }

    widgetElement.remove();
    chrome.storage.sync.get(["widgets"], (result) => {
        const widgets = result.widgets || [];
        const updatedWidgets = widgets.filter(widget => widget.id !== id);
        chrome.storage.sync.set({ widgets: updatedWidgets }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error removing widget:", chrome.runtime.lastError);
            }
        });
    });
}

// 위젯 생성 함수 (DOM Creation & Strategy Application)
export function createWidget(id, type, content, container) {
    const widget = document.createElement("div");
    widget.classList.add("widget");
    widget.classList.add(type);

    // --- Add Size Class based on Type ---
    if (type === 'todo' || type === 'timer') { // Todo and Timer are tall
        widget.classList.add('widget-size-tall');
    } else if (type === 'memo' || type === 'shortcut') { // Memo and Shortcut are wide
        widget.classList.add('widget-size-wide');
    }
    // Add more size conditions here if needed

    widget.draggable = true;
    widget.dataset.id = id;
    widget.dataset.type = type;
    widget.style.position = "relative";

    // Find the appropriate strategy object
    const strategy = widgetStrategies[type] || widgetStrategies.default;

    // --- Create and Add Icon ---
    const iconName = strategy.icon || 'widgets'; // Get icon name from strategy
    const iconElement = document.createElement("i");
    iconElement.classList.add("material-symbols-outlined", "widget-icon");
    iconElement.textContent = iconName;
    widget.appendChild(iconElement); // Add icon first

    // --- Create Content Container ---
    const contentContainer = document.createElement("div");
    contentContainer.classList.add("widget-content");

    // Use the strategy's createContent function
    strategy.createContent(contentContainer, content, id, updateWidgetContent, widget);
    widget.appendChild(contentContainer); // Append content container after icon

    // --- 공통 위젯 기능 (삭제 버튼) ---
    const removeBtn = document.createElement("button");
    removeBtn.classList.add("remove-widget-btn", "widget-action-btn");
    removeBtn.innerText = "✕";
    removeBtn.addEventListener("click", () => removeWidget(id, widget));
    widget.appendChild(removeBtn); // Append remove button last

    // --- Add Todo Specific Toggle Button ---
    if (type === 'todo') {
        const toggleBtn = document.createElement("button");
        toggleBtn.classList.add("widget-action-btn", "toggle-completed-btn");
        toggleBtn.innerHTML = `<span class="material-symbols-outlined">visibility_off</span>`; // Start hidden
        toggleBtn.title = "완료 항목 숨기기/보이기";
        let showCompleted = false; // Initial state: completed items are hidden
        widget.classList.add('hide-completed'); // Add initial class to hide completed

        toggleBtn.addEventListener('click', () => {
            showCompleted = !showCompleted;
            widget.classList.toggle('hide-completed', !showCompleted);
            toggleBtn.innerHTML = `<span class="material-symbols-outlined">${showCompleted ? 'visibility' : 'visibility_off'}</span>`;
            toggleBtn.title = showCompleted ? "완료 항목 보이기" : "완료 항목 숨기기";
        });
        widget.appendChild(toggleBtn); // Append toggle button
    }

    // --- 드래그 앤 드롭 리스너 추가 ---
    widget.addEventListener('dragstart', handleDragStart);
    widget.addEventListener('dragover', handleDragOver);
    widget.addEventListener('drop', handleDrop);
    widget.addEventListener('dragend', handleDragEnd);

    // 위젯을 컨테이너에 추가
    container.appendChild(widget);
} 