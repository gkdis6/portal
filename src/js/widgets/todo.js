export function createTodoContent(contentContainer, content, id, updateWidgetContent) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%'; // Ensure container fills widget

    const list = document.createElement("ul");
    list.style.flexGrow = '1'; // Allow list to take available space
    list.style.overflowY = 'auto'; // Add scroll if needed
    list.style.marginBottom = '10px';

    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'flex';
    inputContainer.style.gap = '5px'; // Space between input and button

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "할 일 추가...";
    input.style.flexGrow = '1'; // Allow input to take space

    const addButton = document.createElement("button");
    addButton.textContent = "추가";

    // Function to update storage based on current list items and their state
    const updateStorage = () => {
        const items = Array.from(list.children).map(li => {
            const checkbox = li.querySelector('input[type="checkbox"]');
            const text = li.querySelector('label').textContent;
            const completed = checkbox.checked ? '1' : '0';
            return `${text};${completed}`;
        });
        updateWidgetContent(id, items.join('|')); // Use '|' as main separator
    };

    // Function to create a single list item element
    const createTodoItem = (itemText, isCompleted) => {
        const li = document.createElement("li");
        li.classList.add('todo-item');
        if (isCompleted) {
            li.classList.add('completed');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isCompleted;
        checkbox.id = `todo-${id}-${Date.now()}-${Math.random()}`; // Unique ID for label association
        checkbox.addEventListener('change', () => {
            li.classList.toggle('completed', checkbox.checked);
            updateStorage();
        });

        const label = document.createElement('label');
        label.textContent = itemText;
        label.setAttribute('for', checkbox.id);
        label.style.flexGrow = '1';
        label.style.marginLeft = '8px'; // Space between checkbox and text

        const removeButton = document.createElement('button');
        removeButton.textContent = '✕'; // Use consistent 'X' symbol
        removeButton.classList.add('remove-item-btn');
        removeButton.onclick = () => {
            li.remove();
            updateStorage();
        };

        li.appendChild(checkbox);
        li.appendChild(label);
        li.appendChild(removeButton);
        return li;
    };

    // Load initial items from saved content
    if (content) {
        const items = content.split('|');
        items.forEach(itemData => {
            if (itemData.trim()) {
                const [itemText, completedStatus] = itemData.split(';');
                if (itemText !== undefined && completedStatus !== undefined) {
                    list.appendChild(createTodoItem(itemText, completedStatus === '1'));
                }
            }
        });
    }

    // Add button event listener
    addButton.addEventListener("click", () => {
        const newItemText = input.value.trim();
        if (newItemText !== "") {
            list.appendChild(createTodoItem(newItemText, false));
            input.value = "";
            updateStorage();
        }
    });

    // Allow adding with Enter key in the input field
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addButton.click();
        }
    });

    inputContainer.appendChild(input);
    inputContainer.appendChild(addButton);

    container.appendChild(list);
    container.appendChild(inputContainer);
    contentContainer.appendChild(container);
} 