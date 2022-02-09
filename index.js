      const todoInput = document.getElementById('todo-input');
      const todoForm = document.getElementById('todo-form');
      const todoList = document.getElementById('todo-list');
      const template = document.querySelector('#todo-item');
      const todoBtn = document.getElementById('todo-btn');
      const editText = document.getElementById('edit-text');
      const searchInput = document.getElementById('search-input');
      const allTodos = [];

      function formatDate(date) {
        const options = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        };
        return new Date(date).toLocaleString('en-gb', options);
      }
      function addTodo(...todos) {
        const list = document.createDocumentFragment();
        todos.forEach((todo) => {
          const clone = document.importNode(template.content, true);
          const listItem = clone.querySelector('li');
          const todoText = clone.querySelector('p');
          const todoTime = clone.querySelector('.text-muted');
          const todoEditBtn = clone.querySelector('.edit-btn');
          const todoDeleteBtn = clone.querySelector('.delete-btn');
          const todoCopyBtn = clone.querySelector('.copy-btn');
          listItem.dataset.todoId = todo.id;
          todoText.textContent = todo.text;
          todoTime.textContent = formatDate(todo.created);
          todoEditBtn.addEventListener('click', editTodo.bind(null, todo.id));
          todoDeleteBtn.addEventListener(
            'click',
            deleteTodo.bind(null, todo.id)
          );
          todoCopyBtn.addEventListener('click', copyTodo.bind(null, todo.text));
          list.appendChild(clone);
        });
        todoList.appendChild(list);
      }
      function editTodo(todoID) {
        const listItem = todoList.querySelector(`[data-todo-id="${todoID}"]`);
        const todoText = listItem.querySelector('p').textContent;
        editText.textContent = `Editing todo: ${todoText}`;
        todoBtn.textContent = 'Save Todo';
        todoInput.value = todoText;
        todoForm.dataset.todoId = todoID;
      }
      function deleteTodo(todoID) {
        //Todo: Add a prompt for confirmation.
        const todoIndex = allTodos.findIndex((todo) => todo.id === todoID);
        allTodos.splice(todoIndex, 1);
        todoList.querySelector(`[data-todo-id="${todoID}"]`).remove();
        persistTodos();
      }
      function copyTodo(todoText) {
        navigator.permissions
          .query({ name: 'clipboard-write' })
          .then((result) => {
            if (result.state === 'granted') {
              const type = 'text/plain';
              const blob = new Blob([todoText], { type });
              let data = [new ClipboardItem({ [type]: blob })];
              navigator.clipboard.write(data).then(
                function () {
                  alert('copied successfully');
                },
                function () {
                  alert('copy failed');
                }
              );
            }
          })
          .catch(() => {
            alert('You need to grant permission to copy');
          });
      }
      function createTodo(text) {
        const createdDate = new Date();
        const todo = {
          text,
          id: createdDate.getTime(),
          created: createdDate.toISOString(),
        };
        allTodos.push(todo);
        addTodo(todo);
        todoInput.value = '';
      }
      function updateTodo(todo) {
        const listItem = todoList.querySelector(`[data-todo-id="${todo.id}"]`);
        if (!listItem) {
          return; // We can't find the todo in the DOM
        }
        listItem.querySelector('p').textContent = todo.text;
        resetTodoForm();
      }
      function resetTodoForm() {
        editText.textContent = '';
        todoBtn.textContent = 'Add Todo';
        todoInput.value = '';
        todoForm.removeAttribute('data-todo-id');
      }
      function createOrUpdateTodo(event) {
        event.preventDefault();
        const todoText = todoInput.value.trim();
        if (todoText === '') {
          window.alert('Enter todo text');
          return;
        }
        const todoID = Number(todoForm.dataset.todoId);
        if (Number.isNaN(todoID)) {
          createTodo(todoText);
          persistTodos();
          return;
        }
        const todoIndex = allTodos.findIndex((todo) => todo.id === todoID);
        if (todoIndex === -1) {
          alert('Could not edit todo.');
          return;
        }
        const existingTodo = allTodos[todoIndex];
        const todo = {
          ...existingTodo,
          text: todoText,
        };
        allTodos.splice(todoIndex, 1, todo);
        updateTodo(todo);
        persistTodos();
      }
      function retrieveTodos() {
        const todos = window.localStorage.getItem('todos');
        if (!todos) {
          return;
        }
        try {
          allTodos.push(...JSON.parse(todos));
          addTodo(...allTodos);
        } catch {
          console.error('Could not deserialize todos');
        }
      }
      function persistTodos() {
        window.localStorage.setItem('todos', JSON.stringify(allTodos));
      }
      function searchTodos(event) {
        const text = event.target.value;
        const regex = new RegExp(text, 'gi');
        const todoIDs = allTodos
          .filter((todo) => todo.text.search(regex) !== -1)
          .map((item) => item.id);
        todoList.querySelectorAll('li').forEach((listItem) => {
          const todoID = Number(listItem.dataset.todoId);
          const match = todoIDs.indexOf(todoID) !== -1;
          if (!match) {
            listItem.classList.add('invinsible', 'd-none');
            return;
          }
          listItem.classList.remove('invinsible', 'd-none');
        });
      }
      window.addEventListener('DOMContentLoaded', retrieveTodos);
      todoForm.addEventListener('submit', createOrUpdateTodo);
      searchInput.addEventListener('input', searchTodos);