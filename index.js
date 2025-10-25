document.addEventListener('DOMContentLoaded', function() {
    
    // =======================================================
    // 1. ฟังก์ชันกลางสำหรับจัดการตะกร้า (ใช้ทั้ง 2 หน้า)
    // =======================================================
    const CART_KEY = 'shoppingCart';

    // ฟังก์ชันดึงข้อมูลตะกร้าจาก localStorage
    function getCart() {
        const cartData = localStorage.getItem(CART_KEY);
        return cartData ? JSON.parse(cartData) : [];
    }

    // ฟังก์ชันบันทึกข้อมูลตะกร้าลง localStorage
    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartCount(); // อัปเดตไอคอนทุกครั้งที่บันทึก
    }

    // ฟังก์ชันอัปเดตตัวเลขบนไอคอนตะกร้า
    function updateCartCount() {
        const cart = getCart();
        const cartIcon = document.querySelector('.cart');
        if (!cartIcon) return;

        // นับจำนวนรวม (ไม่ใช่แค่ชนิด)
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

        let countSpan = cartIcon.querySelector('.cart-count-badge');
        
        if (totalItems > 0) {
            cartIcon.classList.add('has-items');
            if (!countSpan) {
                countSpan = document.createElement('span');
                countSpan.classList.add('cart-count-badge');
                cartIcon.appendChild(countSpan);
            }
            countSpan.textContent = totalItems;
        } else {
            cartIcon.classList.remove('has-items');
            if (countSpan) countSpan.remove();
        }
        
        // อัปเดต localStorage count (เผื่อใช้)
        localStorage.setItem('cartTotalCount', totalItems.toString());
    }

    // =======================================================
    // 2. ตรวจสอบว่าอยู่หน้าไหน แล้วสั่งรันฟังก์ชัน
    // =======================================================
    
    // ถ้าเจอ .product-container (หน้าแรก)
    if (document.querySelector('.product-container')) {
        initHomePage();
    }
    
    // ถ้าเจอ .cart-page-container (หน้าตะกร้า)
    if (document.querySelector('.cart-page-container')) {
        initCartPage();
    }

    // (เพิ่มใหม่) เรียกใช้ฟังก์ชัน Modal เสมอ
    initModal();
    
    // อัปเดตไอคอนตะกร้าทุกครั้งที่โหลดหน้า
    updateCartCount();

    // =======================================================
    // 3. ฟังก์ชันสำหรับหน้าแรก (weed.html)
    // =======================================================
    function initHomePage() {
        
        // --- Slider Logic ---
        const slides = document.querySelectorAll('.slider-item');
        const dots = document.querySelectorAll('.dot');
        const prevButton = document.querySelector('.prev-button');
        const nextButton = document.querySelector('.next-button');
        let currentSlide = 0;
        let slideInterval;
        
        if (slides.length > 0) {
            function showSlide(index) {
                if (index >= slides.length) index = 0;
                if (index < 0) index = slides.length - 1;
                slides.forEach(slide => slide.classList.remove('active'));
                dots.forEach(dot => dot.classList.remove('active'));
                currentSlide = index;
                slides[currentSlide].classList.add('active');
                dots[currentSlide].classList.add('active');
            }
            function nextSlide() { showSlide(currentSlide + 1); }
            function startAutoSlide() { slideInterval = setInterval(nextSlide, 2500); }
            function stopAutoSlide() { clearInterval(slideInterval); }

            nextButton.addEventListener('click', () => { stopAutoSlide(); nextSlide(); startAutoSlide(); });
            prevButton.addEventListener('click', () => { stopAutoSlide(); showSlide(currentSlide - 1); startAutoSlide(); });
            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => { stopAutoSlide(); showSlide(index); startAutoSlide(); });
            });
            showSlide(0);
            startAutoSlide();
        }

        // --- Search Logic (อัปเดตใหม่ เพิ่ม Autocomplete) ---
        const searchInput = document.querySelector('.search-input');
        const productCards = Array.from(document.querySelectorAll('.product-card'));
        const resultsBox = document.getElementById('autocomplete-results');
        // ดึงชื่อสินค้าทั้งหมดมาเก็บไว้
        const allProductNames = productCards.map(card => card.querySelector('h3').textContent);

        if (searchInput && resultsBox) {
            
            // ฟังก์ชันสำหรับกรองสินค้าบนหน้า (โค้ดเดิม)
            function filterProductsOnPage(term) {
                 productCards.forEach(card => {
                    const productName = card.querySelector('h3').textContent.toLowerCase();
                    card.classList.toggle('hidden-by-search', !productName.includes(term));
                });
            }

            // เมื่อพิมพ์
            searchInput.addEventListener('keyup', function(event) {
                const searchTerm = event.target.value.toLowerCase().trim();
                
                // 1. กรองสินค้าบนหน้า (เหมือนเดิม)
                filterProductsOnPage(searchTerm);
                
                // 2. (เพิ่มใหม่) แสดง Autocomplete
                resultsBox.innerHTML = ''; // ล้างของเก่า
                if (searchTerm.length === 0) {
                    resultsBox.style.display = 'none';
                    return;
                }

                // ค้นหาชื่อที่ตรงกัน
                const matchedNames = allProductNames.filter(name => 
                    name.toLowerCase().includes(searchTerm)
                );

                if (matchedNames.length > 0) {
                    matchedNames.forEach(name => {
                        const item = document.createElement('div');
                        item.className = 'autocomplete-item';
                        item.textContent = name;
                        
                        // เมื่อคลิกที่คำแนะนำ
                        item.addEventListener('click', function() {
                            searchInput.value = name; // เอาชื่อไปใส่ในช่องค้นหา
                            resultsBox.style.display = 'none'; // ซ่อนกล่อง
                            
                            // สั่งให้กรองสินค้าบนหน้าอีกครั้ง ด้วยชื่อที่เลือก
                            filterProductsOnPage(name.toLowerCase().trim());
                        });
                        resultsBox.appendChild(item);
                    });
                    resultsBox.style.display = 'block';
                } else {
                    resultsBox.style.display = 'none';
                }
            });

            // (เพิ่มใหม่) ซ่อนกล่องผลลัพธ์เมื่อคลิกที่อื่น
            document.addEventListener('click', function(e) {
                // ถ้าไม่ได้คลิกที่ช่องค้นหา หรือ กล่องผลลัพธ์
                if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
                    resultsBox.style.display = 'none';
                }
            });
        }
        // --- End of Search Logic ---


        // --- Add to Cart Logic (อัปเดตใหม่) ---
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                
                const card = button.closest('.product-card');
                const quantityInput = card.querySelector('.item-qty');
                const quantity = parseInt(quantityInput.value, 10);
                
                if (quantity > 0 && quantity <= 99) {
                    const productId = button.dataset.productId;
                    const productName = card.querySelector('h3').textContent;
                    const productPriceText = card.querySelector('.price').textContent;
                    // ลบ '฿' และ ',' ออก (ถ้ามี)
                    const productPrice = parseFloat(productPriceText.replace('฿', '').replace(',', ''));
                    const productImage = card.querySelector('img').src;

                    // ดึงตะกร้าปัจจุบัน
                    let cart = getCart();
                    
                    // หาสินค้าในตะกร้า
                    let existingItem = cart.find(item => item.id === productId);

                    if (existingItem) {
                        // ถ้ามีอยู่แล้ว ให้อัปเดตจำนวน
                        existingItem.quantity += quantity;
                    } else {
                        // ถ้าไม่มี ให้เพิ่มใหม่
                        cart.push({
                            id: productId,
                            name: productName,
                            price: productPrice,
                            image: productImage,
                            quantity: quantity
                        });
                    }
                    
                    // บันทึกตะกร้า
                    saveCart(cart);
                    
                    alert(`เพิ่ม "${productName}" จำนวน ${quantity} ต้น ลงในตะกร้าแล้ว!`);
                    
                    // รีเซ็ตช่องจำนวนกลับเป็น 1
                    quantityInput.value = 1;
                    
                } else {
                    alert('กรุณาเลือกจำนวนสินค้าที่ถูกต้อง (1 - 99 ต้น)');
                }
            });
        });
    }

    // =======================================================
    // 4. ฟังก์ชันสำหรับหน้าตะกร้า (cart.html)
    // =======================================================
    // =======================================================
    // 4. ฟังก์ชันสำหรับหน้าตะกร้า (cart.html)
    // =======================================================
    function initCartPage() {
        const cart = getCart();
        const itemsListContainer = document.querySelector('.cart-items-list');
        const emptyCartMsg = document.getElementById('empty-cart-message');
        
        // (แก้ไข) ต้องเช็คว่า element มีอยู่จริงก่อน
        if (!itemsListContainer || !emptyCartMsg) return;

        if (cart.length === 0) {
            // ถ้าตะกร้าว่าง
            emptyCartMsg.style.display = 'block';
            const cartLayout = document.querySelector('.cart-layout');
            if (cartLayout) cartLayout.style.display = 'none';
        } else {
            // ถ้ามีสินค้า
            emptyCartMsg.style.display = 'none';
            itemsListContainer.innerHTML = ''; // ล้างของเก่าก่อน
            
            cart.forEach(item => {
                const itemTotalPrice = item.price * item.quantity;
                const itemHtml = `
                    <div class="cart-item" data-product-id="${item.id}">
                        <div class="cart-item-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <h3>${item.name}</h3>
                            <p class="item-price">ราคา: ฿${item.price.toFixed(2)}</p>
                            <div class="cart-item-actions">
                                <input type="number" class="item-qty" value="${item.quantity}" min="1" max="99" data-product-id="${item.id}">
                                <button class="remove-item-btn" data-product-id="${item.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="cart-item-total-price">
                            ฿${itemTotalPrice.toFixed(2)}
                        </div>
                    </div>
                `;
                itemsListContainer.innerHTML += itemHtml;
            });
            
            updateCartSummary();
            addCartPageEventListeners();
            
            // (เพิ่มใหม่) เรียกใช้ฟังก์ชัน Modal ชำระเงิน
            initCheckoutModal();
        }
    }
    
    // (ฟังก์ชันนี้เหมือนเดิม)
    // ฟังก์ชันอัปเดตสรุปยอด
    function updateCartSummary() {
        const cart = getCart();
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

        // (แก้ไข) เช็คว่า element มีอยู่จริง
        const countEl = document.getElementById('cart-item-count');
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');

        if (countEl) countEl.textContent = totalItems;
        if (subtotalEl) subtotalEl.textContent = `฿${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `฿${subtotal.toFixed(2)}`;
    }
    
    // (ฟังก์ชันนี้เหมือนเดิม)
    // ฟังก์ชันเพิ่ม Event Listener ในหน้าตะกร้า
    function addCartPageEventListeners() {
        
        // 1. ปุ่มลบสินค้า
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.productId;
                let cart = getCart();
                cart = cart.filter(item => item.id !== productId); // กรองอันที่ลบออก
                saveCart(cart);
                
                // โหลดหน้าใหม่เพื่อวาดตะกร้าใหม่ (ง่ายที่สุด)
                location.reload(); 
            });
        });
        
        // 2. ช่องเปลี่ยนจำนวนสินค้า
        document.querySelectorAll('.cart-item .item-qty').forEach(input => {
            input.addEventListener('change', function() {
                const productId = this.dataset.productId;
                let newQuantity = parseInt(this.value, 10);
                
                if (newQuantity < 1) {
                    newQuantity = 1;
                    this.value = 1;
                }
                 if (newQuantity > 99) { // (เพิ่ม) กันคนพิมพ์เกิน 99
                    newQuantity = 99;
                    this.value = 99;
                }
                
                let cart = getGet();
                let itemInCart = cart.find(item => item.id === productId);
                
                if (itemInCart) {
                    itemInCart.quantity = newQuantity;
                    saveCart(cart);
                    
                    // อัปเดตราคาของแถวนี้
                    const itemTotalPriceEl = this.closest('.cart-item').querySelector('.cart-item-total-price');
                    itemTotalPriceEl.textContent = `฿${(itemInCart.price * newQuantity).toFixed(2)}`;
                    
                    // อัปเดตสรุปยอดรวม (ไม่ต้องโหลดใหม่)
                    updateCartSummary();
                }
            });
        });
    }

    // (เพิ่มใหม่) ฟังก์ชันสำหรับจัดการ Modal ชำระเงิน
    function initCheckoutModal() {
        const checkoutBtn = document.querySelector('.checkout-btn');
        const checkoutModal = document.getElementById('checkout-modal');
        
        if (!checkoutBtn || !checkoutModal) return; // ถ้าหาไม่เจอ ก็ไม่ต้องทำอะไร

        const closeBtn = checkoutModal.querySelector('.close-btn');
        const modalTotalEl = document.getElementById('modal-total-price');
        const confirmBtn = document.getElementById('confirm-payment-btn');

        // 1. คลิกปุ่ม "ไปที่หน้าชำระเงิน"
        checkoutBtn.addEventListener('click', function() {
            // ดึงยอดรวมล่าสุดจากหน้าตะกร้า
            const currentTotal = document.getElementById('cart-total').textContent;
            
            // เอาราคาไปใส่ใน Modal
            modalTotalEl.textContent = currentTotal;
            
            // เปิด Modal
            checkoutModal.classList.add('active');
        });

        // 2. คลิกปุ่ม "X" เพื่อปิด
        closeBtn.addEventListener('click', function() {
            checkoutModal.classList.remove('active');
        });

        // 3. คลิกปุ่ม "ยืนยันและไปต่อ"
        confirmBtn.addEventListener('click', function() {
            const address = document.getElementById('shipping-address').value.trim();
            
            if (address.length < 10) {
                alert('กรุณากรอกที่อยู่สำหรับจัดส่งให้ครบถ้วน');
                return; // ไม่ไปต่อ
            }
            
            // (Demo) แจ้งเตือน และปิด Modal
            alert('ขอบคุณครับ! ระบบกำลังนำคุณไปยังหน้าอัปโหลดสลิป (ยังไม่สร้าง)');
            checkoutModal.classList.remove('active');
            
            // (ในอนาคต) เมื่อคุณสร้างหน้าใหม่
            // window.location.href = 'upload-slip.html';
        });

        // 4. คลิกที่พื้นหลังสีเทาเพื่อปิด
        window.addEventListener('click', function(event) {
            if (event.target == checkoutModal) {
                checkoutModal.classList.remove('active');
            }
        });
    }

    // =======================================================
    // 5. (ฟังก์ชันนี้เหมือนเดิม) ฟังก์ชันสำหรับ Modal (Login Popup)
    // =======================================================
    function initModal() {
        const loginButton = document.getElementById('login-button');
        const modal = document.getElementById('login-modal');
        const closeBtn = modal ? modal.querySelector('.close-btn') : null; // (แก้ไข) หา closeBtn จาก modal

        if (loginButton && modal && closeBtn) {
            loginButton.addEventListener('click', function(event) {
                event.preventDefault(); 
                modal.classList.add('active');
            });
            
            closeBtn.addEventListener('click', function() {
                modal.classList.remove('active');
            });
            
            window.addEventListener('click', function(event) {
                if (event.target == modal) {
                    modal.classList.remove('active');
                }
            });
        }
    }
    
    // ฟังก์ชันอัปเดตสรุปยอด
    function updateCartSummary() {
        const cart = getCart();
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

        // (แก้ไข) เช็คว่า element มีอยู่จริง
        const countEl = document.getElementById('cart-item-count');
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');

        if (countEl) countEl.textContent = totalItems;
        if (subtotalEl) subtotalEl.textContent = `฿${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `฿${subtotal.toFixed(2)}`;
    }
    
    // ฟังก์ชันเพิ่ม Event Listener ในหน้าตะกร้า
    function addCartPageEventListeners() {
        
        // 1. ปุ่มลบสินค้า
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.productId;
                let cart = getCart();
                cart = cart.filter(item => item.id !== productId); // กรองอันที่ลบออก
                saveCart(cart);
                
                // โหลดหน้าใหม่เพื่อวาดตะกร้าใหม่ (ง่ายที่สุด)
                location.reload(); 
            });
        });
        
        // 2. ช่องเปลี่ยนจำนวนสินค้า
        document.querySelectorAll('.cart-item .item-qty').forEach(input => {
            input.addEventListener('change', function() {
                const productId = this.dataset.productId;
                let newQuantity = parseInt(this.value, 10);
                
                if (newQuantity < 1) {
                    newQuantity = 1;
                    this.value = 1;
                }
                 if (newQuantity > 99) { // (เพิ่ม) กันคนพิมพ์เกิน 99
                    newQuantity = 99;
                    this.value = 99;
                }
                
                let cart = getCart();
                let itemInCart = cart.find(item => item.id === productId);
                
                if (itemInCart) {
                    itemInCart.quantity = newQuantity;
                    saveCart(cart);
                    
                    // อัปเดตราคาของแถวนี้
                    const itemTotalPriceEl = this.closest('.cart-item').querySelector('.cart-item-total-price');
                    itemTotalPriceEl.textContent = `฿${(itemInCart.price * newQuantity).toFixed(2)}`;
                    
                    // อัปเดตสรุปยอดรวม (ไม่ต้องโหลดใหม่)
                    updateCartSummary();
                }
            });
        });
    }

    // =======================================================
    // 5. (เพิ่มใหม่) ฟังก์ชันสำหรับ Modal (Login Popup)
    // =======================================================
    function initModal() {
        const loginButton = document.getElementById('login-button');
        const modal = document.getElementById('login-modal');
        const closeBtn = modal ? modal.querySelector('.close-btn') : null; // (แก้ไข) หา closeBtn จาก modal

        if (loginButton && modal && closeBtn) {
            loginButton.addEventListener('click', function(event) {
                event.preventDefault(); 
                modal.classList.add('active');
            });
            
            closeBtn.addEventListener('click', function() {
                modal.classList.remove('active');
            });
            
            window.addEventListener('click', function(event) {
                if (event.target == modal) {
                    modal.classList.remove('active');
                }
            });
        }
    }
    
});