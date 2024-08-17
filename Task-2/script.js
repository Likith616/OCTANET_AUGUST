const taskInput = document.getElementById('taskInput');
const addButton = document.getElementById('addButton');
const taskList = document.getElementById('taskList');

addButton.addEventListener('click', () => {
  const taskText = taskInput.value.trim();
  if (taskText !== '') {
    const li = document.createElement('li');
    li.textContent = taskText;

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete');
    const deleteIcon = document.createElement('i');
    deleteIcon.classList.add('fas', 'fa-trash');
    deleteButton.appendChild(deleteIcon);

    deleteButton.addEventListener('click', (e) => {
      
      const parentLi = e.target.closest('li');
      if (parentLi) {
        taskList.removeChild(parentLi);
      }
    });

    li.appendChild(deleteButton);
    taskList.appendChild(li);
    taskInput.value = '';
  }
});