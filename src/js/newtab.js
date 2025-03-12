document.addEventListener("DOMContentLoaded", function () {
	const addWidgetButton = document.getElementById("addWidget");
	const widgetContainer = document.getElementById("widgetContainer");
	
	// 위젯 타입 선택 드롭다운 추가
	const widgetTypeSelect = document.createElement("select");
	widgetTypeSelect.innerHTML = `
        <option value="memo">메모</option>
        <option value="timer">타이머</option>
        <option value="list">리스트</option>
        <option value="calculator">계산기</option>
        <option value="todo">할 일 목록</option>
        <option value="clock">시계</option>
    `;
	widgetContainer.parentElement.insertBefore(widgetTypeSelect, addWidgetButton);
	
	// 기존 위젯 불러오기
	chrome.storage.sync.get(["widgets"], (result) => {
		const widgets = result.widgets || [];
		widgets.forEach(widget => createWidget(widget.id, widget.type, widget.content));
	});
	
	// 위젯 추가 버튼 클릭 시
	addWidgetButton.addEventListener("click", () => {
		const widgetId = Date.now();
		const widgetType = widgetTypeSelect.value;
		createWidget(widgetId, widgetType, "");
		
		chrome.storage.sync.get(["widgets"], (result) => {
			const widgets = result.widgets || [];
			widgets.push({ id: widgetId, type: widgetType, content: "" });
			chrome.storage.sync.set({ widgets });
		});
	});
	
	// 위젯 생성 함수
	function createWidget(id, type, content) {
		const widget = document.createElement("div");
		widget.classList.add("widget");
		widget.draggable = true;
		widget.dataset.id = id;
		widget.dataset.type = type;
		widget.style.padding = "10px";
		widget.style.border = "1px solid #ccc";
		widget.style.borderRadius = "5px";
		widget.style.backgroundColor = "#f9f9f9";
		widget.style.cursor = "grab";
		
		let widgetContent;
		
		if (type === "memo") {
			widgetContent = document.createElement("textarea");
			widgetContent.value = content;
			widgetContent.placeholder = "메모를 입력하세요...";
			widgetContent.addEventListener("input", () => updateWidgetContent(id, widgetContent.value));
		} else if (type === "timer") {
			widgetContent = document.createElement("button");
			widgetContent.innerText = "타이머 시작";
			widgetContent.addEventListener("click", () => startTimer(widgetContent));
		} else if (type === "list") {
			widgetContent = document.createElement("ul");
			widgetContent.innerHTML = "<li>목록 항목 1</li><li>목록 항목 2</li>";
		} else if (type === "calculator") {
			widgetContent = document.createElement("input");
			widgetContent.type = "text";
			widgetContent.placeholder = "계산식 입력...";
			widgetContent.addEventListener("change", () => {
				try {
					widgetContent.value = eval(widgetContent.value);
				} catch {
					widgetContent.value = "오류";
				}
			});
		} else if (type === "todo") {
			widgetContent = document.createElement("ul");
			const input = document.createElement("input");
			input.placeholder = "할 일 추가...";
			const addButton = document.createElement("button");
			addButton.textContent = "추가";
			addButton.addEventListener("click", () => {
				if (input.value.trim() !== "") {
					const li = document.createElement("li");
					li.textContent = input.value;
					widgetContent.appendChild(li);
					input.value = "";
				}
			});
			widget.appendChild(input);
			widget.appendChild(addButton);
		} else if (type === "clock") {
			widgetContent = document.createElement("p");
			setInterval(() => {
				widgetContent.innerText = new Date().toLocaleTimeString();
			}, 1000);
		} else {
			widgetContent = document.createElement("p");
			widgetContent.innerText = "알 수 없는 위젯 타입";
		}
		
		const removeBtn = document.createElement("button");
		removeBtn.innerText = "X";
		removeBtn.addEventListener("click", () => removeWidget(id, widget));
		
		widget.appendChild(widgetContent);
		widget.appendChild(removeBtn);
		widgetContainer.appendChild(widget);
	}
	
	// 위젯 내용 업데이트
	function updateWidgetContent(id, content) {
		chrome.storage.sync.get(["widgets"], (result) => {
			const widgets = result.widgets || [];
			const updatedWidgets = widgets.map(widget =>
				widget.id === id ? { ...widget, content } : widget
			);
			chrome.storage.sync.set({ widgets: updatedWidgets });
		});
	}
	
	// 위젯 삭제 함수
	function removeWidget(id, widgetElement) {
		widgetElement.remove();
		chrome.storage.sync.get(["widgets"], (result) => {
			const widgets = result.widgets || [];
			const updatedWidgets = widgets.filter(widget => widget.id !== id);
			chrome.storage.sync.set({ widgets: updatedWidgets });
		});
	}
	
	// 타이머 시작 함수
	function startTimer(button) {
		let time = 10; // 기본 10초 타이머
		button.disabled = true;
		button.innerText = `남은 시간: ${time}s`;
		const interval = setInterval(() => {
			time--;
			button.innerText = `남은 시간: ${time}s`;
			if (time <= 0) {
				clearInterval(interval);
				button.innerText = "타이머 종료";
				button.disabled = false;
			}
		}, 1000);
	}
});