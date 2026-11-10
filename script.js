// ====== DATA PRODUK ======
const PRODUCTS = [
  { id: 1, robux: 80,   price: 15000,  bonus: 0,   tag: "" },
  { id: 2, robux: 400,  price: 72000,  bonus: 0,   tag: "" },
  { id: 3, robux: 800,  price: 140000, bonus: 0,   tag: "Populer" },
  { id: 4, robux: 1700, price: 285000, bonus: 100, tag: "Hemat" },
  { id: 5, robux: 4500, price: 710000, bonus: 300, tag: "Best Deal" },
  { id: 6, robux: 10000,price: 1500000,bonus: 1000,tag: "Sultan" },
];

const PAYMENTS = [
  { id: "qris",   name: "QRIS",      icon: "📱", fee: 0 },
  { id: "gopay",  name: "GoPay",     icon: "🟢", fee: 1000 },
  { id: "ovo",    name: "OVO",       icon: "🟣", fee: 1000 },
  { id: "dana",   name: "DANA",      icon: "🔵", fee: 1000 },
  { id: "shopee", name: "ShopeePay", icon: "🟠", fee: 1000 },
  { id: "bank",   name: "Transfer",  icon: "🏦", fee: 2500 },
];

// ====== STATE ======
let cart = load("rm_cart", []);
let selectedPay = null;

// ====== HELPERS ======
const $ = (s) => document.querySelector(s);
const rupiah = (n) => "Rp" + n.toLocaleString("id-ID");
const fmt = (n) => n.toLocaleString("id-ID");
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2000);
}
const perRobux = (p) => p.price / (p.robux + p.bonus);

// ====== RENDER PRODUK ======
function renderProducts() {
  const q = $("#search").value.trim();
  const sort = $("#sort").value;
  let list = PRODUCTS.filter((p) => String(p.robux).includes(q));

  if (sort === "asc") list.sort((a, b) => a.price - b.price);
  if (sort === "desc") list.sort((a, b) => b.price - a.price);
  if (sort === "best") list.sort((a, b) => perRobux(a) - perRobux(b));

  $("#emptyMsg").hidden = list.length > 0;
  $("#productGrid").innerHTML = list.map((p) => `
    <div class="product">
      ${p.tag ? `<span class="tag">${p.tag}</span>` : ""}
      <div class="ico">💎</div>
      <h3>${fmt(p.robux)} <small>Robux</small></h3>
      <div class="bonus">${p.bonus ? `+ Bonus ${fmt(p.bonus)} Robux` : ""}</div>
      <div class="price">${rupiah(p.price)}</div>
      <button class="btn btn-primary" data-add="${p.id}">+ Keranjang</button>
    </div>`).join("");
}

// ====== KERANJANG ======
function addToCart(id) {
  const item = cart.find((c) => c.id === id);
  if (item) item.qty++;
  else cart.push({ id, qty: 1 });
  updateCart();
  toast("Ditambahkan ke keranjang ✓");
}
function changeQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((c) => c.id !== id);
  updateCart();
}
function removeItem(id) {
  cart = cart.filter((c) => c.id !== id);
  updateCart();
}
const cartTotal = () =>
  cart.reduce((sum, c) => sum + PRODUCTS.find((p) => p.id === c.id).price * c.qty, 0);

function updateCart() {
  save("rm_cart", cart);
  $("#cartCount").textContent = cart.reduce((s, c) => s + c.qty, 0);
  $("#cartTotal").textContent = rupiah(cartTotal());

  $("#cartItems").innerHTML = cart.length
    ? cart.map((c) => {
        const p = PRODUCTS.find((x) => x.id === c.id);
        return `
        <div class="cart-item">
          <div style="font-size:1.8rem">💎</div>
          <div class="info">
            <b>${fmt(p.robux)} Robux</b>${p.bonus ? ` <small>+${fmt(p.bonus)} bonus</small>` : ""}<br>
            <small>${rupiah(p.price)}</small>
          </div>
          <div class="qty">
            <button data-dec="${p.id}">−</button><span>${c.qty}</span><button data-inc="${p.id}">+</button>
          </div>
          <button class="rm" data-rm="${p.id}" aria-label="Hapus">🗑</button>
        </div>`;
      }).join("")
    : `<p class="cart-empty">Keranjang masih kosong 🛒</p>`;
}

function openCart(open) {
  $("#drawer").classList.toggle("open", open);
  $("#overlay").classList.toggle("show", open);
}

// ====== CHECKOUT ======
function renderPayments() {
  $("#payGrid").innerHTML = PAYMENTS.map((p) => `
    <div class="pay" data-pay="${p.id}"><div style="font-size:1.4rem">${p.icon}</div>${p.name}</div>`).join("");
}
function renderSummary() {
  const sub = cartTotal();
  const pay = PAYMENTS.find((p) => p.id === selectedPay);
  const fee = pay ? pay.fee : 0;
  const rows = cart.map((c) => {
    const p = PRODUCTS.find((x) => x.id === c.id);
    return `<div><span>${fmt(p.robux + p.bonus)} Robux × ${c.qty}</span><span>${rupiah(p.price * c.qty)}</span></div>`;
  }).join("");
  $("#summary").innerHTML = `${rows}
    <div><span>Biaya layanan</span><span>${rupiah(fee)}</span></div>
    <div class="sum-total"><span>Total Bayar</span><span>${rupiah(sub + fee)}</span></div>`;
}
function openModal(id) { $(id).hidden = false; }
function closeModals() { document.querySelectorAll(".modal").forEach((m) => (m.hidden = true)); }

function validate() {
  let ok = true;
  const user = $("#username").value.trim();
  const wa = $("#wa").value.trim();
  $("#errUser").textContent = $("#errWa").textContent = $("#errPay").textContent = "";

  if (!/^[A-Za-z0-9_]{3,20}$/.test(user)) {
    $("#errUser").textContent = "Username 3–20 karakter (huruf, angka, underscore).";
    ok = false;
  }
  if (!/^(08|628)\d{8,12}$/.test(wa)) {
    $("#errWa").textContent = "Nomor WhatsApp tidak valid (contoh: 08123456789).";
    ok = false;
  }
  if (!selectedPay) {
    $("#errPay").textContent = "Pilih metode pembayaran.";
    ok = false;
  }
  return ok;
}

function submitOrder(e) {
  e.preventDefault();
  if (!validate()) return;

  const pay = PAYMENTS.find((p) => p.id === selectedPay);
  const total = cartTotal() + pay.fee;
  const order = {
    id: "RM" + Date.now().toString().slice(-8),
    date: new Date().toLocaleString("id-ID"),
    username: $("#username").value.trim(),
    items: cart.map((c) => {
      const p = PRODUCTS.find((x) => x.id === c.id);
      return { robux: p.robux + p.bonus, qty: c.qty };
    }),
    method: pay.name,
    total,
  };

  const history = load("rm_orders", []);
  history.unshift(order);
  save("rm_orders", history);

  const totalRobux = order.items.reduce((s, i) => s + i.robux * i.qty, 0);
  $("#successInfo").innerHTML =
    `ID Pesanan: <b>${order.id}</b><br>${fmt(totalRobux)} Robux untuk <b>${order.username}</b><br>Total: ${rupiah(total)} via ${pay.name}<br><small>(Simulasi demo — tidak ada pembayaran nyata)</small>`;

  cart = [];
  selectedPay = null;
  updateCart();
  $("#checkoutForm").reset();
  closeModals();
  openModal("#modalSuccess");
}

function renderHistory() {
  const h = load("rm_orders", []);
  $("#historyList").innerHTML = h.length
    ? h.map((o) => `
      <div class="hist">
        <b>${o.id}</b> — ${rupiah(o.total)}
        <small>${o.date} • ${o.username} • ${o.method}</small>
        <small>${o.items.map((i) => `${fmt(i.robux)} R$ ×${i.qty}`).join(", ")}</small>
      </div>`).join("")
    : `<p class="cart-empty" style="margin:30px 0">Belum ada pesanan.</p>`;
}

// ====== EVENTS ======
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.add) addToCart(+t.dataset.add);
  if (t.dataset.inc) changeQty(+t.dataset.inc, 1);
  if (t.dataset.dec) changeQty(+t.dataset.dec, -1);
  if (t.dataset.rm) removeItem(+t.dataset.rm);
  if (t.hasAttribute("data-close") || t.classList.contains("modal")) closeModals();

  const pay = t.closest("[data-pay]");
  if (pay) {
    selectedPay = pay.dataset.pay;
    document.querySelectorAll(".pay").forEach((el) => el.classList.toggle("active", el === pay));
    renderSummary();
  }
});

$("#btnCart").onclick = () => openCart(true);
$("#closeCart").onclick = $("#overlay").onclick = () => openCart(false);
$("#burger").onclick = () => $("#nav").classList.toggle("open");
$("#nav").addEventListener("click", () => $("#nav").classList.remove("open"));
$("#search").oninput = $("#sort").onchange = renderProducts;
$("#checkoutForm").onsubmit = submitOrder;

$("#btnCheckout").onclick = () => {
  if (!cart.length) return toast("Keranjang masih kosong!");
  openCart(false);
  renderPayments();
  selectedPay = null;
  renderSummary();
  openModal("#modalCheckout");
};
$("#btnRiwayat").onclick = (e) => {
  e.preventDefault();
  renderHistory();
  openModal("#modalHistory");
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeModals(); openCart(false); }
});

// ====== INIT ======
renderProducts();
updateCart();