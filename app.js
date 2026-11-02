const API = window.ORBIT_API_URL || "https://api.smm.babiesiq.tech/api";
let token = localStorage.getItem("orbit_token");
let orders = [];
let services = [];

const statusLabel = {processing:"Processing", completed:"Completed", pending:"Pending"};
const row = (order, full = false) => {
  const qty = order.qty || Number(order.quantity).toLocaleString();
  const amount = order.amount?.toString().startsWith("$") ? order.amount : `$${Number(order.amount).toFixed(2)}`;
  const progress = order.progress || (order.status === "completed" ? 100 : 42);
  return `<tr><td>${order.id}</td><td>${order.service}<small>${full ? "Premium service" : "Standard delivery"}</small></td><td>${order.link}</td><td>${qty}</td>${full ? `<td><div class="progress mini"><i style="width:${progress}%"></i></div>${progress}%</td>` : ""}<td><span class="status ${order.status}">${statusLabel[order.status]}</span></td><td class="amount">${amount}</td></tr>`;
};

document.querySelector("#recent-orders").innerHTML = orders.slice(0, 3).map(order => row(order)).join("");
document.querySelector("#all-orders").innerHTML = orders.map(order => row(order, true)).join("");

async function api(path, options = {}) {
  const headers = {"Content-Type": "application/json"};
  if (token) headers.Authorization = "Bearer " + token;
  const response = await fetch(API + path, {...options, headers: {...headers, ...(options.headers || {})}});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Something went wrong");
  return result;
}

function renderOrders(items) {
  document.querySelector("#recent-orders").innerHTML = items.slice(0, 3).map(order => row(order)).join("");
  document.querySelector("#all-orders").innerHTML = items.map(order => row(order, true)).join("");
}

function renderServices(items) {
  services = items;
  const catalog = document.querySelector("#service-catalog");
  if (catalog) {
    catalog.innerHTML = items.map(service => `<article class="service-card"><div class="service-logo instagram">✦</div><h2>${escapeHTML(service.name)}</h2><p>${escapeHTML(service.type || "Social growth service")} · ${Number(service.rate || 0).toFixed(2)} per 1k</p><button data-go="new-order" data-service-id="${service.service}">Order this service →</button></article>`).join("") || '<p class="muted">No live services available.</p>';
  }
  const options = items.map(service => `<option value="${service.rate}" data-service-id="${service.service}" data-service-name="${service.name}" data-min="${service.min}" data-max="${service.max}">${service.name} · ${service.rate}/1k</option>`).join("");
  document.querySelector("#service").innerHTML = options;
  document.querySelector("#quick-service").innerHTML = items.slice(0, 20).map(service => `<option value="${service.service}">${service.name}</option>`).join("");
  updatePrice("#order-quantity", "#form-price", "#service");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

async function loadServices() {
  try {
    const result = await api("/services");
    renderServices(result.services || []);
  } catch (error) {
    toast("Service catalog unavailable: " + error.message);
  }
}

async function loadAccount() {
  if (!token) return;
  try {
    const [account, orderData] = await Promise.all([api("/me"), api("/orders")]);
    document.querySelector("#auth-screen").classList.add("hidden");
    orders = orderData.orders || [];
    renderOrders(orders);
    document.querySelector(".balance strong").textContent = `$${account.user.balance.toFixed(2)}`;
  } catch {
    localStorage.removeItem("orbit_token");
    token = null;
  }
}

const toast = (message) => {
  const node = document.querySelector("#toast");
  node.textContent = message;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 2800);
};

function showView(viewId) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === viewId));
  window.scrollTo({top: 0, behavior: "smooth"});
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-go], .nav-item");
  if (target) showView(target.dataset.go || target.dataset.view);
});

const updatePrice = (inputId, priceId, serviceId) => {
  const quantity = Math.max(0, Number(document.querySelector(inputId).value) || 0);
  const rate = serviceId ? Number(document.querySelector(serviceId).value) : 2.4;
  document.querySelector(priceId).textContent = `$${(quantity / 1000 * rate).toFixed(2)}`;
};

document.querySelector("#quick-quantity").addEventListener("input", () => updatePrice("#quick-quantity", "#quick-price"));
document.querySelector("#order-quantity").addEventListener("input", () => updatePrice("#order-quantity", "#form-price", "#service"));
document.querySelector("#service").addEventListener("change", () => updatePrice("#order-quantity", "#form-price", "#service"));
document.querySelector("#quick-submit").addEventListener("click", () => {
  if (!document.querySelector("#quick-link").value.trim()) return toast("Please add a profile or post link first.");
  const service = document.querySelector("#quick-service").selectedOptions[0];
  api("/orders", {method:"POST", body:JSON.stringify({serviceId:Number(service.value), service:service.textContent, link:document.querySelector("#quick-link").value, quantity:Number(document.querySelector("#quick-quantity").value), rate:2.4})})
    .then(result => { toast("Order created successfully — opening order tracker."); orders = [result.order, ...orders]; renderOrders(orders); showView("orders"); })
    .catch(error => toast(error.message));
});
document.querySelector("#place-order").addEventListener("click", () => {
  if (!document.querySelector("#order-link").value.trim()) return toast("Please add a profile or post link first.");
  const service = document.querySelector("#service").selectedOptions[0];
  api("/orders", {method:"POST", body:JSON.stringify({serviceId:Number(service.dataset.serviceId), service:service.dataset.serviceName, link:document.querySelector("#order-link").value, quantity:Number(document.querySelector("#order-quantity").value), rate:Number(service.value)})})
    .then(result => { toast("Your order has been placed successfully."); orders = [result.order, ...orders]; renderOrders(orders); setTimeout(() => showView("orders"), 700); })
    .catch(error => toast(error.message));
});
document.querySelector("#fund-button").addEventListener("click", () => {
  api("/wallet/add-funds", {method:"POST", body:JSON.stringify({amount:Number(document.querySelector("#fund-amount").value)})})
    .then(result => { document.querySelector(".balance strong").textContent = `$${result.user.balance.toFixed(2)}`; toast("Funds added to your demo wallet."); })
    .catch(error => toast(error.message));
});
document.querySelectorAll(".amounts button").forEach(button => button.addEventListener("click", () => {
  document.querySelector("#fund-amount").value = button.textContent.replace("$", "");
  document.querySelectorAll(".amounts button").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
}));

document.querySelector("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const errorNode = document.querySelector("#auth-error");
  errorNode.textContent = "";
  try {
    const result = await api("/auth/login", {method:"POST", body:JSON.stringify({email:document.querySelector("#login-email").value, password:document.querySelector("#login-password").value})});
    token = result.token;
    localStorage.setItem("orbit_token", token);
    await loadAccount();
  } catch (error) {
    errorNode.textContent = error.message;
  }
});

loadServices();
loadAccount();
