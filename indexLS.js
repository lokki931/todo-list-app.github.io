const addBtn = document.getElementById('add-btn');
const cancelBtn = document.getElementById('cancel-btn');
const todoAdd = document.getElementById('todo-add');
const todos = document.getElementById('todos');
const search = document.getElementById('search');
let id = 0;

function* makeId() {
  while (true) {
    yield id++;
  }
}

const generator = makeId();
const idTodo = makeId();

const categoriesData = {
  homeWork: 'Домашні справи',
  work: 'робота',
  fitness: 'фітнес',
};

const checkboxes = document.querySelectorAll('input[name="checks[]"]');

// Local Storage Functions
function saveToLocalStorage() {
  const items = Array.from(todos.querySelectorAll('.todo-item')).map((item) => ({
    id: item.id,
    title: item.querySelector('.todo-title').innerText,
    content: item.querySelector('.todo-text').innerText,
    completed: item.classList.contains('completed'),
    categories: Array.from(item.querySelectorAll('.todo-category')).map((cat) => cat.dataset.cats),
  }));
  localStorage.setItem('todos', JSON.stringify(items));
}

function loadFromLocalStorage() {
  const storedTodos = JSON.parse(localStorage.getItem('todos'));
  if (storedTodos) {
    storedTodos.forEach((todo) => {
      const template = document.querySelector('#template-item');
      const clone = template.content.cloneNode(true);
      clone.querySelector('.todo-item').setAttribute('id', todo.id);
      const formTitle = clone.querySelector('.todo-title');
      const formContent = clone.querySelector('.todo-text');
      formTitle.textContent = todo.title;
      formContent.textContent = todo.content;

      addCategory(todo.categories, clone);

      if (todo.completed) {
        clone.querySelector('.todo-item').classList.add('completed');
      }
      todos.appendChild(clone);
    });
  }
}

// Call loadFromLocalStorage when the page loads
window.addEventListener('DOMContentLoaded', loadFromLocalStorage);

// Debounce for handling category filtering
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

const handleCheckboxChange = debounce(() => {
  const originalItems = Array.from(todos.querySelectorAll('.todo-item'));
  const selected = Array.from(checkboxes)
    .filter((item) => item.checked)
    .map((item) => item.value);

  originalItems.forEach((item) => {
    const cats = Array.from(item.querySelectorAll('.todo-category'));
    let itemCats = [];
    cats?.forEach((element) => {
      itemCats.push(element.dataset.cats);
    });

    const shouldHide = selected.length > 0 && !selected.some((cat) => itemCats.includes(cat));
    item.classList.toggle('hide', shouldHide);
  });
}, 300);

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', handleCheckboxChange);
});

search.addEventListener('input', function (event) {
  const inputValue = event.target.value.trim().toLowerCase();
  const originalItems = Array.from(todos.querySelectorAll('.todo-item'));

  if (inputValue.length === 0) {
    originalItems.forEach((item) => {
      item.classList.remove('hide');
    });
    return;
  }

  const filterItems = originalItems.filter((item) =>
    item.querySelector('.todo-title').textContent.toLowerCase().includes(inputValue),
  );

  originalItems.forEach((item) => {
    item.classList.add('hide');
  });

  filterItems.forEach((item) => {
    item.classList.remove('hide');
  });
});

function formReset() {
  todoAdd.classList.add('hide');
  addBtn.classList.remove('hide');
  todoAdd.reset();
}

addBtn.addEventListener('click', function () {
  todoAdd.dataset.mode = 'create';
  this.classList.add('hide');
  todoAdd.classList.remove('hide');
});
cancelBtn.addEventListener('click', formReset);

function addCategory(data, clone) {
  const formCategories = clone.querySelector('.todo-categories');
  formCategories.innerHTML = '';
  data?.forEach((el) => {
    const categoryName = categoriesData[el];
    const span = document.createElement('span');
    span.classList.add('todo-category');
    span.setAttribute('data-cats', el);
    span.textContent = categoryName;
    formCategories.appendChild(span);
  });
}

todoAdd.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = {};
  data.checksAdd = [];
  for (const [key, value] of formData.entries()) {
    if (key === 'checksAdd') {
      data.checksAdd.push(value);
    } else {
      data[key] = value;
    }
  }
  if (!data.title) {
    return;
  }
  let clone;
  if (todoAdd.dataset.mode == 'create') {
    const template = document.querySelector('#template-item');
    clone = template.content.cloneNode(true);
    clone.querySelector('.todo-item').setAttribute('id', `idTodo-${generator.next().value}`);
    const formTitle = clone.querySelector('.todo-title');
    const formContent = clone.querySelector('.todo-text');
    formTitle.textContent = data.title;
    formContent.textContent = data.content;
    addCategory(data.checksAdd, clone);
    todos.appendChild(clone);
  } else if (todoAdd.dataset.mode == 'edit') {
    clone = document.getElementById(todoAdd.dataset.id);
    clone.querySelector('.todo-title').innerText = document.getElementById('title').value;
    clone.querySelector('.todo-text').innerText = document.getElementById('content').value;
    addCategory(data.checksAdd, clone);
    todoAdd.dataset.mode = 'create';
  }

  // Save to Local Storage after submission
  saveToLocalStorage();
  formReset();
});

function editItem(item) {
  todoAdd.dataset.mode = 'edit';
  todoAdd.dataset.id = item.id;
  document.getElementById('title').value = item.querySelector('.todo-title').innerText;
  document.getElementById('content').value = item.querySelector('.todo-text').innerText;
  const categories = item.querySelectorAll('.todo-category');
  const formCats = document.querySelectorAll('.cat-check input');
  categories?.forEach((el) => {
    formCats.forEach((item) => {
      if (el.dataset.cats === item.value) {
        item.checked = true;
      }
    });
  });
  todoAdd.classList.remove('hide');
  addBtn.classList.add('hide');
}

document.addEventListener('click', function (event) {
  const item = event.target.closest('.todo-item');

  if (!item) return;

  switch (event.target.closest('button')?.dataset.action) {
    case 'edit':
      editItem(item);
      break;
    case 'delete':
      item.remove();
      saveToLocalStorage(); // Save to Local Storage after deletion
      break;
    case 'completed':
      item.classList.toggle('completed');
      saveToLocalStorage(); // Save to Local Storage after marking as completed
      break;

    default:
      return;
  }
});
