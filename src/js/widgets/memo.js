export function createMemoContent(contentContainer, content, id, updateWidgetContent) {
    const widgetContent = document.createElement("textarea");
    widgetContent.value = content;
    widgetContent.placeholder = "메모를 입력하세요...";
    widgetContent.addEventListener("input", () => updateWidgetContent(id, widgetContent.value));
    contentContainer.appendChild(widgetContent);
} 