import { createMemoContent } from './widgets/memo.js';
import { createTimerContent } from './widgets/timer.js';
import { createShortcutContent } from './widgets/shortcut.js';
import { createTodoContent } from './widgets/todo.js';

// 각 위젯 타입에 대한 전략 정의 (아이콘 정보 포함)
export const widgetStrategies = {
    memo: {
        icon: 'description',
        createContent: createMemoContent
    },
    timer: {
        icon: 'timer',
        createContent: createTimerContent
    },
    shortcut: {
        icon: 'link',
        createContent: createShortcutContent
    },
    todo: {
        icon: 'task_alt',
        createContent: createTodoContent
    },
    default: {
        icon: 'widgets', // Default icon
        createContent: (contentContainer) => {
            const widgetContent = document.createElement("p");
            widgetContent.innerText = "알 수 없는 위젯 타입";
            contentContainer.appendChild(widgetContent);
        }
    }
}; 