const products = [
 {id:"cesto-aruma",name:"Cesto Arumã",category:"cestaria",categoryLabel:"Cestaria",price:89.90,description:"Trama de fibras naturais para organizar com afeto.",material:"Fibras vegetais trançadas",size:"Varia conforme a peça",care:"Limpar com pano seco. Evitar umidade.",image:"assets/img/cesto.webp",tag:"Tramas da floresta"},
 {id:"vaso-rio",name:"Vaso Rio",category:"ceramica",categoryLabel:"Cerâmica",price:119.90,description:"Barro e curvas inspiradas nos caminhos dos rios.",material:"Cerâmica decorativa",size:"Varia conforme a peça",care:"Pano macio. Não usar com alimentos.",image:"assets/img/vaso.webp",tag:"Tempo do barro"},
 {id:"colar-semente",name:"Colar Semente",category:"biojoias",categoryLabel:"Biojoias",price:64.90,description:"Sementes e cordão em uma composição orgânica.",material:"Sementes de tucumã e açaí, com cordão",size:"Varia conforme a peça",care:"Evitar água e perfumes. Guardar seco.",image:"assets/img/colar.webp",tag:"Leve por natureza"},
 {id:"bolsa-trama",name:"Bolsa Trama",category:"cestaria",categoryLabel:"Cestaria",price:149.90,description:"Textura natural para acompanhar os seus caminhos.",material:"Fibra vegetal trançada",size:"Varia conforme a peça",care:"Limpar a seco, sem excesso de peso.",image:"assets/img/bolsa.webp",tag:"Para levar consigo"}
];
let selectedCategory = "todos";
let visibleProducts = products;
let listVisible = false;
let lastListSignature = "";
let detailProductId = null;
let searchTimer;
let searchPending = false;
let shippingConfirmed = false;
function listContext() {
  return {item_list_id: "catalogo_" + selectedCategory, item_list_name: "Coleção Amazônia / " + selectedCategory};
}
function productItem(p, quantity = 1) {
  return {item_id:p.id,item_name:p.name,item_brand:"Feito à Mão Amazônia",item_category:p.categoryLabel,price:p.price,quantity,...listContext()};
}
function measureList() {
  if (!listVisible || searchPending) return;
  const signature=JSON.stringify([selectedCategory,visibleProducts.map(p=>p.id)]);
  if(signature === lastListSignature) return;
  if(trackEvent("view_item_list", {...listContext(),items:visibleProducts.map((p,index)=>({...productItem(p),index}))})) lastListSignature=signature;
}
function visibleAnalyticsPage() {
  if(detailProductId) return "produto/"+detailProductId;
  if(document.querySelector("#checkout-dialog").open) return "checkout";
  if(document.querySelector("#cart-drawer").classList.contains("open")) return "sacola";
  return normalizePage(location.hash);
}
function measureCartChange(id, delta) {
  if(!delta) return;
  const p=products.find(p=>p.id===id);
  trackEvent(delta>0 ? "add_to_cart" : "remove_from_cart",{currency:"BRL",value:Math.round(p.price*Math.abs(delta)*100)/100,items:[productItem(p,Math.abs(delta))]});
}
const storage = { get(key) { try { return localStorage.getItem(key); } catch { return null; } }, set(key,value) { try { localStorage.setItem(key,value); } catch { /* Navegação continua sem persistência. */ } } };
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
  try { const saved = JSON.parse(storage.get("feitoAMaoCart")); return Object.fromEntries(Object.entries(saved || {}).filter(([id,q]) => products.some(p => p.id === id) && Number.isInteger(q) && q > 0 && q <= 99)); }
  catch { return {}; }
}
function saveCart() {
  storage.set("feitoAMaoCart", JSON.stringify(cart));
}
function renderProducts(category = selectedCategory) {
  selectedCategory = category;
  const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const query = normalize(document.querySelector("#search").value.trim());
  const visible = products.filter(product => (category === "todos" || product.category === category) && normalize(product.name + " " + product.material).includes(query));
  visibleProducts = visible;
  document.querySelector("#result-count").textContent = `${visible.length} ${visible.length === 1 ? "peça encontrada" : "peças encontradas"}`;

  productGrid.innerHTML = visible.map(product => `
    <article class="product-card">
      <div class="product-art">
        <img src="${product.image}" alt="${product.name}" loading="lazy" width="1400" height="1000">
        ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ""}
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <button class="detail-link" data-detail="${product.id}">Conhecer a peça ↗</button><p class="product-description">${product.description}</p>
        <div class="product-buy-row">
          <span class="product-price">${currency(product.price)}</span>
          <button class="add-button" data-add="${product.id}">+ Adicionar</button>
        </div>
      </div>
    </article>`).join("");
  measureList();
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
  const previous = cart[id] || 0;
  if(previous >= 99) return;
  cart[id] = previous + 1;
  saveCart();
  renderCart();
  measureCartChange(id, 1);
  showToast(`${product.name} foi adicionado à sacola.`);
}
function changeQuantity(id, change) {
  if (!cart[id]) return;
  const previous=cart[id];
  cart[id] = Math.max(0,Math.min(99, cart[id] + change));
  measureCartChange(id,cart[id]-previous);
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}
function removeFromCart(id) {
  if(!cart[id]) return;
  measureCartChange(id,-cart[id]);
  delete cart[id];
  saveCart();
  renderCart();
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
function openCart(measure = true) {
  document.querySelectorAll("body > header, body > main, body > footer").forEach(el=>el.inert=true);
  cartDrawer.inert = false;
  cartDrawer.classList.add("open");
  document.querySelector("#close-cart").focus();
  cartDrawer.setAttribute("aria-hidden", "false");
  cartOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  if(measure) { trackPage("sacola"); trackEvent("view_cart", {currency:"BRL",value:subtotal(),items:analyticsItems()}); }

}
function closeCart(restorePage = true) {
  document.querySelectorAll("body > header, body > main, body > footer").forEach(el=>el.inert=false);
  cartDrawer.inert = true;
  cartDrawer.classList.remove("open");
  document.querySelector("#open-cart").focus();
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOverlay.hidden = true;
  document.body.style.overflow = "";
  if(restorePage) trackPage(visibleAnalyticsPage());
}

productGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(button.dataset.add);
});
document.querySelectorAll("[data-category]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-category]").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    renderProducts(button.dataset.category);
    trackEvent("filter_products", {filter_category:button.dataset.category,result_count:visibleProducts.length});
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
const analyticsItems = () => Object.entries(cart).map(([id,quantity]) => { const p = products.find(p => p.id === id); return productItem(p,quantity); });
const subtotal = () => analyticsItems().reduce((sum,p) => sum + p.price*p.quantity,0);
const checkoutDialog = document.querySelector("#checkout-dialog");
const round = n => Math.round(n*100)/100;
function quote() {
 const cep = document.querySelector("#cep").value.replace(/\D/g, "");
 const valid = cep.length === 8;
 const shipping = valid ? (cep.startsWith("6") ? 18 : 32) : 0;
 const coupon = document.querySelector("#coupon").value.trim().toUpperCase();
 const rate = coupon === "AMAZONIA10" ? .10 : document.querySelector("#payment").value === "pix" ? .05 : 0;
 const discount = round(subtotal()*rate);
 return {valid,shipping,discount,total:round(subtotal()-discount+shipping),coupon};
}
function renderQuote() {
 const q = quote();
 document.querySelector("#order-summary").textContent = `Produtos: ${currency(subtotal())} · Desconto: ${currency(q.discount)} · Frete: ${q.valid ? currency(q.shipping) : "informe um CEP"} · Total: ${currency(q.total)}. ${q.coupon && q.coupon !== "AMAZONIA10" ? "Cupom não reconhecido." : ""}`;
}
document.querySelector("#checkout-button").addEventListener("click", () => {
 if (!Object.keys(cart).length) { document.querySelector("#checkout-message").textContent = "Adicione uma peça à sacola."; return; }
 closeCart(false); shippingConfirmed=false;
 document.querySelector("#confirm-order").disabled=true;
 document.querySelector("#shipping-status").textContent="";
 renderQuote(); checkoutDialog.showModal(); trackPage("checkout");
 trackEvent("begin_checkout",{currency:"BRL",value:subtotal(),items:analyticsItems()});
});
document.querySelector("#checkout-form").addEventListener("input",renderQuote);
document.querySelector("#checkout-form").addEventListener("submit",event => {
 event.preventDefault(); const q=quote(); if(!shippingConfirmed || !q.valid || !Object.keys(cart).length) return;
 const id="TEST-"+crypto.randomUUID();
 const payment=document.querySelector("#payment").value;
 const discountedItems=discountedCart(q.discount);
 trackEvent("add_payment_info",{currency:"BRL",value:round(subtotal()-q.discount),payment_type:payment,items:discountedItems});
 trackPage("confirmacao");
 trackEvent("purchase",{transaction_id:id,currency:"BRL",value:round(subtotal()-q.discount),shipping:q.shipping,coupon:q.coupon === "AMAZONIA10" ? q.coupon : undefined,items:discountedItems,order_type:"simulation"});
 const receipt=`Seleção ${id} registrada. Total ${currency(q.total)}, incluindo frete ${currency(q.shipping)}. Nenhuma cobrança foi realizada.`;
 storage.set("feitoAMaoOrder",receipt); document.querySelector("#last-order").textContent=receipt;
 cart={}; saveCart(); renderCart(); checkoutDialog.close(); openCart(false); document.querySelector("#checkout-message").textContent=receipt;
});
document.querySelector("#newsletter-form").addEventListener("submit", event => {
  event.preventDefault();
  const message = document.querySelector("#newsletter-message");
  message.textContent = "Obrigado pelo interesse! Acompanhe as novidades por aqui.";
  trackEvent("select_content", { content_type: "collection_interest" });
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
// Count list impressions only when the catalog enters the viewport.
const catalogObserver = new IntersectionObserver(entries=>{
 listVisible=entries.some(entry=>entry.isIntersecting);
 if(listVisible) measureList();
},{threshold:0.1});
catalogObserver.observe(productGrid);
document.addEventListener("analytics-ready",()=>{lastListSignature="";measureList();});
let lastSearch = "";
function measureSearch() {
 clearTimeout(searchTimer);
 searchPending=false;measureList();
 const term=document.querySelector("#search").value.trim().toLowerCase().slice(0,80);
 if(!term){lastSearch="";return;}
 if(term===lastSearch || /@|https?:|[0-9]{5}/i.test(term))return;
 if(trackEvent("search",{search_term:term,result_count:visibleProducts.length}))lastSearch=term;
}
document.querySelector("#search").addEventListener("input",()=>{searchPending=true;renderProducts();clearTimeout(searchTimer);searchTimer=setTimeout(measureSearch,800);});
document.querySelector("#search").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();measureSearch();}});
document.querySelectorAll(".dialog-close").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
productGrid.addEventListener("click",event=>{
 const b=event.target.closest("[data-detail]"); if(!b)return;
 const p=products.find(p=>p.id===b.dataset.detail);
 document.querySelector("#detail-content").innerHTML=`<img class="detail-image" src="${p.image}" alt="${p.name}"><p class="eyebrow">${p.categoryLabel}</p><h2>${p.name}</h2><p>${p.description}</p><p><strong>Material:</strong> ${p.material}<br><strong>Dimensões:</strong> ${p.size}<br><strong>Cuidados:</strong> ${p.care}</p><p>Texturas naturais e pequenas variações dão personalidade à composição.</p><strong>${currency(p.price)}</strong> <button class="button button-dark" id="detail-add">Adicionar à sacola</button>`;
 document.querySelector("#detail-add").onclick=()=>addToCart(p.id);
 document.querySelector("#detail-dialog").showModal();
 trackEvent("select_item",{...listContext(),items:[{...productItem(p),index:visibleProducts.findIndex(item=>item.id===p.id)}]});
 detailProductId=p.id; trackPage("produto/"+p.id);
 trackEvent("view_item",{currency:"BRL",value:p.price,items:[productItem(p)]});
});
const accountDialog=document.querySelector("#account-dialog");
document.querySelector("#account-button").onclick=()=>accountDialog.showModal();
function accountStatus(){let nickname="";try{nickname=sessionStorage.getItem("feitoAMaoNickname")||"";}catch{} document.querySelector("#account-status").textContent=nickname ? `Olá, ${nickname}. Que bom ter você por aqui.` : "Personalize sua visita com um apelido.";}
document.querySelector("#account-form").onsubmit=event=>{event.preventDefault();const name=document.querySelector("#nickname").value.trim();if(!name)return;try{sessionStorage.setItem("feitoAMaoNickname",name);}catch{}accountStatus();trackEvent("personalize_visit",{method:"nickname"});};
document.querySelector("#logout").onclick=()=>{try{sessionStorage.removeItem("feitoAMaoNickname");}catch{}accountStatus();};
document.querySelector("#last-order").textContent=storage.get("feitoAMaoOrder")||"Suas seleções aparecerão aqui.";
accountStatus();
document.addEventListener("keydown",event=>{if(event.key === "Escape" && cartDrawer.classList.contains("open"))closeCart();if(event.key === "Tab" && cartDrawer.classList.contains("open")){const nodes=[...cartDrawer.querySelectorAll("button,a,input")].filter(n=>!n.disabled);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}}});
window.addEventListener("hashchange",()=>trackPage(visibleAnalyticsPage()));
document.querySelector("#privacy-settings").onclick=()=>{document.querySelector("#cookie-banner").hidden=false;document.querySelector("#accept-cookies").focus();};
document.querySelector("#clear-data").onclick=()=>{try{["feitoAMaoCart","feitoAMaoOrder","feitoAMaoConsent"].forEach(k=>localStorage.removeItem(k));sessionStorage.removeItem("feitoAMaoNickname");}catch{}location.reload();};

// Allocate discount in cents so item revenue and purchase.value agree exactly.
function discountedCart(discount) {
 const units=analyticsItems().flatMap(item=>Array.from({length:item.quantity},()=>({...item,quantity:1})));
 const totalCents=Math.round(subtotal()*100),discountCents=Math.round(discount*100);
 let allocated=0;
 return units.map((item,index)=>{
  const cents=Math.round(item.price*100);
  const share=index===units.length-1 ? discountCents-allocated : Math.floor(discountCents*cents/totalCents);
  allocated+=share;
  return {...item,price:(cents-share)/100,discount:share/100};
 }).reduce((items,item)=>{const existing=items.find(other=>other.item_id===item.item_id && other.price===item.price);if(existing)existing.quantity++;else items.push(item);return items;},[]);
}
document.querySelector("#confirm-shipping").addEventListener("click",()=>{
 const cep=document.querySelector("#cep");
 if(!cep.reportValidity() || !quote().valid || shippingConfirmed)return;
 shippingConfirmed=true;
 document.querySelector("#confirm-order").disabled=false;
 document.querySelector("#shipping-status").textContent="Frete confirmado. Revise o pagamento para finalizar.";
 const q=quote();
 trackEvent("add_shipping_info",{currency:"BRL",value:round(subtotal()-q.discount),shipping_tier:"Entrega padrão",items:discountedCart(q.discount)});
});
document.querySelector("#cep").addEventListener("input",()=>{
 shippingConfirmed=false;document.querySelector("#confirm-order").disabled=true;document.querySelector("#shipping-status").textContent="Confirme o frete para continuar.";
});
document.querySelector("#detail-dialog").addEventListener("close",()=>{detailProductId=null;trackPage(visibleAnalyticsPage());});
checkoutDialog.addEventListener("close",()=>{if(currentAnalyticsPage!=="confirmacao")trackPage(visibleAnalyticsPage());});
