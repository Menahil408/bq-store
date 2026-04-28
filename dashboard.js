import { auth, db } from './firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, getdoc,} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";

const productList = document.getElementById('product-list');
const addProductBtn = document.getElementById('addProductBtn');
const logoutBtn = document.getElementById('logout-btn');

// 1. Auth Guard: Ensure user is logged in
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = 'index.html';
});

// 2. Add Product
addProductBtn.addEventListener('click', async () => {
  const name = document.getElementById('productName').value;
  const price = document.getElementById('productPrice').value;

  if (name && price) {
   await addDoc(collection(db, "products"), { 
  name, 
  price,
  category: document.getElementById("product-category").value || "Uncategorized",
  imageUrl: img,
  stock: Number(document.getElementById('productStock').value) || 0,
  createdAt: serverTimestamp()
});
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
  }
});

// 3. Real-time Listener to Display Products
onSnapshot(collection(db, "products"), (snapshot) => {
  productList.innerHTML = '';
  snapshot.forEach((productDoc) => {
    const product = productDoc.data();
    const id = productDoc.id;

    productList.innerHTML += `
      <div class="glass p-5 rounded-xl border border-white/5 flex justify-between items-center">
        <div>
          <h4 class="font-bold text-teal-100">${product.name}</h4>
          <p class="text-amber-400 font-mono">$${product.price}</p>
        </div>
        <button onclick="editProduct('${id}')" class="text-amber-400 hover:bg-amber-500/10 p-2 rounded-lg transition-all text-xs font-semibold mr-2">Edit</button>
        <button onclick="deleteProduct('${id}')" class="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition">
          Delete
        </button>
      </div>
    `;
  });
});  

// Edit Function
window.editProduct = async (id) => {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  const product = docSnap.data();

  const newName = prompt("Product name:", product.name);
  if (newName === null) return;

  const newPrice = prompt("Product price:", product.price);
  if (newPrice === null) return;

  await updateDoc(docRef, {
    name: newName,
    price: Number(newPrice),
  });
};

// 4. Delete Function (Attached to window for HTML onclick access)
window.deleteProduct = async (id) => {
  if (confirm("Delete this product?")) {
    await deleteDoc(doc(db, "products", id));
  }
};

// 5. Logout
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = '/index.html';
  } catch (err) {
    console.error('Logout error:', err);
    showToast('Logout failed. Try again.', 'error');
  }
});
// ════════════════ CATEGORY MANAGEMENT ════════════════

const categoryNameEl    = document.getElementById("category-name");
const addCategoryForm   = document.getElementById("add-category-form");
const addCategoryBtn    = document.getElementById("add-category-btn");
const categoriesGrid    = document.getElementById("categories-grid");
const categoryError     = document.getElementById("category-error");

// Load Categories
async function loadCategories() {
  try {
    const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    categoriesGrid.innerHTML = "";
    
    if (snap.empty) {
      categoriesGrid.innerHTML = `
        <div class="col-span-full text-center py-8 text-gray-500">
          <div class="text-3xl mb-2">📂</div>
          <p class="text-sm">No categories yet</p>
          <p class="text-xs mt-1">Add your first category above.</p>
        </div>`;
      return;
    }
    
    snap.forEach(d => categoriesGrid.appendChild(createCategoryCard(d.id, d.data())));
  } catch (err) { console.error(err); }
}

// Create Category Card
function createCategoryCard(id, cat) {
  const card = document.createElement("div");
  card.className = "category-card bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center group hover:border-amber-500/60 hover:bg-amber-500/20 transition-all duration-200 cursor-pointer";
  card.innerHTML = `
    <div class="text-2xl mb-2">🏷️</div>
    <p class="text-white text-sm font-semibold mb-3 truncate max-w-full">${cat.name}</p>
    <button onclick="deleteCategory('${id}', event)" 
      class="w-full text-xs text-red-400 border border-red-400/30 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-lg py-1.5 px-2 transition-all duration-200 font-medium opacity-0 group-hover:opacity-100">
      🗑 Delete
    </button>`;
  return card;
}

// Delete Category
window.deleteCategory = async (id, event) => {
  if (event) event.stopPropagation();
  if (!confirm("Delete this category?")) return;
  try {
    await deleteDoc(doc(db, "categories", id));
    showToast("Category deleted!");
    loadCategories();
  } catch (err) {
    showToast("Failed to delete.", "error");
  }
};

// Add Category
addCategoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  categoryError.classList.add("hidden");
  const name = categoryNameEl.value.trim();
  
  if (!name) {
    categoryError.textContent = "Category name is required.";
    categoryError.classList.remove("hidden");
    return;
  }
  
  addCategoryBtn.disabled = true;
  addCategoryBtn.textContent = "Adding…";
  
  try {
    await addDoc(collection(db, "categories"), {
      name,
      createdAt: serverTimestamp()
    });
    categoryNameEl.value = "";
    showToast(`"${name}" added! 🎉`);
    loadCategories();
    populateCategoryDropdown();
  } catch (err) {
    categoryError.textContent = "Failed to add category. Try again.";
    categoryError.classList.remove("hidden");
  } finally {
    addCategoryBtn.disabled = false;
    addCategoryBtn.textContent = "+ Add Category";
  }
});

// Populate Category Dropdown in Add Product Form
async function populateCategoryDropdown() {
  const select = document.getElementById("product-category");
  try {
    const snap = await getDocs(query(collection(db, "categories"), orderBy("createdAt", "desc")));
    select.innerHTML = '<option value="">Select Category…</option>';
    snap.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.data().name;
      opt.textContent = d.data().name;
      select.appendChild(opt);
    });
  } catch (err) { console.error(err); }
}

// Initialize
loadCategories();
populateCategoryDropdown();


// Search/Filter
window.filterProducts = function () {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const cards = document.querySelectorAll('#products-grid > div');
  cards.forEach(card => {
    const name = card.querySelector('h4')?.textContent.toLowerCase() || '';
    card.style.display = name.includes(query) ? '' : 'none';
  });
};