export function createCalculatorContent(contentContainer, content, id, updateWidgetContent) {
    const widgetContent = document.createElement("input");
    widgetContent.type = "text";
    widgetContent.placeholder = "계산식 입력...";
    widgetContent.value = content || ""; // Restore last value/result
    widgetContent.addEventListener("change", () => {
        try {
            // Warning: eval() is a security risk. Use a safer math expression parser library.
            const expression = widgetContent.value;
            // Basic validation to prevent function calls etc.
            if (/[^0-9\+\-\*\/\(\)\s\.]/.test(expression)) {
                throw new Error("Invalid characters in expression");
            }
            const result = eval(expression);
            widgetContent.value = result;
            updateWidgetContent(id, result.toString()); // Save result
        } catch (e) {
            widgetContent.value = "오류";
            console.error("Calculator eval error:", e);
            // Optionally clear saved content on error?
            // updateWidgetContent(id, "");
        }
    });
    contentContainer.appendChild(widgetContent);
} 