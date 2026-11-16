/* ==========================================
   LÓGICA DE LA CASITA: carrusel, catálogo, buscador, carrito, rutas
   Usa SLIDES, CATEGORIES y PRODUCTS de js/productos.js
   ========================================== */
(function(){
  'use strict';

  var WA_NUMBER = '529831121228';
  var CART_KEY  = 'casita_cart_v1';


  var root = document.getElementById('casita-inicio');
  if(!root) return;

  var grid       = document.getElementById('cas-product-grid');
  var homeCats   = document.getElementById('cas-home-cats');
  var filterBar  = document.getElementById('cas-filter-bar');
  var catTitle   = document.getElementById('cas-cat-title');
  
  var carouselTrack = document.getElementById('cas-carousel-track');
  var carouselDots  = document.getElementById('cas-carousel-dots');

  var fab        = document.getElementById('cas-cart-fab');
  var countEl    = document.getElementById('cas-cart-count');
  var drawer     = document.getElementById('cas-cart');
  var overlay    = document.getElementById('cas-cart-overlay');
  var bodyEl     = document.getElementById('cas-cart-body');
  var totalEl    = document.getElementById('cas-cart-total');
  var headCount  = document.getElementById('cas-cart-head-count');
  var checkout   = document.getElementById('cas-checkout');
  var closeBtn   = document.getElementById('cas-cart-close');
  var clearBtn   = document.getElementById('cas-cart-clear');

  var cart = {};
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch(e){ cart = {}; }

  function save(){ try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch(e){} }
  function money(n){ n = Math.round(n * 100) / 100; return '$' + n.toLocaleString('es-MX'); }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function catName(id){ for(var i=0;i<CATEGORIES.length;i++) if(CATEGORIES[i].id===id) return CATEGORIES[i].name; return ''; }

  /* ---------------- CARRUSEL HERO ---------------- */
  var currentSlide = 0;
  var slideInterval;

  function renderCarousel() {
    if(!carouselTrack || !carouselDots) return;
    var slidesHTML = '';
    var dotsHTML = '';
    SLIDES.forEach(function(s, i) {
      var isActive = i === 0 ? 'active' : '';
      var bgHTML = '';
      if (s.type === 'image') {
        // Versión ligera (-800) para celular; la primera carga con prioridad
        bgHTML = '<img class="cas-slide-bg" src="' + esc(s.src) + '"' +
          ' srcset="' + esc(s.src.replace('.webp', '-800.webp')) + ' 800w, ' + esc(s.src) + ' 1600w" sizes="100vw"' +
          (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') +
          ' alt="" onerror="this.style.display=\'none\'">';      } else if (s.type === 'video') {
        bgHTML = '<video class="cas-slide-bg" src="' + esc(s.src) + '" autoplay muted loop playsinline></video>';
      }
      slidesHTML += 
        '<div class="cas-slide ' + isActive + '" data-idx="' + i + '">' +
          bgHTML +
          '<div class="cas-slide-overlay"></div>' +
          '<div class="cas-slide-content">' +
            (s.kicker ? '<div class="cas-kicker">' + esc(s.kicker) + '</div>' : '') +
            '<h1>' + esc(s.title) + '</h1>' +
            '<p>' + esc(s.desc) + '</p>' +
            '<div class="cas-slide-btns">' +
              (s.btn1 ? '<a href="' + esc(s.btn1Action) + '" class="cas-btn-solid">' + esc(s.btn1) + '</a>' : '') +
              (s.btn2 ? '<a href="' + esc(s.btn2Action) + '" target="_blank" rel="noopener" class="cas-btn-outline">' + esc(s.btn2) + '</a>' : '') +
            '</div>' +
          '</div>' +
        '</div>';
      dotsHTML += '<button type="button" class="cas-dot ' + (i === 0 ? 'active' : '') + '" data-idx="' + i + '" aria-label="Ir al slide ' + (i+1) + '"></button>';
    });
    carouselTrack.innerHTML = slidesHTML;
    carouselDots.innerHTML = dotsHTML;
    startSlideShow();
  }

  function goToSlide(idx) {
    var slides = carouselTrack.querySelectorAll('.cas-slide');
    var dots = carouselDots.querySelectorAll('.cas-dot');
    if(!slides.length) return;
    slides.forEach(function(s) { s.classList.remove('active'); });
    dots.forEach(function(d) { d.classList.remove('active'); });
    if(slides[idx]) slides[idx].classList.add('active');
    if(dots[idx]) dots[idx].classList.add('active');
    currentSlide = idx;
    slides.forEach(function(s, i) {
      var vid = s.querySelector('video');
      if(vid) { if(i === idx) vid.play().catch(function(){}); else vid.pause(); }
    });
  }

  function nextSlide() {
    var next = currentSlide + 1;
    if(next >= SLIDES.length) next = 0;
    goToSlide(next);
  }

  function startSlideShow() {
    clearInterval(slideInterval);
    if (SLIDES.length > 1) slideInterval = setInterval(nextSlide, 8000); 
  }

  if(carouselDots) {
    carouselDots.addEventListener('click', function(e) {
      var dot = e.target.closest('.cas-dot');
      if(!dot) return;
      goToSlide(parseInt(dot.dataset.idx, 10));
      startSlideShow(); 
    });
  }

  var heroCarousel = document.getElementById('cas-carousel');
  if (heroCarousel) {
    heroCarousel.addEventListener('mouseenter', function() { clearInterval(slideInterval); });
    heroCarousel.addEventListener('mouseleave', startSlideShow);
  }

  /* ---------------- Home categorías ---------------- */
  function renderHomeCats(){
    if(!homeCats) return;
    homeCats.innerHTML = CATEGORIES.map(function(c){
      return '<a class="cas-cat" href="#/catalogo/' + c.id + '">' +
        '<span class="emoji">' + c.emoji + '</span>' +
        '<strong>' + esc(c.name) + '</strong>' +
      '</a>';
    }).join('');
  }

  function renderFilterBar(){
    if(!filterBar) return;
    filterBar.innerHTML =
      '<button type="button" class="cas-chip active" data-goto="all">📦 Todos</button>' +
      CATEGORIES.map(function(c){
        return '<button type="button" class="cas-chip" data-goto="' + c.id + '">' + c.emoji + ' ' + esc(c.name) + '</button>';
      }).join('');
  }

  function setActiveChip(target){
    if(!filterBar) return;
    filterBar.querySelectorAll('.cas-chip').forEach(function(chip){
      chip.classList.toggle('active', chip.dataset.goto === target);
    });
  }

  function productCard(p){
    var img = p.img ? '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.remove()">' : '';
    return '' +
      '<article class="cas-product" data-id="' + esc(p.id) + '" data-name="' + esc(p.name) + '" data-price="' + p.price + '">' +
        '<div class="cas-prod-art">' + img + '</div>' +
        '<div class="cas-prod-info">' +
          '<div class="cas-small">' + esc(catName(p.cat)) + '</div>' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<div class="cas-price">' + money(p.price) + '</div>' +
          '<button type="button" class="cas-add">Agregar al carrito 🛒</button>' +
          '<div class="cas-card-qty">' +
            '<div class="cas-card-qty-group">' +
              '<button type="button" data-card-act="minus" aria-label="Quitar uno" disabled>−</button>' +
              '<span class="cas-card-count">0</span>' +
              '<button type="button" data-card-act="plus" aria-label="Agregar uno">+</button>' +
            '</div>' +
            '<button type="button" class="cas-card-gocart">Ver carrito →</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderCatalog(filterCat){
    if(!grid) return;
    filterCat = filterCat || 'all';
    var catsToShow = filterCat === 'all' ? CATEGORIES : CATEGORIES.filter(function(c){ return c.id === filterCat; });
    var html = '';
    catsToShow.forEach(function(c){
      var prods = PRODUCTS.filter(function(p){ return p.cat === c.id; });
      if(!prods.length) return;
      html += '<div class="cas-cat-section" id="cat-' + c.id + '" data-cat="' + c.id + '">' +
        '<h2><span class="cas-cat-emoji">' + c.emoji + '</span>' + esc(c.name) + ' <small>(' + prods.length + ' productos)</small></h2>' +
        '<div class="cas-products">' + prods.map(productCard).join('') + '</div>' +
      '</div>';
    });
    if(!html) html = '<div class="cas-no-results"><span>📦</span><p>No hay productos aquí todavía</p><small>Prueba otra categoría.</small></div>';
    grid.innerHTML = html;
    if(catTitle){
      if(filterCat === 'all') catTitle.textContent = 'Catálogo completo';
      else {
        var c = CATEGORIES.filter(function(x){ return x.id === filterCat; })[0];
        catTitle.textContent = c ? c.emoji + ' ' + c.name : 'Catálogo';
      }
    }
    syncCardQtys();
  }

  function syncCardQtys(){
    if(!grid) return;
    grid.querySelectorAll('.cas-product').forEach(function(card){
      var id = card.dataset.id;
      var q = cart[id] ? cart[id].qty : 0;
      var countSpan = card.querySelector('.cas-card-count');
      var minusBtn  = card.querySelector('[data-card-act="minus"]');
      if(countSpan) countSpan.textContent = q;
      if(minusBtn)  minusBtn.disabled = q <= 0;
    });
  }

  /* ---------------- Router ---------------- */
  var views = root.querySelectorAll('.cas-view');
  function showView(name){
    views.forEach(function(v){ v.classList.toggle('active', v.dataset.view === name); });
  }
  
  /* Lleva a una sección del inicio (Gaming, Contacto) aunque estés en el catálogo */
  function goToSection(id){
    var el = document.getElementById(id);
    if(!el) return;
    var view = el.closest('.cas-view');
    if(view && !view.classList.contains('active')){
      showView(view.dataset.view);
      history.replaceState(null, '', '#/' + view.dataset.view);
    }
    setTimeout(function(){ el.scrollIntoView({behavior:'smooth', block:'start'}); }, 50);
  }

  var pendingFilter = null;
  var suppressHashClear = false;

  function handleHash(){
    var hash = location.hash.replace(/^#\/?/, '');
    
        if (document.getElementById(hash)) {
      goToSection(hash);
      return;
    }

    var parts = hash.split('/');
    var view = parts[0] || 'inicio';
    var cat = parts[1] || 'all';

    if(view === 'catalogo'){
      showView('catalogo');
      renderCatalog(cat);
      setActiveChip(cat);
      window.scrollTo({top:0, behavior:'smooth'});

      if(pendingFilter){
        var pf = pendingFilter;
        pendingFilter = null;
        applyFilterToGrid(pf.ql);
        if(input) input.value = pf.q;
      }
    } else {
      showView('inicio');
      window.scrollTo({top:0, behavior:'smooth'});
    }
  }

  window.addEventListener('hashchange', function(){
    if(suppressHashClear){ suppressHashClear = false; return; }
    clearSearch();
    handleHash();
  });

  if(filterBar){
    filterBar.addEventListener('click', function(e){
      var chip = e.target.closest('.cas-chip');
      if(!chip) return;
      var target = chip.dataset.goto;
      var newHash = '#/catalogo' + (target === 'all' ? '' : '/' + target);
      if(location.hash === newHash){
        clearSearch();
        renderCatalog(target);
        setActiveChip(target);
        window.scrollTo({top:0, behavior:'smooth'});
      } else {
        location.hash = newHash;
      }
    });
  }

  root.querySelectorAll('[data-scroll-to]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
            goToSection(a.dataset.scrollTo);
    });
  });

  /* ---------------- Carrito ---------------- */
  function totals(){
    var qty = 0, sum = 0;
    for(var id in cart){ qty += cart[id].qty; sum += cart[id].qty * cart[id].price; }
    return { qty: qty, sum: sum };
  }

  function buildMessage(){
    var lines = ['Hola La Casita 👋 Quiero hacer este pedido:'];
    for(var id in cart){
      var it = cart[id];
      lines.push('• ' + it.qty + 'x ' + it.name + ' — ' + money(it.qty * it.price));
    }
    lines.push('');
    lines.push('Total: ' + money(totals().sum));
    lines.push('¿Me confirman disponibilidad? 🙌');
    return lines.join('\n');
  }

  function renderCart(){
    var t = totals();
    countEl.textContent = t.qty;
    countEl.classList.toggle('hide', t.qty === 0);
    headCount.textContent = t.qty ? '(' + t.qty + ')' : '';
    totalEl.textContent = money(t.sum);

    var ids = Object.keys(cart);
    if(!ids.length){
      bodyEl.innerHTML =
        '<div class="cas-cart-empty">' +
          '<span>🛒</span>' +
          '<p>Tu carrito está vacío</p>' +
          '<small>Agrega productos desde el catálogo.</small>' +
        '</div>';
    } else {
      bodyEl.innerHTML = ids.map(function(id){
        var it = cart[id];
        var thumb = '<div class="cas-cart-thumb">' + (it.img ? '<img src="' + esc(it.img) + '" alt="" onerror="this.remove()">' : '') + '</div>';
        return '' +
          '<div class="cas-cart-item" data-id="' + esc(id) + '">' +
            thumb +
            '<div class="cas-cart-info">' +
              '<strong>' + esc(it.name) + '</strong>' +
              '<span class="cas-cart-unit">' + money(it.price) + ' c/u</span>' +
              '<div class="cas-qty">' +
                '<button type="button" data-act="minus" aria-label="Quitar uno">−</button>' +
                '<span>' + it.qty + '</span>' +
                '<button type="button" data-act="plus" aria-label="Agregar uno">+</button>' +
              '</div>' +
            '</div>' +
            '<div class="cas-cart-right">' +
              '<span class="cas-line-total">' + money(it.qty * it.price) + '</span>' +
              '<button type="button" class="cas-remove" data-act="remove" aria-label="Eliminar">🗑</button>' +
            '</div>' +
          '</div>';
      }).join('');
    }

    if(t.qty){
      checkout.classList.remove('is-off');
      checkout.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage());
    } else {
      checkout.classList.add('is-off');
      checkout.href = '#';
    }
    save();
    syncCardQtys();
  }

  function openCart(){
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.setAttribute('aria-hidden','false');
    drawer.inert = false;
    document.body.style.overflow = 'hidden';
  }
  function closeCart(){
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    drawer.inert = true;
    document.body.style.overflow = '';
  }

  var toastEl = null, toastTimer = null;
  function toast(msg){
    if(!toastEl){
      toastEl = document.createElement('div');
      toastEl.className = 'cas-toast';
      root.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 1800);
  }

  function addProduct(card, qty){
    var id = card.dataset.id;
    if(cart[id]) cart[id].qty += qty;
    else {
      var imgEl = card.querySelector('.cas-prod-art img');
      cart[id] = { name: card.dataset.name, price: parseFloat(card.dataset.price) || 0, img: imgEl ? imgEl.src : '', qty: qty };
    }
    renderCart();
  }

  if(grid){
    grid.addEventListener('click', function(e){
      var addBtn = e.target.closest('.cas-add');
      if(addBtn){
        var card = addBtn.closest('.cas-product');
        if(!card) return;
        addProduct(card, 1);
        toast('✓ Agregado al carrito');
        addBtn.classList.add('is-added');
        addBtn.textContent = '✓ Agregado';
        setTimeout(function(){
          addBtn.classList.remove('is-added');
          addBtn.textContent = 'Agregar al carrito 🛒';
        }, 900);
        return;
      }

      var qtyBtn = e.target.closest('[data-card-act]');
      if(qtyBtn){
        var c2 = qtyBtn.closest('.cas-product');
        if(!c2) return;
        var id = c2.dataset.id;
        var act = qtyBtn.dataset.cardAct;
        if(act === 'plus'){
          if(cart[id]) cart[id].qty++; else addProduct(c2, 1);
          renderCart();
        } else if(act === 'minus'){
          if(cart[id]){
            cart[id].qty--;
            if(cart[id].qty <= 0) delete cart[id];
            renderCart();
          }
        }
        return;
      }

      var goBtn = e.target.closest('.cas-card-gocart');
      if(goBtn){ openCart(); return; }
    });
  }

  bodyEl.addEventListener('click', function(e){
    var btn = e.target.closest('[data-act]');
    if(!btn) return;
    var row = btn.closest('.cas-cart-item');
    if(!row) return;
    var id  = row.dataset.id;
    var act = btn.dataset.act;
    if(!cart[id]) return;
    if(act === 'plus')      cart[id].qty++;
    else if(act === 'minus'){ cart[id].qty--; if(cart[id].qty <= 0) delete cart[id]; }
    else if(act === 'remove') delete cart[id];
    renderCart();
  });

  fab.addEventListener('click', openCart);
  closeBtn.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && drawer.classList.contains('open')) closeCart();
  });
  clearBtn.addEventListener('click', function(){
    if(!Object.keys(cart).length) return;
    if(confirm('¿Vaciar el carrito?')){
      cart = {};
      renderCart();
      toast('Carrito vaciado');
    }
  });

  checkout.addEventListener('click', function(e) {
    if (Object.keys(cart).length === 0) return;
    setTimeout(function() {
      cart = {};
      renderCart();
      closeCart();
      toast('✓ Pedido enviado. ¡Gracias!');
    }, 500);
  });

  /* ============================================================
     🔎 BUSCADOR LIVE (estilo ML / Amazon)
     ============================================================ */
  var form         = document.getElementById('cas-search-form');
  var input        = document.getElementById('cas-search-input');
  var resultsBox   = document.getElementById('cas-search-results');
  var searchWrap   = document.getElementById('cas-search-wrap');

  var searchActiveIdx = -1;
  var searchResults   = [];
  var searchQuery     = '';
  var searchDebounce;
  var userNavigated   = false;

  function clearSearchResults(){
    if(!resultsBox) return;
    resultsBox.innerHTML = '';
    resultsBox.classList.remove('open');
    searchResults = [];
    searchActiveIdx = -1;
    searchQuery = '';
    userNavigated = false;
  }

  function clearSearch(){
    if(input) input.value = '';
    clearSearchResults();
  }

  function highlightMatch(text, q){
    if(!q) return esc(text);
    var idx = text.toLocaleLowerCase('es').indexOf(q.toLocaleLowerCase('es'));
    if(idx === -1) return esc(text);
    return esc(text.slice(0, idx)) +
      '<span class="cas-search-highlight">' + esc(text.slice(idx, idx + q.length)) + '</span>' +
      esc(text.slice(idx + q.length));
  }

  function performLiveSearch(q){
    if(!resultsBox) return;
    q = (q || '').trim();
    if(!q){ clearSearchResults(); return; }

    searchQuery = q;
    var ql = q.toLocaleLowerCase('es');
    var matches = PRODUCTS.filter(function(p){
      return p.name.toLocaleLowerCase('es').indexOf(ql) !== -1;
    });

    if(!matches.length){
      searchResults = [];
      searchActiveIdx = -1;
      resultsBox.innerHTML = '<div class="cas-search-empty">🔍 Sin resultados para <strong>"' + esc(q) + '"</strong><br><span style="font-size:11px;opacity:.7">Prueba con otra palabra</span></div>';
      resultsBox.classList.add('open');
      return;
    }

    searchResults = matches.slice(0, 8);
    searchActiveIdx = 0;
    userNavigated = false;

    var itemsHTML = searchResults.map(function(p, i){
      var thumb = p.img ? '<img src="' + esc(p.img) + '" alt="" onerror="this.remove()">' : '';
      return '<div class="cas-search-item" data-idx="' + i + '" data-pid="' + esc(p.id) + '" role="option">' +
        '<div class="cas-search-thumb">' + thumb + '</div>' +
        '<div class="cas-search-info">' +
          '<div class="cas-search-name">' + highlightMatch(p.name, q) + '</div>' +
          '<div class="cas-search-cat">' + esc(catName(p.cat)) + '</div>' +
        '</div>' +
        '<div class="cas-search-price">' + money(p.price) + '</div>' +
      '</div>';
    }).join('');

    var seeAllHTML = matches.length > searchResults.length
      ? '<div class="cas-search-seeall" data-seeall="1">Ver todos los resultados (' + matches.length + ') →</div>'
      : '';

    resultsBox.innerHTML = itemsHTML + seeAllHTML;
    resultsBox.classList.add('open');
    updateSearchActive();
  }

  function updateSearchActive(){
    if(!resultsBox) return;
    var items = resultsBox.querySelectorAll('.cas-search-item');
    items.forEach(function(el, i){ el.classList.toggle('active', i === searchActiveIdx); });
    var active = items[searchActiveIdx];
    if(active && active.scrollIntoView) active.scrollIntoView({block:'nearest'});
  }

  function selectSearchResult(pid){
    var product = PRODUCTS.filter(function(p){ return p.id === pid; })[0];
    if(!product) return;

    var targetHash = '#/catalogo/' + product.cat;
    clearSearch();

    if(location.hash === targetHash){
      renderCatalog(product.cat);
      setActiveChip(product.cat);
      highlightProductInGrid(pid);
    } else {
      location.hash = targetHash;
      setTimeout(function(){ highlightProductInGrid(pid); }, 150);
      setTimeout(function(){ highlightProductInGrid(pid); }, 400);
    }
  }

  function highlightProductInGrid(pid){
    if(!grid) return;
    var card = grid.querySelector('.cas-product[data-id="' + pid + '"]');
    if(!card) return;
    card.scrollIntoView({behavior:'smooth', block:'center'});
    card.style.transition = 'box-shadow .3s, transform .3s';
    card.style.boxShadow = '0 0 0 2px #ff4eaa, 0 0 30px #ff4eaa';
    card.style.transform = 'translateY(-3px)';
    setTimeout(function(){
      card.style.boxShadow = '';
      card.style.transform = '';
    }, 2000);
  }

  function applyFilterToGrid(q){
    if(!grid) return;
    q = (q || '').toLocaleLowerCase('es');
    var oldNR = grid.querySelector('.cas-no-results');
    if(oldNR) oldNR.remove();

    if(!q){
      grid.querySelectorAll('.cas-product').forEach(function(c){ c.style.display = ''; });
      grid.querySelectorAll('.cas-cat-section').forEach(function(s){ s.style.display = ''; });
      return;
    }

    var anyGlobal = false;
    grid.querySelectorAll('.cas-cat-section').forEach(function(sec){
      var anyVisible = false;
      sec.querySelectorAll('.cas-product').forEach(function(card){
        var name = (card.getAttribute('data-name') || '').toLocaleLowerCase('es');
        var match = name.indexOf(q) !== -1;
        card.style.display = match ? '' : 'none';
        if(match) anyVisible = true;
      });
      sec.style.display = anyVisible ? '' : 'none';
      if(anyVisible) anyGlobal = true;
    });

    if(!anyGlobal){
      var nr = document.createElement('div');
      nr.className = 'cas-no-results';
      nr.innerHTML = '<span>🔍</span><p>Sin resultados para "' + esc(q) + '"</p><small>Prueba con otra palabra o cambia de categoría.</small>';
      grid.appendChild(nr);
    }
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function filterByQuery(q){
    if(!q) return;
    q = q.trim();
    var ql = q.toLocaleLowerCase('es');
    clearSearchResults();

    if(location.hash === '#/catalogo'){
      applyFilterToGrid(ql);
      if(input) input.value = q;
    } else {
      pendingFilter = { q: q, ql: ql };
      suppressHashClear = true;
      location.hash = '#/catalogo';
    }
  }

  // ----- Eventos del input -----
  if(input && resultsBox){
    input.addEventListener('input', function(){
      clearTimeout(searchDebounce);
      var q = input.value;

      if(!q.trim()){
        if(grid){
          grid.querySelectorAll('.cas-product').forEach(function(c){ c.style.display = ''; });
          grid.querySelectorAll('.cas-cat-section').forEach(function(s){ s.style.display = ''; });
          var oldNR = grid.querySelector('.cas-no-results');
          if(oldNR) oldNR.remove();
        }
        clearSearchResults();
        return;
      }

      searchDebounce = setTimeout(function(){ performLiveSearch(q); }, 120);
    });

    input.addEventListener('focus', function(){
      if(input.value.trim()) performLiveSearch(input.value);
    });

    input.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){
        clearSearch();
        input.blur();
        return;
      }
      if(!resultsBox.classList.contains('open')) return;

      if(e.key === 'ArrowDown'){
        e.preventDefault();
        if(!searchResults.length) return;
        userNavigated = true;
        searchActiveIdx = (searchActiveIdx + 1) % searchResults.length;
        updateSearchActive();
      } else if(e.key === 'ArrowUp'){
        e.preventDefault();
        if(!searchResults.length) return;
        userNavigated = true;
        searchActiveIdx = (searchActiveIdx - 1 + searchResults.length) % searchResults.length;
        updateSearchActive();
      } else if(e.key === 'Enter'){
        if(userNavigated && searchActiveIdx >= 0 && searchResults[searchActiveIdx]){
          e.preventDefault();
          selectSearchResult(searchResults[searchActiveIdx].id);
        }
      }
    });
  }

  // ----- Click en resultados / "ver todos" -----
  if(resultsBox){
    resultsBox.addEventListener('mousedown', function(e){
      var item = e.target.closest('.cas-search-item');
      if(item){
        e.preventDefault();
        e.stopPropagation();
        selectSearchResult(item.dataset.pid);
        return;
      }
      var seeAll = e.target.closest('[data-seeall]');
      if(seeAll){
        e.preventDefault();
        e.stopPropagation();
        filterByQuery(searchQuery);
        return;
      }
    });
  }

  // ----- Click fuera → limpiar -----
  document.addEventListener('mousedown', function(e){
    if(!searchWrap) return;
    if(!searchWrap.contains(e.target)){
      clearSearch();
    }
  });

  // ----- Submit del form -----
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var q = input ? input.value.trim() : '';
      if(!q){ clearSearchResults(); return; }
      filterByQuery(q);
    });
  }

  /* ---------------- Mapa de Google (se carga solo cuando hace falta) ---------------- */
  var mapFacade = document.getElementById('cas-map-facade');
  if(mapFacade){
    var loadMap = function(){
      if(!mapFacade.parentNode) return;
      var f = document.createElement('iframe');
      f.className = 'cas-visit-map';
      f.title = 'Mapa de ubicación de La Casita en Chetumal';
      f.src = 'https://www.google.com/maps?q=MiniAbarrotes+La+Casita,+Calle+Aruba,+Bicentenario,+77086+Chetumal,+Q.R.&output=embed';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.allowFullscreen = true;
      mapFacade.replaceWith(f);
    };
    mapFacade.addEventListener('click', loadMap);
    if('IntersectionObserver' in window){
      var mapObs = new IntersectionObserver(function(entries){
        if(entries[0].isIntersecting){ mapObs.disconnect(); loadMap(); }
      });
      mapObs.observe(mapFacade);
    }
  }

  /* ---------------- Arranque ---------------- */
  renderCarousel();
  renderHomeCats();
  renderFilterBar();
  renderCart();
  handleHash();

  /* ---------------- Puente para el chatbot (js/chatbot.js) ---------------- */
  window.CASITA = {
    addById: function(id){
      var p = PRODUCTS.filter(function(x){ return x.id === id; })[0];
      if(!p) return false;
      if(cart[id]) cart[id].qty += 1;
      else cart[id] = { name: p.name, price: p.price, img: p.img, qty: 1 };
      renderCart();
      return true;
    },
    totals: totals,
    openCart: openCart,
    checkoutUrl: function(){ return checkout.href; }
  };

})();
