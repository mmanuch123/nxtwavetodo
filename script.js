document.addEventListener('DOMContentLoaded', () => {
    const taskTitleInput = document.getElementById('taskTitle');
    const prioritySelect = document.getElementById('priority');
    const deadlineInput = document.getElementById('deadline');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const emptyMessage = document.getElementById('emptyMessage');

    let tasks = loadTasks();
    renderTasks(tasks);

    addTaskBtn.addEventListener('click', addTask);
    statusFilter.addEventListener('change', () => filterTasks(tasks));
    priorityFilter.addEventListener('change', () => filterTasks(tasks));

    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        return storedTasks ? JSON.parse(storedTasks) : [];
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function updateEmptyMessageVisibility() {
        emptyMessage.style.display = tasks.length === 0 ? 'block' : 'none';
    }

    function addTask() {
        const title = taskTitleInput.value.trim();
        const priority = prioritySelect.value;
        const deadline = deadlineInput.value;

        if (title) {
            const newTask = {
                id: Date.now(),
                title,
                priority,
                deadline,
                completed: false
            };
            tasks.push(newTask);
            saveTasks();
            renderTasks(tasks);
            taskTitleInput.value = '';
            deadlineInput.value = '';
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks(tasks);
    }

    function toggleComplete(id) {
        tasks = tasks.map(task =>
            task.id === id ? {
                ...task,
                completed: !task.completed
            } : task
        );
        saveTasks();
        renderTasks(tasks);
    }

    function startEdit(id) {
        const taskItem = document.querySelector(`li.task-${id}`);
        const task = tasks.find(task => task.id === id);
        if (taskItem && task) {
            taskItem.innerHTML = `
     <input type="text" class="edit-input" value="${task.title}">
     <select class="edit-priority">
      <option value="High" ${task.priority === 'High' ? 'selected' : ''}>High</option>
      <option value="Medium" ${task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
      <option value="Low" ${task.priority === 'Low' ? 'selected' : ''}>Low</option>
     </select>
     <input type="date" class="edit-deadline" value="${task.deadline}">
     <div class="edit-actions">
      <button class="save" data-id="${id}"><i class="fa-solid fa-check"></i> Save</button>
      <button class="cancel" data-id="${id}"><i class="fa-solid fa-times"></i> Cancel</button>
     </div>
    `;
            const saveBtn = taskItem.querySelector('.save');
            const cancelBtn = taskItem.querySelector('.cancel');

            saveBtn.addEventListener('click', () => saveEdit(id));
            cancelBtn.addEventListener('click', () => renderTasks(tasks));
        }
    }

    function saveEdit(id) {
        const taskItem = document.querySelector(`li.task-${id}`);
        const newTitle = taskItem.querySelector('.edit-input').value.trim();
        const newPriority = taskItem.querySelector('.edit-priority').value;
        const newDeadline = taskItem.querySelector('.edit-deadline').value;

        if (newTitle) {
            tasks = tasks.map(task =>
                task.id === id ? {
                    ...task,
                    title: newTitle,
                    priority: newPriority,
                    deadline: newDeadline
                } : task
            );
            saveTasks();
            renderTasks(tasks);
        }
    }

    function getPriorityColorClass(priority) {
        return `priority-tag ${priority}`;
    }

    function isOverdue(deadline) {
        if (!deadline) return false;
        const today = new Date();
        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return deadlineDate < today;
    }

    function renderTasks(taskListToRender) {
        taskList.innerHTML = '';
        if (taskListToRender.length === 0) {
            updateEmptyMessageVisibility();
        } else {
            updateEmptyMessageVisibility();
            taskListToRender.forEach(task => {
                const listItem = document.createElement('li');
                listItem.classList.add(`task-${task.id}`);
                if (task.completed) {
                    listItem.classList.add('completed');
                }

                const overdueClass = isOverdue(task.deadline) && !task.completed ? 'overdue' : '';
                const deadlineText = task.deadline ? `<span class="${overdueClass}"><i class="fa-regular fa-calendar"></i> ${formatDate(task.deadline)} ${overdueClass ? '(Overdue)' : getDueDateText(task.deadline)}</span>` : 'No deadline';

                listItem.innerHTML = `
      <div class="task-details">
       <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
       <span class="task-title">${task.title}</span>
       <div class="task-info">
        <span class="${getPriorityColorClass(task.priority)}">${task.priority}</span>
        <span>${deadlineText}</span>
       </div>
      </div>
      <div class="task-actions">
       <button class="edit-btn" data-id="${task.id}"><i class="fa-solid fa-pen-to-square"></i></button>
       <button class="delete-btn" data-id="${task.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
     `;

                const completeCheckbox = listItem.querySelector('input');
                const deleteButton = listItem.querySelector('.delete-btn');
                const editButton = listItem.querySelector('.edit-btn');

                completeCheckbox.addEventListener('change', () => toggleComplete(task.id));
                deleteButton.addEventListener('click', () => deleteTask(task.id));
                editButton.addEventListener('click', () => startEdit(task.id));

                taskList.appendChild(listItem);
            });
        }
    }

    function filterTasks(currentTasks) {
        const statusValue = statusFilter.value;
        const priorityValue = priorityFilter.value;

        const filteredTasks = currentTasks.filter(task => {
            const statusMatch = statusValue === 'All' || (statusValue === 'Completed' && task.completed) || (statusValue === 'Pending' && !task.completed);
            const priorityMatch = priorityValue === 'All' || task.priority === priorityValue;
            return statusMatch && priorityMatch;
        });

        renderTasks(filteredTasks);
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}/${year}`;
    }

    function getDueDateText(deadline) {
        if (!deadline) return '';
        const deadlineDate = new Date(deadline);
        const today = new Date();
        const timeDiff = deadlineDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysLeft === 0) {
            return '(Due today)';
        } else if (daysLeft === 1) {
            return '(Due tomorrow)';
        } else if (daysLeft > 1) {
            return `(Due in ${daysLeft} days)`;
        } else {
            return '';
        }
    }
});
