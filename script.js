document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded: Script has started.");

  // Verifică dacă productsData este disponibil
  if (typeof productsData === 'undefined' || productsData.length === 0) {
    console.error("ERROR: productsData is undefined or empty. Please ensure products.js is loaded correctly and defines productsData.");
    // Tentativă de a afișa un mesaj de eroare pe pagină dacă productsData lipsește
    const mainContainer = document.querySelector('main.main-container');
    if (mainContainer) {
      mainContainer.innerHTML = '<p style="text-align: center; color: red; font-size: 1.2em; margin-top: 50px;">Eroare: Datele despre produse nu au putut fi încărcate. Vă rugăm să verificați fișierul products.js.</p>';
    }
    // NU OPREȘTE execuția scriptului dacă datele esențiale lipsesc, pentru a permite altor funcționalități (ex: dark mode) să ruleze
    // return;
  } else {
    console.log(`productsData loaded successfully. Found ${productsData.length} products.`);
  }

  // Selectează grila de produse. Pe pagina principală, aceasta va fi 'featuredProductsGrid'.
  // Pe pagina de cumpărături, va fi grila principală de produse.
  const productsGrid = document.querySelector(".products-grid"); // Aceasta va fi #featuredProductsGrid pe index.html și #products-grid pe shop.html

  // Variabile globale pentru coș și lista de dorințe
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

  // Logica de filtrare specifică paginii de cumpărături - Declară variabilele la început
  const filterInput = document.getElementById('search-input'); // Folosim search-input pentru căutare globală
  const categoryTagButtons = document.querySelectorAll('.tag-btn'); // Butoanele de categorie
  const brandFilterContainer = document.getElementById('brand-filters'); // Containerul pentru checkbox-uri brand
  const priceRange = document.getElementById('price-range');
  const priceValue = document.getElementById('price-value');
  const sortSelect = document.getElementById('sort-select');

  // Funcție pentru a randa produsele într-o grilă specificată
  function renderProducts(productsToRender = productsData, targetGrid = productsGrid) {
    console.log("renderProducts: Function called.");
    if (!targetGrid) {
      console.error("renderProducts: Target grid element not found for rendering products. Cannot render.");
      return; // Ieși dacă nu există o grilă țintă
    }

    targetGrid.innerHTML = ''; // Golește produsele existente
    console.log(`renderProducts: Attempting to render ${productsToRender.length} products into ${targetGrid.id || targetGrid.className}.`);

    if (productsToRender.length === 0) {
      targetGrid.innerHTML = '<p style="text-align: center; width: 100%; color: #777;">Nu s-au găsit produse care să corespundă criteriilor.</p>';
      console.log("renderProducts: No products to render based on current filters.");
      return;
    }

    productsToRender.forEach(product => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";

      let tagHTML = "";
      if (product.tag) {
        tagHTML = `<div class="product-tag tag-${product.tag}">${product.tag.toUpperCase()}</div>`;
      }

      const stars = Math.round(product.rating);
      const starsHTML = '<div class="stars">' +
        Array.from({ length: 5 }, (_, i) =>
          `<i class="${i < stars ? 'fas fa-star' : 'far fa-star'}"></i>`
        ).join("") +
        ` <span class="rating-count">(${product.ratingCount})</span></div>`;

      productCard.innerHTML = `
        ${tagHTML}
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-info">
          <div class="product-category">${product.category}</div>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-brand">By ${product.brand}</div>
          <div class="product-rating">${starsHTML}</div>
          <div class="product-price">
            <span class="current-price">$${product.price.toFixed(2)}</span>
            ${product.oldPrice ? `<span class="old-price">$${product.oldPrice.toFixed(2)}</span>` : ''}
          </div>
        </div>
        <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
        <button class="add-to-wishlist-btn" data-id="${product.id}">Add to Wishlist</button>
      `;

      // Adaugă ascultător de evenimente la întregul card pentru a deschide modalul
      productCard.addEventListener('click', (event) => {
        // Previne deschiderea modalului dacă un buton din interiorul cardului a fost apăsat
        if (event.target.closest('.add-to-cart-btn') || event.target.closest('.add-to-wishlist-btn')) {
          console.log("Product card click: Button clicked, preventing modal open."); // Debugging
          return;
        }
        console.log("Product card clicked: Opening modal for product ID:", product.id); // Debugging
        openModal(product);
      });

      targetGrid.appendChild(productCard);
    });
    console.log("renderProducts: Products rendering complete.");
  }

  // Logica de randare inițială a produselor la încărcarea paginii
  const featuredProductsGrid = document.getElementById("featuredProductsGrid");
  const shopProductsGrid = document.getElementById("products-grid"); // Pentru pagina shop.html

  if (featuredProductsGrid) {
    console.log("Initial render: Found featuredProductsGrid. Rendering 8 products.");
    renderProducts(productsData.slice(0, 8), featuredProductsGrid);
  } else if (shopProductsGrid) {
    console.log("Initial render: Found shopProductsGrid. Initializing filters and rendering products.");
    // Pe pagina shop.html, apelăm applyFilters pentru a randa produsele inițial
    generateBrandFilters(); // Generează filtrele de brand înainte de a aplica filtrele
    applyFilters();
  } else {
    console.log("Initial render: No specific product grid found (e.g., on help.html or checkout.html).");
  }


  // --- Logica barei de navigare responsive ---
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.getElementById('mainNav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      console.log("Menu toggle clicked!"); // Debugging
      mainNav.classList.toggle('active');
      const icon = menuToggle.querySelector('i');
      if (icon) { // Asigură-te că iconița există
        if (mainNav.classList.contains('active')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times'); // Iconița 'x'
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars'); // Iconița hamburger
        }
      }
    });
  } else {
    console.warn("Menu toggle or main navigation not found.");
  }
  // --- Sfârșitul logicii barei de navigare responsive ---

  // Modul întunecat
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      console.log("Theme toggle clicked!"); // Debugging
      document.body.classList.toggle('dark-mode');
      document.body.classList.toggle('light-mode');
      const newTheme = document.body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode';
      localStorage.setItem('theme', newTheme);
      console.log("Theme saved to localStorage:", newTheme); // Debugging

      const icon = themeToggle.querySelector('i');
      if (icon) { // Asigură-te că iconița există
        icon.classList.remove('fa-moon');
        icon.classList.remove('fa-sun'); // Elimină ambele clase pentru a evita conflictele
        if (newTheme === 'dark-mode') {
          icon.classList.add('fa-sun'); // Iconița soare pentru modul întunecat
        } else {
          icon.classList.add('fa-moon'); // Iconița lună pentru modul luminos
        }
      }
    });

    // Încarcă tema din localStorage la încărcarea paginii
    const savedTheme = localStorage.getItem('theme');
    console.log("Initial load: Saved theme from localStorage:", savedTheme); // Debugging
    if (savedTheme) {
      // Elimină ambele clase de temă înainte de a aplica tema salvată
      document.body.classList.remove('light-mode', 'dark-mode');
      document.body.classList.add(savedTheme);
      console.log("Initial load: Applied theme:", savedTheme, "Current body classes:", document.body.classList.value); // Debugging
      // Actualizează iconița în funcție de tema salvată
      const icon = themeToggle.querySelector('i');
      if (icon) { // Asigură-te că iconița există înainte de a o manipula
        icon.classList.remove('fa-moon');
        icon.classList.remove('fa-sun'); // Elimină ambele clase pentru a evita conflictele
        if (savedTheme === 'dark-mode') {
          icon.classList.add('fa-sun'); // Iconița soare pentru modul întunecat
        } else {
          icon.classList.add('fa-moon'); // Iconița lună pentru modul luminos
        }
      }
    } else {
      console.log("Initial load: No theme saved in localStorage. Defaulting to light-mode."); // Debugging
      // Dacă nu există o temă salvată, asigură-te că este setată tema implicită (light-mode)
      document.body.classList.add('light-mode');
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
    }
  } else {
    console.warn("Theme toggle button not found.");
  }


  // Funcționalitatea coșului de cumpărături și a listei de dorințe
  // Variabilele cart și wishlist sunt deja declarate la începutul scriptului

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    console.log("Cart saved:", cart); // Debugging
  }

  function saveWishlist() {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
    console.log("Wishlist saved:", wishlist); // Debugging
  }

  function updateCartUI() {
    // Modificat pentru a folosi selectorul de clasă pentru a corespunde index.html și help.html
    const cartCountElement = document.querySelector('.icon-group .cart-count');
    // Pop-up-urile de coș și wishlist sunt în shop.html, dar nu în index.html/help.html/team.html
    const cartPopupBody = document.getElementById('cart-popup-body');
    const cartTotalElement = document.getElementById('cart-total');

    console.log("updateCartUI: Checking for cartCountElement:", cartCountElement); // Debugging
    if (cartCountElement) {
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      cartCountElement.textContent = totalItems;
      console.log("updateCartUI: Cart UI updated. Total items:", totalItems); // Debugging
    } else {
      console.warn("updateCartUI: Cart count element (.icon-group .cart-count) not found. (Expected on index.html/help.html/team.html)");
    }

    if (cartPopupBody && cartTotalElement) {
      if (cart.length === 0) {
        cartPopupBody.innerHTML = '<p>Coșul tău este gol.</p>';
        cartTotalElement.textContent = '$0.00';
      } else {
        let total = 0;
        cartPopupBody.innerHTML = cart.map(item => {
          const itemTotal = item.price * item.quantity;
          total += itemTotal;
          return `<div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
              <strong>${item.name}</strong>
              <span>Mărime: ${item.size} | Cantitate: ${item.quantity}</span>
            </div>
            <span class="cart-item-price">$${itemTotal.toFixed(2)}</span>
            <button class="remove-item-btn" data-id="${item.id}" data-size="${item.size}">&times;</button>
          </div>`;
        }).join('');
        cartTotalElement.textContent = `$${total.toFixed(2)}`;

        // Atașează ascultători de evenimente pentru butoanele de eliminare din coș
        cartPopupBody.querySelectorAll('.remove-item-btn').forEach(button => {
          button.addEventListener('click', (event) => {
            const idToRemove = event.target.dataset.id;
            const sizeToRemove = event.target.dataset.size;
            removeFromCart(idToRemove, sizeToRemove);
          });
        });
      }
    }
  }

  function updateWishlistUI() {
    // Modificat pentru a folosi selectorul de clasă pentru a corespunde index.html și help.html
    const wishlistCountElement = document.querySelector('.icon-group .wishlist-count');
    // Pop-up-urile de coș și wishlist sunt în shop.html, dar nu în index.html/help.html
    const wishlistPopupBody = document.getElementById('wishlist-popup-body');

    console.log("updateWishlistUI: Checking for wishlistCountElement:", wishlistCountElement); // Debugging
    if (wishlistCountElement) {
      wishlistCountElement.textContent = wishlist.length;
      console.log("updateWishlistUI: Wishlist UI updated. Total items:", wishlist.length); // Debugging
    } else {
      console.warn("updateWishlistUI: Wishlist count element (.icon-group .wishlist-count) not found. (Expected on index.html/help.html/team.html)");
    }

    if (wishlistPopupBody) {
      if (wishlist.length === 0) {
        wishlistPopupBody.innerHTML = '<p>Lista ta de dorințe este goală.</p>';
      } else {
        wishlistPopupBody.innerHTML = wishlist.map(item => {
          return `<div class="wishlist-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="wishlist-item-details">
              <strong>${item.name}</strong>
              <span>$${item.price.toFixed(2)}</span>
            </div>
            <button class="remove-item-btn" data-id="${item.id}">&times;</button>
          </div>`;
        }).join('');

        // Atașează ascultători de evenimente pentru butoanele de eliminare din lista de dorințe
        wishlistPopupBody.querySelectorAll('.remove-item-btn').forEach(button => {
          button.addEventListener('click', (event) => {
            const idToRemove = event.target.dataset.id;
            removeFromWishlist(idToRemove);
          });
        });
      }
    }
  }

  function addToCart(productId, size, quantity = 1) { // Adăugat qty parameter
    console.log(`Attempting to add product ID ${productId} (Size: ${size}, Qty: ${quantity}) to cart.`); // Debugging
    const product = productsData.find(p => p.id == productId);
    if (!product) {
      console.error("addToCart: Product not found for ID:", productId); // Debugging
      return;
    }

    const existingItemIndex = cart.findIndex(item => item.id === productId && item.size === size);

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += quantity;
      console.log("addToCart: Updated quantity for existing item."); // Debugging
    } else {
      cart.push({ ...product, size, quantity });
      console.log("addToCart: Added new item to cart."); // Debugging
    }
    saveCart();
    console.log(`${product.name} (Mărime: ${size}, Cantitate: ${quantity}) a fost adăugat în coș!`); // Înlocuit alert
  }

  function removeFromCart(productId, size) {
    cart = cart.filter(item => !(item.id == productId && item.size == size));
    saveCart();
    console.log('Articol eliminat din coș.'); // Înlocuit alert
  }

  function addToWishlist(productId) {
    console.log(`Attempting to add product ID ${productId} to wishlist.`); // Debugging
    const product = productsData.find(p => p.id == productId);
    if (!product) {
      console.error("addToWishlist: Product not found for ID:", productId); // Debugging
      return;
    }

    const existingItemIndex = wishlist.findIndex(item => item.id === productId);

    if (existingItemIndex === -1) {
      wishlist.push(product);
      saveWishlist();
      console.log(`${product.name} a fost adăugat în lista de dorințe!`); // Înlocuit alert
      console.log("addToWishlist: Added new item to wishlist."); // Debugging
    } else {
      console.log(`${product.name} este deja în lista de dorințe!`); // Înlocuit alert
      console.log("addToWishlist: Item already in wishlist."); // Debugging
    }
  }

  function removeFromWishlist(productId) {
    wishlist = wishlist.filter(item => item.id != productId);
    saveWishlist();
    console.log('Articol eliminat din lista de dorințe.'); // Înlocuit alert
  }

  // --- Logica pentru butoanele din antet (coș și listă de dorințe) ---
  // Modificat pentru a folosi selectori de clasă sau mai specifici
  const headerCartIcon = document.querySelector('.icon-group .fa-shopping-cart');
  const headerCartBtn = headerCartIcon ? headerCartIcon.closest('button') : null;
  console.log("Debug: headerCartBtn found?", headerCartBtn); // Debugging

  const headerWishlistIcon = document.querySelector('.icon-group .fa-heart');
  const headerWishlistBtn = headerWishlistIcon ? headerWishlistIcon.closest('button') : null;
  console.log("Debug: headerWishlistBtn found?", headerWishlistBtn); // Debugging

  // Pop-up-urile de coș și wishlist
  const cartPopup = document.getElementById('cart-popup');
  console.log("Debug: cartPopup found?", cartPopup); // Debugging
  const wishlistPopup = document.getElementById('wishlist-popup');
  console.log("Debug: wishlistPopup found?", wishlistPopup); // Debugging

  // Butoanele de închidere pentru barele laterale
  const closeCartBtn = document.querySelector('.close-cart-btn');
  const closeWishlistBtn = document.querySelector('.close-wishlist-btn');


  if (headerCartBtn) {
    headerCartBtn.addEventListener('click', () => {
      console.log("Header Cart button clicked. Toggling cart popup."); // Debugging
      if (cartPopup) { // Se va executa doar dacă cartPopup există
        cartPopup.classList.toggle('active');
        // Asigură-te că celălalt popup este închis
        if (wishlistPopup) wishlistPopup.classList.remove('active');
      } else {
        console.log("Funcționalitatea coșului de cumpărături este disponibilă pe pagina Shop."); // Înlocuit alert
      }
    });
  } else {
    console.warn("Header Cart button (selector: .icon-group .fa-shopping-cart) not found.");
  }

  if (headerWishlistBtn) {
    headerWishlistBtn.addEventListener('click', () => {
      console.log("Header Wishlist button clicked. Toggling wishlist popup."); // Debugging
      if (wishlistPopup) { // Se va executa doar dacă wishlistPopup există
        wishlistPopup.classList.toggle('active');
        // Asigură-te că celălalt popup este închis
        if (cartPopup) cartPopup.classList.remove('active');
      } else {
        console.log("Funcționalitatea listei de dorințe este disponibilă pe pagina Shop."); // Înlocuit alert
      }
    });
  } else {
    console.warn("Header Wishlist button (selector: .icon-group .fa-heart) not found.");
  }

  // Adaugă ascultători de evenimente pentru butoanele de închidere ale barelor laterale
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => {
      if (cartPopup) {
        cartPopup.classList.remove('active');
        console.log("Cart sidebar closed via close button.");
      }
    });
  }

  if (closeWishlistBtn) {
    closeWishlistBtn.addEventListener('click', () => {
      if (wishlistPopup) {
        wishlistPopup.classList.remove('active');
        console.log("Wishlist sidebar closed via close button.");
      }
    });
  }

  // Închide barele laterale la click în afara lor
  window.addEventListener('click', (event) => {
    if (cartPopup && cartPopup.classList.contains('active') && !cartPopup.contains(event.target) && !headerCartBtn.contains(event.target)) {
      cartPopup.classList.remove('active');
      console.log("Cart sidebar closed by clicking outside.");
    }
    if (wishlistPopup && wishlistPopup.classList.contains('active') && !wishlistPopup.contains(event.target) && !headerWishlistBtn.contains(event.target)) {
      wishlistPopup.classList.remove('active');
      console.log("Wishlist sidebar closed by clicking outside.");
    }
  });


  // --- Sfârșitul logicii pentru butoanele din antet ---


  // Modalul produsului (același ID ca în index.html)
  const productModal = document.getElementById('productModal'); // ID-ul a fost schimbat în shop.html
  const closeModalBtn = productModal ? productModal.querySelector('.close-button') : null; // Caută butonul în modal
  const modalImage = document.getElementById('modal-product-image');
  const modalName = document.getElementById('modal-product-name');
  const modalCategory = document.getElementById('modal-product-category');
  const modalBrand = document.getElementById('modal-product-brand');
  const modalRating = document.getElementById('modal-product-rating');
  const modalPrice = document.getElementById('modal-product-price');
  const modalOldPrice = document.getElementById('modal-product-old-price');
  const modalDescription = document.getElementById('modal-product-description');
  const modalSizeSelect = document.getElementById('modal-size-select');
  // CORECȚIE: Am schimbat ID-ul de la 'modal-quantity-input' la 'qty-input' pentru a se potrivi cu shop.html
  const modalQuantityInput = document.getElementById('qty-input'); 
  const modalAddToCartBtn = document.getElementById('modal-add-to-cart'); // ID-ul a fost schimbat în shop.html

  function openModal(product) {
    if (!productModal) {
      console.error("openModal: Product modal element not found."); // Debugging
      return; // Ieși dacă elementele modalului nu sunt pe pagină
    }

    modalImage.src = product.image;
    modalImage.alt = product.name;
    modalName.textContent = product.name;
    modalCategory.textContent = product.category;
    modalBrand.textContent = `By ${product.brand}`;

    const stars = Math.round(product.rating);
    modalRating.innerHTML =
      Array.from({ length: 5 }, (_, i) =>
        `<i class="${i < stars ? 'fas fa-star' : 'far fa-star'}"></i>`
      ).join("") + ` (${product.ratingCount})`;

    modalPrice.textContent = `$${product.price.toFixed(2)}`;
    if (product.oldPrice) {
      modalOldPrice.textContent = `$${product.oldPrice.toFixed(2)}`;
      modalOldPrice.style.display = 'inline';
    } else {
      modalOldPrice.style.display = 'none';
    }
    modalDescription.textContent = product.description;

    // Populează mărimile (exemplu, de obicei dinamic din datele produsului)
    modalSizeSelect.innerHTML = '<option value="">Selectează mărimea</option>';
    ['38', '39', '40', '41', '42'].forEach(size => { // Mărimi actualizate
      const option = document.createElement('option');
      option.value = size;
      option.textContent = `EU ${size}`; // Afișează EU size
      modalSizeSelect.appendChild(option);
    });

    // Asigură-te că modalQuantityInput nu este null înainte de a seta valoarea
    if (modalQuantityInput) {
        modalQuantityInput.value = 1; // Resetează cantitatea
    } else {
        console.warn("modalQuantityInput not found in openModal function.");
    }

    // Setează data-id pe butonul "Add to Cart" din modal
    if (modalAddToCartBtn) { // Asigură-te că butonul există
        modalAddToCartBtn.dataset.id = product.id;
    }


    productModal.style.display = 'flex'; // Utilizează flex pentru centrare
    console.log("openModal: Modal opened for product:", product.name); // Debugging

    // Logica pentru butoanele de cantitate din modal
    const qtyDecBtn = productModal.querySelector('#qty-dec');
    const qtyIncBtn = productModal.querySelector('#qty-inc');
    const qtyInput = productModal.querySelector('#qty-input'); // Re-selectăm aici pentru siguranță

    if (qtyDecBtn && qtyIncBtn && qtyInput) {
      qtyDecBtn.onclick = () => {
        qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
      };
      qtyIncBtn.onclick = () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
      };
    }

    // Logica pentru review-uri în modal
    const reviewStarsContainer = productModal.querySelector('#review-stars');
    const reviewTextInput = productModal.querySelector('#review-text');
    const submitReviewBtn = productModal.querySelector('#submit-review');
    let selectedRating = 0;

    if (reviewStarsContainer && reviewTextInput && submitReviewBtn) {
      reviewStarsContainer.innerHTML = Array.from({ length: 5 }, (_, i) => `<i class='far fa-star' data-index='${i}'></i>`).join('');
      reviewStarsContainer.querySelectorAll('i').forEach(star => {
        star.addEventListener('mouseover', () => {
          const idx = parseInt(star.dataset.index);
          reviewStarsContainer.querySelectorAll('i').forEach((s, i) => {
            s.className = i <= idx ? 'fas fa-star' : 'far fa-star';
          });
        });
        star.addEventListener('click', () => {
          selectedRating = parseInt(star.dataset.index) + 1;
        });
      });

      submitReviewBtn.onclick = () => {
        const text = reviewTextInput.value.trim();
        if (selectedRating === 0 || text === '') {
          console.log('Te rog oferă o evaluare și un comentariu.'); // Înlocuit alert
        } else {
          console.log(`Mulțumim! Recenzia ta de ${selectedRating} stele a fost trimisă.`); // Înlocuit alert
          // Aici ai adăuga logica pentru a salva recenzia (e.g., într-un array de reviews pentru produs)
          reviewTextInput.value = ''; // Golește câmpul
          selectedRating = 0; // Resetează evaluarea
          reviewStarsContainer.innerHTML = Array.from({ length: 5 }, (_, i) => `<i class='far fa-star' data-index='${i}'></i>`).join(''); // Resetează stelele
        }
      };
    }

    // Logica pentru butoanele Add to Cart și Add to Wishlist din modal
    const modalAddToCartBtnEl = productModal.querySelector('#modal-add-to-cart');
    const modalAddToWishlistBtnEl = productModal.querySelector('#modal-add-to-wishlist');

    if (modalAddToCartBtnEl) {
      modalAddToCartBtnEl.onclick = () => {
        const size = modalSizeSelect.value;
        const qty = parseInt(modalQuantityInput.value); // Folosim modalQuantityInput aici
        if (!size) {
          console.log('Te rog selectează o mărime.'); // Înlocuit alert
          return;
        }
        addToCart(product.id, size, qty);
        productModal.style.display = 'none';
      };
    }

    if (modalAddToWishlistBtnEl) {
      modalAddToWishlistBtnEl.onclick = () => {
        addToWishlist(product.id);
      };
    }
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      productModal.style.display = 'none';
      console.log("Modal closed via close button."); // Debugging
    });
  }

  if (productModal) { // Adaugă ascultător doar dacă modalul există
    window.addEventListener('click', (event) => {
      if (event.target === productModal) {
        productModal.style.display = 'none';
        console.log("Modal closed by clicking outside."); // Debugging
      }
    });
  }


  // Funcție helper pentru generarea stelelor
  function generateStars(rating) {
    const full = Math.floor(rating);
    let starsHTML = '';
    for (let i = 0; i < 5; i++) {
      starsHTML += `<i class="${i < full ? 'fas' : 'far'} fa-star"></i>`;
    }
    return starsHTML;
  }

  // JavaScript pentru slideshow
  let slideIndex = 0;
  function showSlides() {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    let dots = document.getElementsByClassName("dot");
    if (slides.length === 0 || dots.length === 0) {
      console.warn("showSlides: No slideshow elements found. Exiting slideshow.");
      return; // Ieși dacă nu există elemente de slideshow
    }

    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
    }
    slideIndex++;
    if (slideIndex > slides.length) {slideIndex = 1}
    for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active-dot", "");
    }
    if (slides[slideIndex - 1]) { // Verifică dacă elementul există înainte de a-l accesa
      slides[slideIndex - 1].style.display = "block";
    }
    if (dots[slideIndex - 1]) { // Verifică dacă elementul există înainte de a-l accesa
      dots[slideIndex - 1].className += " active-dot";
    }
    setTimeout(showSlides, 4000); // Schimbă imaginea la fiecare 4 secunde
  }

  // Pornește slideshow-ul doar dacă elementele sunt prezente pe pagină
  if (document.querySelector('.slideshow-container')) {
    console.log("Slideshow: Starting slideshow.");
    showSlides();
  } else {
    console.log("Slideshow: Slideshow container not found."); // Nu este o avertizare, deoarece nu toate paginile au slideshow
  }

  // Logica de filtrare specifică paginii de cumpărături
  // Variabilele sunt declarate acum la începutul blocului DOMContentLoaded
  // const filterInput = document.getElementById('search-input');
  // const categoryTagButtons = document.querySelectorAll('.tag-btn');
  // const brandFilterContainer = document.getElementById('brand-filters');
  // const priceRange = document.getElementById('price-range');
  // const priceValue = document.getElementById('price-value');
  // const sortSelect = document.getElementById('sort-select');

  // Funcție pentru a genera filtrele de brand dinamic
  function generateBrandFilters() {
    console.log("generateBrandFilters: Function called.");
    if (!brandFilterContainer) {
      console.warn("generateBrandFilters: Brand filter container not found. Skipping brand filter generation.");
      return;
    }
    const brands = [...new Set(productsData.map(p => p.brand))].sort(); // Sortează brandurile alfabetic
    console.log("generateBrandFilters: Found brands:", brands);
    brandFilterContainer.innerHTML = brands.map(brand => `
      <label>
        <input type="checkbox" name="brand" value="${brand}"> ${brand}
      </label>
    `).join("");

    brandFilterContainer.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
      checkbox.addEventListener("change", applyFilters);
    });
    console.log("Shop Filters: Brand filters generated and event listeners attached.");
  }


  // Funcția principală de aplicare a filtrelor și sortării
  function applyFilters() {
    console.log("Shop Filters: Applying filters.");
    let filteredProducts = productsData;

    const searchTerm = filterInput ? filterInput.value.toLowerCase() : '';
    const activeCategoryButton = document.querySelector(".tag-btn.active");
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : "all";
    const checkedBrands = brandFilterContainer ? Array.from(brandFilterContainer.querySelectorAll('input[name="brand"]:checked')).map(i => i.value) : [];
    const maxPrice = priceRange ? parseFloat(priceRange.value) : Infinity;
    const sortBy = sortSelect ? sortSelect.value : 'default';

    console.log(`Filters - Search: "${searchTerm}", Category: "${selectedCategory}", Brands: [${checkedBrands.join(', ')}], Max Price: ${maxPrice}, Sort By: ${sortBy}`);

    // Filtrează după termenul de căutare
    if (searchTerm) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
      console.log(`Filtered by search term (${searchTerm}): ${filteredProducts.length} products remaining.`);
    }

    // Filtrează după categorie
    if (selectedCategory !== "all") {
      filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
      console.log(`Filtered by category (${selectedCategory}): ${filteredProducts.length} products remaining.`);
    }

    // Filtrează după brand
    if (checkedBrands.length > 0) {
      filteredProducts = filteredProducts.filter(product => checkedBrands.includes(product.brand));
      console.log(`Filtered by brands (${checkedBrands.join(', ')}): ${filteredProducts.length} products remaining.`);
    }

    // Filtrează după preț
    if (priceRange) {
      filteredProducts = filteredProducts.filter(product => product.price <= maxPrice);
      console.log(`Filtered by max price ($${maxPrice}): ${filteredProducts.length} products remaining.`);
    }

    // Sortează produsele
    if (sortBy === 'price-asc') {
      filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'rating-desc') {
      filteredProducts.sort((a, b) => b.rating - a.rating);
    }
    console.log(`Products sorted by ${sortBy}.`);

    renderProducts(filteredProducts, shopProductsGrid); // Re-randează produsele cu datele filtrate în grila shop
    console.log("Shop Filters: Filters applied and products re-rendered.");
  }

  // Atașează ascultători de evenimente pentru filtre, doar dacă elementele există pe pagină
  if (filterInput) filterInput.addEventListener('input', applyFilters);
  if (categoryTagButtons.length > 0) {
    categoryTagButtons.forEach(button => {
      button.addEventListener('click', () => {
        categoryTagButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        applyFilters();
      });
    });
    console.log("Shop Filters: Category tag buttons initialized.");
  }
  if (priceRange) {
    priceRange.addEventListener('input', () => {
      priceValue.textContent = `$${parseFloat(priceRange.value).toFixed(2)}`;
      applyFilters();
    });
    // Setează prețul maxim inițial
    const maxProductPrice = Math.max(...productsData.map(p => p.price));
    priceRange.max = maxProductPrice.toFixed(2);
    priceRange.value = maxProductPrice.toFixed(2);
    if (priceValue) priceValue.textContent = `$${maxProductPrice.toFixed(2)}`;
    console.log("Shop Filters: Price range initialized.");
  }
  if (sortSelect) sortSelect.addEventListener('change', applyFilters);


  // Logica de randare a paginii de checkout
  if (document.body.classList.contains('checkout-page')) {
    console.log("Checkout Page: Initializing checkout logic.");
    function renderCheckout() {
      const checkoutItemsContainer = document.getElementById('checkout-items');
      const checkoutTotalElement = document.getElementById('checkout-total');
      let subtotal = 0;

      if (checkoutItemsContainer) {
        checkoutItemsContainer.innerHTML = ''; // Golește elementele existente

        if (cart.length === 0) {
          checkoutItemsContainer.innerHTML = '<p>Coșul tău este gol.</p>';
          if (checkoutTotalElement) {
              checkoutTotalElement.textContent = '$0.00';
          }
          console.log("Checkout: Cart is empty.");
          return;
        }

        cart.forEach(item => {
          const itemElement = document.createElement('div');
          itemElement.classList.add('order-item');
          const itemPrice = item.price * item.quantity;
          subtotal += itemPrice;

          // Am adăugat elementul <img> pentru imaginea produsului
          itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px; margin-right: 10px;">
            <div class="order-item-details">
              <span class="item-name">${item.name} (Mărime: ${item.size})</span>
              <span>Cantitate: ${item.quantity}</span>
            </div>
            <span class="order-item-price">$${itemPrice.toFixed(2)}</span>
          `;
          checkoutItemsContainer.appendChild(itemElement);
        });

        if (checkoutTotalElement) {
          checkoutTotalElement.textContent = `$${subtotal.toFixed(2)}`;
        }
        console.log("Checkout: Cart items rendered. Subtotal:", subtotal.toFixed(2));
      } else {
        console.warn("Checkout: Checkout items container not found.");
      }
    }

    renderCheckout(); // Apeleză renderCheckout la încărcarea paginii de checkout

    const checkoutForm = document.querySelector('.checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log('Comanda a fost plasată cu succes!'); // Înlocuit alert
        cart = []; // Golește coșul
        saveCart(); // Actualizează stocarea locală și UI
        renderCheckout(); // Re-randează pentru a afișa coșul gol
        console.log("Checkout: Order placed successfully.");
      });
    } else {
      console.warn("Checkout: Checkout form not found.");
    }
  } else {
    console.log("Not on Checkout page.");
  }

  // Pentru pagina help.html, trimiterea formularului de contact
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    console.log("Contact Form: Initializing contact form logic.");
    contactForm.addEventListener('submit', function(event) {
      event.preventDefault(); // Previne trimiterea implicită a formularului
      console.log("Contact form submitted!"); // Debugging

      // Aici, în mod normal, ați trimite datele formularului către un server
      // Pentru acest exemplu, vom afișa doar o alertă
      console.log('Mesajul dumneavoastră a fost trimis cu succes!'); // Înlocuit alert

      // Opțional, goliți câmpurile formularului
      contactForm.reset();
    });
  } else {
    console.log("Contact Form: Contact form not found on this page.");
  }

  // Inițializări finale pentru toate paginile
  updateCartUI();
  updateWishlistUI();

  console.log("Script execution finished.");
}); // Sfârșitul DOMContentLoaded
