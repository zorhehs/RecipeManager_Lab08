let recipes = JSON.parse(localStorage.getItem('recipes')) || [];
let editId = null;
let imageData = '';
let page = 1;
const perPage = 3;

const form = document.getElementById('recipeForm');
const titleInput = document.getElementById('title');
const ingredientsInput = document.getElementById('ingredients');
const instructionsInput = document.getElementById('instructions');
const imageInput = document.getElementById('image');
const preview = document.getElementById('preview');
const searchInput = document.getElementById('search');
const list = document.getElementById('list');
const pager = document.getElementById('pager');
const cancelBtn = document.getElementById('cancelBtn');

function save() {
    localStorage.setItem('recipes', JSON.stringify(recipes));
}

function showError(id, message) {
    document.getElementById(id + 'Error').textContent = message;
    document.getElementById(id).classList.toggle('bad', message !== '');
}

function validate() {
    let ok = true;
    const title = titleInput.value.trim();
    const ingredients = ingredientsInput.value.trim();
    const instructions = instructionsInput.value.trim();

    showError('title', '');
    showError('ingredients', '');
    showError('instructions', '');

    if (title.length < 3) {
        showError('title', 'Title is required (at least 3 characters)');
        ok = false;
    }
    if (ingredients === '') {
        showError('ingredients', 'Please enter the ingredients');
        ok = false;
    }
    if (instructions.length < 10) {
        showError('instructions', 'Instructions are required (at least 10 characters)');
        ok = false;
    }
    return ok;
}

function createRecipe(recipe) {
    recipes.push(recipe);
    save();
}

function readRecipes() {
    const word = searchInput.value.trim().toLowerCase();
    return recipes.filter(function (r) {
        return r.title.toLowerCase().includes(word) || r.ingredients.toLowerCase().includes(word);
    });
}

function updateRecipe(id, data) {
    const r = recipes.find(function (x) { return x.id === id; });
    r.title = data.title;
    r.ingredients = data.ingredients;
    r.instructions = data.instructions;
    r.image = data.image;
    save();
}

function deleteRecipe(id) {
    recipes = recipes.filter(function (x) { return x.id !== id; });
    save();
}

function render() {
    const found = readRecipes();
    const pages = Math.max(1, Math.ceil(found.length / perPage));
    if (page > pages) page = pages;
    const shown = found.slice((page - 1) * perPage, page * perPage);

    list.innerHTML = '';
    if (shown.length === 0) {
        list.innerHTML = '<div class="empty">No recipes found</div>';
    }

    shown.forEach(function (r) {
        const div = document.createElement('div');
        div.className = 'recipe';
        const pic = r.image ? '<img src="' + r.image + '" alt="">' : '<div class="noimg">No image</div>';
        div.innerHTML = pic +
            '<div><h3></h3><p></p><div class="actions">' +
            '<button class="green" data-act="view">View</button>' +
            '<button data-act="edit">Edit</button>' +
            '<button class="red" data-act="delete">Delete</button></div></div>';
        div.querySelector('h3').textContent = r.title;
        div.querySelector('p').textContent = r.ingredients.split('\n').length + ' ingredients';
        div.querySelectorAll('button').forEach(function (b) {
            b.onclick = function () { handle(b.dataset.act, r.id); };
        });
        list.appendChild(div);
    });

    pager.innerHTML = '';
    if (pages > 1) {
        for (let i = 1; i <= pages; i++) {
            const b = document.createElement('button');
            b.textContent = i;
            if (i === page) b.className = 'current';
            b.onclick = function () { page = i; render(); };
            pager.appendChild(b);
        }
    }
}

function handle(action, id) {
    if (action === 'view') viewRecipe(id);
    if (action === 'edit') startEdit(id);
    if (action === 'delete') {
        if (confirm('Delete this recipe?')) {
            deleteRecipe(id);
            if (editId === id) resetForm();
            render();
        }
    }
}

function viewRecipe(id) {
    const r = recipes.find(function (x) { return x.id === id; });
    const box = document.getElementById('modalContent');
    box.innerHTML = (r.image ? '<img src="' + r.image + '" alt="">' : '') +
        '<h2></h2><h4>Ingredients</h4><pre id="vIng"></pre><h4>Instructions</h4><pre id="vIns"></pre>';
    box.querySelector('h2').textContent = r.title;
    document.getElementById('vIng').textContent = r.ingredients;
    document.getElementById('vIns').textContent = r.instructions;
    document.getElementById('modal').classList.remove('hidden');
}

function startEdit(id) {
    const r = recipes.find(function (x) { return x.id === id; });
    editId = id;
    titleInput.value = r.title;
    ingredientsInput.value = r.ingredients;
    instructionsInput.value = r.instructions;
    imageData = r.image;
    showPreview();
    document.getElementById('formTitle').textContent = 'Edit Recipe';
    document.getElementById('saveBtn').textContent = 'Update Recipe';
    cancelBtn.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    form.reset();
    editId = null;
    imageData = '';
    showPreview();
    ['title', 'ingredients', 'instructions', 'image'].forEach(function (id) { showError(id, ''); });
    document.getElementById('formTitle').textContent = 'Add New Recipe';
    document.getElementById('saveBtn').textContent = 'Add Recipe';
    cancelBtn.classList.add('hidden');
}

function showPreview() {
    if (imageData) {
        preview.src = imageData;
        preview.classList.remove('hidden');
    } else {
        preview.classList.add('hidden');
    }
}

imageInput.onchange = function () {
    const file = imageInput.files[0];
    showError('image', '');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showError('image', 'Please choose an image file');
        imageInput.value = '';
        return;
    }
    if (file.size > 500 * 1024) {
        showError('image', 'Image must be smaller than 500 KB');
        imageInput.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = function () {
        imageData = reader.result;
        showPreview();
    };
    reader.readAsDataURL(file);
};

form.onsubmit = function (e) {
    e.preventDefault();
    if (!validate()) return;

    const data = {
        title: titleInput.value.trim(),
        ingredients: ingredientsInput.value.trim(),
        instructions: instructionsInput.value.trim(),
        image: imageData
    };

    if (editId === null) {
        data.id = Date.now();
        createRecipe(data);
    } else {
        updateRecipe(editId, data);
    }
    resetForm();
    render();
};

cancelBtn.onclick = resetForm;
searchInput.oninput = function () { page = 1; render(); };
document.getElementById('closeBtn').onclick = function () {
    document.getElementById('modal').classList.add('hidden');
};
document.getElementById('modal').onclick = function (e) {
    if (e.target.id === 'modal') e.target.classList.add('hidden');
};

render();
