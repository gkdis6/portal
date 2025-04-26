import { createWidget } from './widget.js';
import { handleDragOver, setDragDropContainer } from './dragDrop.js';

document.addEventListener("DOMContentLoaded", function () {
	const addWidgetButton = document.getElementById("addWidget");
	const widgetContainer = document.getElementById("widgetContainer");
	
	// Initialize drag and drop with the container reference
	setDragDropContainer(widgetContainer);
	
	// 위젯 타입 선택 드롭다운 추가
	const widgetTypeSelect = document.createElement("select");
	widgetTypeSelect.innerHTML = `
        <option value="memo">메모</option>
        <option value="timer">타이머</option>
        <option value="shortcut">바로가기</option>
        <option value="todo">할 일 목록</option>
    `;
	widgetContainer.parentElement.insertBefore(widgetTypeSelect, addWidgetButton);
	
	// 기존 위젯 불러오기
	chrome.storage.sync.get(["widgets"], (result) => {
		const widgets = result.widgets || [];
		widgets.forEach(widget => createWidget(widget.id, widget.type, widget.content, widgetContainer));
	});
	
	// 위젯 추가 버튼 클릭 시
	addWidgetButton.addEventListener("click", () => {
		const widgetId = Date.now();
		const widgetType = widgetTypeSelect.value;
		const initialContent = "";
		
		// Add to storage first
		chrome.storage.sync.get(["widgets"], (result) => {
			const widgets = result.widgets || [];
			widgets.push({ id: widgetId, type: widgetType, content: initialContent });
			chrome.storage.sync.set({ widgets }, () => {
				if (chrome.runtime.lastError) {
					console.error("Error saving new widget:", chrome.runtime.lastError);
				} else {
					// Only create the widget in DOM after successful storage save
					createWidget(widgetId, widgetType, initialContent, widgetContainer);
				}
			});
		});
	});
	
	// Add dragover listener to the container to allow dropping anywhere within it
	widgetContainer.addEventListener('dragover', handleDragOver);
});