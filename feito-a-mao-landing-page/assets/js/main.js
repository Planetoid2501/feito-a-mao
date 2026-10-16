const products = [
  { id: "vaso-01", name: "Vaso Aurora", category: "ceramica", categoryLabel: "Cerâmica", price: 59.90, description: "Cerâmica artesanal em tom natural.", tag: "Mais querido", image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=700&q=80" },
  { id: "vela-01", name: "Vela Serena", category: "velas", categoryLabel: "Velas", price: 34.90, description: "Aroma suave para desacelerar.", tag: "Feito à mão", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=80" },
  { id: "macrame-01", name: "Macramê Raiz", category: "decoracao", categoryLabel: "Decoração", price: 49.90, description: "Trama artesanal em fibras naturais.", tag: "", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=700&q=80" },
  { id: "caneca-01", name: "Caneca Alma", category: "ceramica", categoryLabel: "Cerâmica", price: 39.90, description: "Uma peça especial para sua rotina.", tag: "Peça especial", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=80" }
];

const currency = value => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const productGrid = document.querySelector("#product-grid");
const cartCount = document.querySelector("#cart-count");
const cartItems = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const cartDrawer = document.querySelector("#cart-drawer");
const cartOverlay = document.querySelector("#cart-overlay");
const toast = document.querySelector("#toast");
let cart = loadCart();
let toastTimeout;

function loadCart() {
  try { return JSON.parse(localStorage.getItem("feitoAMaoCart")) || {}; }
  catch { return {}; }
}
function saveCart() {
  localStorage.setItem("feitoAMaoCart", JSON.stringify(cart));
}
function renderProducts(category = "todos") {
  const visible = products.filter(product => category === "todos" || product.category === category);
  productGrid.innerHTML = visible.map(product => `
    <article class="product-card">
      <div class="product-art">
        <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/600x700/f0e8dc/34483b?text=Feito+%C3%A0+M%C3%A3o'">
        ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ""}
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-buy-row">
          <span class="product-price">${currency(product.price)}</span>
          <button class="add-button" data-add="${product.id}">+ Adicionar</button>
        </div>
      </div>
    </article>`).join("");
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2400);
}
function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  trackEvent("add_to_cart", {
    currency: "BRL",
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: 1 }]
  });
  showToast(`${product.name} foi adicionado à sacola.`);
}
function changeQuantity(id, change) {
  if (!cart[id]) return;
  cart[id] += change;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}
function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCart();
  trackEvent("remove_from_cart", { item_id: id });
}
function renderCart() {
  const entries = Object.entries(cart).filter(([id, quantity]) => products.some(p => p.id === id) && quantity > 0);
  const count = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  const total = entries.reduce((sum, [id, quantity]) => sum + products.find(p => p.id === id).price * quantity, 0);
  cartCount.textContent = count;
  cartTotal.textContent = currency(total);
  if (!entries.length) {
    cartItems.innerHTML = '<p class="empty-cart">Sua sacola está vazia. Encontre uma peça especial na coleção.</p>';
    return;
  }
  cartItems.innerHTML = entries.map(([id, quantity]) => {
    const product = products.find(p => p.id === id);
    return `<div class="cart-item">
      <div><h3>${product.name}</h3><p>${currency(product.price)} cada</p>
        <div class="quantity-controls">
          <button data-change="-1" data-id="${id}" aria-label="Diminuir quantidade">−</button>
          <span>${quantity}</span>
          <button data-change="1" data-id="${id}" aria-label="Aumentar quantidade">+</button>
        </div>
      </div>
      <button class="remove-item" data-remove="${id}">Remover</button>
    </div>`;
  }).join("");
}
function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  cartOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  trackEvent("view_cart", { items: Object.entries(cart).map(([id, quantity]) => {
    const p = products.find(item => item.id === id);
    return p ? { item_id: p.id, item_name: p.name, price: p.price, quantity } : null;
  }).filter(Boolean) });
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOverlay.hidden = true;
  document.body.style.overflow = "";
}

productGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(button.dataset.add);
});
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    renderProducts(button.dataset.category);
    trackEvent("select_content", { content_type: "product_category", item_id: button.dataset.category });
  });
});
cartItems.addEventListener("click", event => {
  const change = event.target.closest("[data-change]");
  const remove = event.target.closest("[data-remove]");
  if (change) changeQuantity(change.dataset.id, Number(change.dataset.change));
  if (remove) removeFromCart(remove.dataset.remove);
});
document.querySelector("#open-cart").addEventListener("click", openCart);
document.querySelector("#close-cart").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
document.querySelector("#checkout-button").addEventListener("click", () => {
  const entries = Object.entries(cart).filter(([, quantity]) => quantity > 0);
  const message = document.querySelector("#checkout-message");
  if (!entries.length) {
    message.textContent = "Adicione pelo menos um produto antes de continuar.";
    return;
  }
  const value = entries.reduce((sum, [id, quantity]) => sum + products.find(p => p.id === id).price * quantity, 0);
  trackEvent("begin_checkout", {
    currency: "BRL",
    value,
    items: entries.map(([id, quantity]) => {
      const p = products.find(item => item.id === id);
      return { item_id: p.id, item_name: p.name, price: p.price, quantity };
    })
  });
  trackEvent("purchase", {
    transaction_id: "TEST-" + Date.now(),
    currency: "BRL",
    value,
    items: entries.map(([id, quantity]) => {
      const p = products.find(item => item.id === id);
      return { item_id: p.id, item_name: p.name, price: p.price, quantity };
    })
  });
  message.textContent = "Pedido de teste concluído! Nenhum pagamento foi realizado.";
  cart = {};
  saveCart();
  renderCart();
  showToast("Pedido de teste registrado.");
});
document.querySelector("#newsletter-form").addEventListener("submit", event => {
  event.preventDefault();
  const message = document.querySelector("#newsletter-message");
  message.textContent = "Demonstração concluída. Nenhum e-mail foi enviado ou armazenado.";
  trackEvent("sign_up", { method: "newsletter_demo" });
  event.target.reset();
});
document.querySelectorAll("[data-track]").forEach(element => {
  element.addEventListener("click", () => trackEvent("select_content", { content_type: "cta", item_id: element.dataset.track }));
});
document.querySelector("#menu-toggle").addEventListener("click", event => {
  const nav = document.querySelector("#main-nav");
  const open = nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});
document.querySelectorAll("#main-nav a").forEach(link => link.addEventListener("click", () => {
  document.querySelector("#main-nav").classList.remove("open");
  document.querySelector("#menu-toggle").setAttribute("aria-expanded", "false");
}));
document.querySelector("#year").textContent = new Date().getFullYear();

renderProducts();
renderCart();
trackEvent("view_item_list", {
  item_list_name: "Coleção principal",
  items: products.map(p => ({ item_id: p.id, item_name: p.name, price: p.price }))
});
