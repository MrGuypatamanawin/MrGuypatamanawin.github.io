document.addEventListener('DOMContentLoaded', function() {
    
    // =======================================================
    // 0. การตั้งค่า Global (Backend URL และ Keys)
    // =======================================================
    const CART_KEY = 'shoppingCart';
    const USER_ACCOUNT_KEY = 'userAccounts'; 
    const CURRENT_USER_KEY = 'currentUser';
    
    // *** Admin ID ที่ใช้ตรวจสอบสิทธิ์ ***
    const ADMIN_ID = 'admin1104300513535'; 
    // **********************************

    // *** URL ของ Backend Server ของคุณ ***
    const BACKEND_URL = 'http://localhost:3000'; 
    // *****************************************

    // =======================================================
    // 1. ฟังก์ชันกลางสำหรับจัดการ Data (Local Storage)
    // =======================================================
    
    function getCart() {
        const cartData = localStorage.getItem(CART_KEY);
        return cartData ? JSON.parse(cartData) : [];
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartCount(); 
    }
    
    // ฟังก์ชันสำหรับ Login/Register
    function getAccounts() {
        const accountsData = localStorage.getItem(USER_ACCOUNT_KEY);
        return accountsData ? JSON.parse(accountsData) : {};
    }

    function saveAccounts(accounts) {
        localStorage.setItem(USER_ACCOUNT_KEY, JSON.stringify(accounts));
    }
    
    function getCurrentUser() {
        return localStorage.getItem(CURRENT_USER_KEY);
    }
    
    function setCurrentUser(userId) {
        if (userId) {
            localStorage.setItem(CURRENT_USER_KEY, userId);
        } else {
            localStorage.removeItem(CURRENT_USER_KEY);
        }
        updateLoginStatus();
    }
    
    // =======================================================
    // 2. ฟังก์ชันอัปเดต UI
    // =======================================================

    function updateCartCount() {
        const cart = getCart();
        const cartIcon = document.querySelector('.cart');
        if (!cartIcon) return;

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
        localStorage.setItem('cartTotalCount', totalItems.toString());
    }
    
    function updateLoginStatus() {
        const currentUser = getCurrentUser();
        const loginButton = document.getElementById('login-button');
        
        if (loginButton) {
            if (currentUser) {
                loginButton.textContent = `ยินดีต้อนรับ, ${currentUser}`;
            } else {
                loginButton.textContent = 'Login';
            }
        }
    }


    // =======================================================
    // 3. การเริ่มต้น (Init) ในแต่ละหน้า (จุดรวม logic)
    // =======================================================
    
    if (document.querySelector('.product-container')) {
        initHomePage();
    }
    
    if (document.querySelector('.cart-page-container')) {
        initCartPage();
    }
    
    if (document.querySelector('.orders-page-container')) {
        initOrdersPage();
    }
    
    if (document.querySelector('.admin-container')) {
        initAdminPage();
    }
    
    if (document.querySelector('.upload-container')) {
        initUploadPage();
    }

    initModalLogic();
    updateCartCount();
    updateLoginStatus();


    // =======================================================
    // 4. Logic สำหรับหน้าแรก (index.html)
    // =======================================================
    function initHomePage() {
        // --- Slider Logic (เหมือนเดิม) ---
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

        // --- Search Logic (เหมือนเดิม) ---
        const searchInput = document.querySelector('.search-input');
        const productCards = Array.from(document.querySelectorAll('.product-card'));
        const resultsBox = document.getElementById('autocomplete-results');
        const allProductNames = productCards.map(card => card.querySelector('h3').textContent);

        if (searchInput && resultsBox) {
            
            function filterProductsOnPage(term) {
                 productCards.forEach(card => {
                    const productName = card.querySelector('h3').textContent.toLowerCase();
                    card.classList.toggle('hidden-by-search', !productName.includes(term));
                });
            }

            searchInput.addEventListener('keyup', function(event) {
                const searchTerm = event.target.value.toLowerCase().trim();
                
                filterProductsOnPage(searchTerm);
                
                resultsBox.innerHTML = ''; 
                if (searchTerm.length === 0) {
                    resultsBox.style.display = 'none';
                    return;
                }

                const matchedNames = allProductNames.filter(name => 
                    name.toLowerCase().includes(searchTerm)
                );

                if (matchedNames.length > 0) {
                    matchedNames.forEach(name => {
                        const item = document.createElement('div');
                        item.className = 'autocomplete-item';
                        item.textContent = name;
                        
                        item.addEventListener('click', function() {
                            searchInput.value = name; 
                            resultsBox.style.display = 'none'; 
                            filterProductsOnPage(name.toLowerCase().trim());
                        });
                        resultsBox.appendChild(item);
                    });
                    resultsBox.style.display = 'block';
                } else {
                    resultsBox.style.display = 'none';
                }
            });

            document.addEventListener('click', function(e) {
                if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
                    resultsBox.style.display = 'none';
                }
            });
        }

        // --- Add to Cart Logic (เหมือนเดิม) ---
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
                    
                    const productPrice = parseFloat(productPriceText.replace('฿', '').replace(',', ''));
                    const productImage = card.querySelector('img').src;

                    let cart = getCart();
                    let existingItem = cart.find(item => item.id === productId);

                    if (existingItem) {
                        existingItem.quantity += quantity;
                    } else {
                        cart.push({
                            id: productId,
                            name: productName,
                            price: productPrice,
                            image: productImage,
                            quantity: quantity
                        });
                    }
                    
                    saveCart(cart);
                    
                    alert(`เพิ่ม "${productName}" จำนวน ${quantity} ต้น ลงในตะกร้าแล้ว!`);
                    
                    quantityInput.value = 1;
                    
                } else {
                    alert('กรุณาเลือกจำนวนสินค้าที่ถูกต้อง (1 - 99 ต้น)');
                }
            });
        });
    }

    // =======================================================
    // 5. Logic สำหรับหน้าตะกร้า (cart.html)
    // =======================================================
    function initCartPage() {
        const cart = getCart();
        const itemsListContainer = document.querySelector('.cart-items-list');
        const emptyCartMsg = document.getElementById('empty-cart-message');
        
        if (!itemsListContainer || !emptyCartMsg) return;

        if (cart.length === 0) {
            emptyCartMsg.style.display = 'block';
            const cartLayout = document.querySelector('.cart-layout');
            if (cartLayout) cartLayout.style.display = 'none';
        } else {
            emptyCartMsg.style.display = 'none';
            itemsListContainer.innerHTML = ''; 
            
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
        }
    }
    
    function updateCartSummary() {
        const cart = getCart();
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

        const countEl = document.getElementById('cart-item-count');
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');

        if (countEl) countEl.textContent = totalItems;
        if (subtotalEl) subtotalEl.textContent = `฿${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `฿${subtotal.toFixed(2)}`;
    }
    
    function addCartPageEventListeners() {
        
        // 1. ปุ่มลบสินค้า
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.productId;
                let cart = getCart();
                cart = cart.filter(item => item.id !== productId); 
                saveCart(cart);
                
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
                 if (newQuantity > 99) { 
                    newQuantity = 99;
                    this.value = 99;
                }
                
                let cart = getCart(); 
                let itemInCart = cart.find(item => item.id === productId);
                
                if (itemInCart) {
                    itemInCart.quantity = newQuantity;
                    saveCart(cart);
                    
                    const itemTotalPriceEl = this.closest('.cart-item').querySelector('.cart-item-total-price');
                    itemTotalPriceEl.textContent = `฿${(itemInCart.price * newQuantity).toFixed(2)}`;
                    
                    updateCartSummary();
                }
            });
        });
    }

    // =======================================================
    // 6. Logic สำหรับ Modal (Login และ Checkout)
    // =======================================================
    function initModalLogic() {
        
        // --- ส่วนประกอบของ Modal Login/Register ---
        const loginButton = document.getElementById('login-button');
        const loginModal = document.getElementById('login-modal');
        const loginCloseBtn = loginModal ? loginModal.querySelector('.close-btn') : null; 
        
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const loggedInMessage = document.getElementById('logged-in-message');
        const modalTitle = document.getElementById('login-modal-title');
        
        const loginConfirmBtn = document.getElementById('auth-confirm-btn');
        const registerConfirmBtn = document.getElementById('register-confirm-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        const currentUserIdDisplay = document.getElementById('current-user-id');

        // --- ส่วนประกอบของ Modal Checkout ---
        const checkoutBtn = document.querySelector('.checkout-btn');
        const checkoutModal = document.getElementById('checkout-modal');
        const checkoutCloseBtn = checkoutModal ? checkoutModal.querySelector('.close-btn') : null;
        const modalTotalEl = document.getElementById('modal-total-price');
        const confirmBtn = document.getElementById('confirm-payment-btn');
        
        
        // =======================================================
        // ฟังก์ชันสลับฟอร์ม 
        // =======================================================
        function showForm(mode) {
            // กำหนดค่าเริ่มต้นให้ซ่อนทุกฟอร์ม
            loginForm.style.display = 'none';
            registerForm.style.display = 'none';
            loggedInMessage.style.display = 'none'; 

            if (mode === 'login') {
                loginForm.style.display = 'block';
                modalTitle.textContent = 'เข้าสู่ระบบ';
            } else if (mode === 'register') {
                registerForm.style.display = 'block';
                modalTitle.textContent = 'สมัครสมาชิก';
            } else if (mode === 'loggedIn') {
                // เมื่อ Login สำเร็จ ให้แสดงส่วนนี้ (พร้อมปุ่ม Logout)
                loggedInMessage.style.display = 'block';
                currentUserIdDisplay.textContent = getCurrentUser();
                modalTitle.textContent = 'ข้อมูลบัญชี';
            }
        }
        
        // =======================================================
        // 1. Logic การเปิด/ปิด Modal Login และการสลับโหมด
        // =======================================================
        if (loginButton && loginModal && loginCloseBtn) {
            loginButton.addEventListener('click', function(event) {
                event.preventDefault(); 
                loginModal.classList.add('active');
                
                // ตรวจสอบสถานะและแสดงฟอร์มที่ถูกต้องเมื่อเปิด Modal
                if (getCurrentUser()) {
                    showForm('loggedIn');
                } else {
                    showForm('login');
                }
            });

            loginCloseBtn.addEventListener('click', function() {
                loginModal.classList.remove('active');
            });
            
            window.addEventListener('click', function(event) {
                if (event.target == loginModal) {
                    loginModal.classList.remove('active');
                }
            });
        }
        
        // Event Listeners สลับโหมด
        if(switchToRegister) switchToRegister.addEventListener('click', (e) => { e.preventDefault(); showForm('register'); });
        if(switchToLogin) switchToLogin.addEventListener('click', (e) => { e.preventDefault(); showForm('login'); });

        // =======================================================
        // 2. Logic สมัครสมาชิก, เข้าสู่ระบบ, ออกจากระบบ
        // =======================================================
        
        // Logic สมัครสมาชิก
        if(registerConfirmBtn) registerConfirmBtn.addEventListener('click', function() {
            const id = document.getElementById('register-id').value.trim();
            const password = document.getElementById('register-password').value.trim();
            
            if (id.length < 3 || password.length < 4) {
                alert('ID ต้องมีอย่างน้อย 3 ตัวอักษร และ Password ต้องมีอย่างน้อย 4 ตัวอักษร');
                return;
            }
            let accounts = getAccounts();
            if (accounts[id]) {
                alert(`ID "${id}" ถูกใช้งานแล้ว!`);
                return;
            }
            accounts[id] = password; 
            saveAccounts(accounts);
            setCurrentUser(id); 
            alert(`สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ ${id}`);
            
            // ตรวจสอบ Admin เมื่อสมัครสมาชิก
            if (id === ADMIN_ID) {
                loginModal.classList.remove('active');
                window.location.href = 'admin.html';
                return;
            }
            
            showForm('loggedIn');
            document.getElementById('register-id').value = '';
            document.getElementById('register-password').value = '';
        });

        // Logic เข้าสู่ระบบ
        if(loginConfirmBtn) loginConfirmBtn.addEventListener('click', function() {
            const id = document.getElementById('login-id').value.trim();
            const password = document.getElementById('login-password').value.trim();
            
            const accounts = getAccounts();
            
            if (accounts[id] && accounts[id] === password) {
                setCurrentUser(id);
                alert(`เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ${id}`);
                
                // ********************************************************
                // *** ตรวจสอบสิทธิ์ Admin และเปลี่ยนหน้า ***
                if (id === ADMIN_ID) {
                    loginModal.classList.remove('active');
                    window.location.href = 'admin.html'; // พา Admin ไปหน้าจัดการ
                    return;
                }
                // ********************************************************

                showForm('loggedIn');
                document.getElementById('login-id').value = '';
                document.getElementById('login-password').value = '';
            } else {
                alert('ID หรือ Password ไม่ถูกต้อง!');
            }
        });
        
        // Logic ออกจากระบบ (Logout)
        if(logoutBtn) logoutBtn.addEventListener('click', function() {
            setCurrentUser(null);
            alert('ออกจากระบบสำเร็จ');
            showForm('login');
            loginModal.classList.remove('active');
            
            // พาไปหน้าแรกหลัง Logout (เสริม)
            if(window.location.pathname.includes('admin.html')) {
                window.location.href = 'index.html';
            }
        });

        // =======================================================
        // 3. Logic Checkout (เชื่อม Backend)
        // =======================================================
        
        if (!checkoutBtn || !checkoutModal) return;

        checkoutBtn.addEventListener('click', function() {
            // ตรวจสอบ Login ก่อน Checkout
            const currentUser = getCurrentUser();
            if (!currentUser) {
                alert('กรุณาเข้าสู่ระบบก่อนดำเนินการชำระเงิน!');
                loginModal.classList.add('active'); 
                showForm('login');
                return;
            }
            
            const currentTotal = document.getElementById('cart-total').textContent;
            modalTotalEl.textContent = currentTotal;
            checkoutModal.classList.add('active');
        });

        if(checkoutCloseBtn) checkoutCloseBtn.addEventListener('click', function() {
            checkoutModal.classList.remove('active');
        });

        // 3. คลิกปุ่ม "ยืนยันและไปต่อ" <--- ส่งข้อมูลไป Backend
        confirmBtn.addEventListener('click', async function() {
            const address = document.getElementById('shipping-address').value.trim();
            
            if (address.length < 10) {
                alert('กรุณากรอกที่อยู่สำหรับจัดส่งให้ครบถ้วน');
                return; 
            }
            
            // รวบรวมข้อมูลคำสั่งซื้อ
            const cart = getCart();
            const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            
            // ดึง User ID ที่ Login อยู่ (สำคัญ)
            const currentUser = getCurrentUser(); 

            const orderData = {
                address: address,
                total: subtotal.toFixed(2),
                items: cart,
                userId: currentUser // <--- [ส่ง] userId ไป Backend
            };
            
            try {
                // ** ใช้ fetch API เพื่อส่งข้อมูลไปยัง Backend Server **
                const response = await fetch(`${BACKEND_URL}/api/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();
                
                if (response.ok) {
                    // ถ้า Backend ตอบกลับมาสำเร็จ (Status 201)
                    saveCart([]); // ล้างตะกร้าสินค้า (Frontend)
                    
                    alert(`การสั่งซื้อสำเร็จ! Order ID: ${result.orderId}. ระบบกำลังพาคุณไปหน้าอัปโหลดสลิป`);
                    
                    // เปลี่ยนหน้าไปหน้าอัปโหลดสลิป
                    checkoutModal.classList.remove('active');
                    window.location.href = `upload.html?orderId=${result.orderId}`; // <--- พาไปหน้าอัปโหลดสลิป
                    
                } else {
                    alert(`เกิดข้อผิดพลาดในการสั่งซื้อ: ${result.message}`);
                    console.error('Backend Error:', result);
                }
                
            } catch (error) {
                alert('ไม่สามารถติดต่อ Server ได้ กรุณาตรวจสอบว่า Backend Server กำลังรันอยู่');
                console.error('Network or Server connection error:', error);
            }
        });

        window.addEventListener('click', function(event) {
            if (event.target == checkoutModal) {
                checkoutModal.classList.remove('active');
            }
        });
    }
    
    // =======================================================
    // 7. Logic สำหรับหน้ารายการสั่งซื้อ (orders.html)
    // =======================================================
    function initOrdersPage() {
        
        const ordersListContainer = document.getElementById('orders-list');
        const noOrdersMsg = document.getElementById('no-orders-message');
        
        const currentUser = getCurrentUser(); 
        
        if (!ordersListContainer || !noOrdersMsg) return;

        // 1. [แก้ไข] ป้องกัน Admin เข้าหน้า User Order
        if (currentUser === ADMIN_ID) {
            alert('Admin สามารถดูรายการสั่งซื้อได้ที่หน้า Admin Panel เท่านั้น');
            window.location.href = 'admin.html'; // พาไปหน้า Admin Panel
            return;
        }

        // 2. ถ้าไม่ได้ Login ให้แสดงข้อความเตือน
        if (!currentUser) {
            displayLoginRequiredMessage();
            return;
        }

        // 3. ดึงรายการสั่งซื้อทั้งหมดของ User นี้จาก Backend
        fetchUserOrdersFromBackend(currentUser);
        

        // ฟังก์ชันดึง Order จาก Backend
        async function fetchUserOrdersFromBackend(userId) {
            try {
                ordersListContainer.innerHTML = '<div style="text-align: center; padding: 50px;">กำลังโหลดรายการสั่งซื้อของคุณ...</div>';

                const response = await fetch(`${BACKEND_URL}/api/orders/user/${userId}`);
                const orders = await response.json(); 
                
                if (response.ok) {
                    if (orders.length === 0) {
                        displayNoOrderMessage();
                        return;
                    }
                    renderOrdersList(orders);
                } else {
                    ordersListContainer.innerHTML = '<div style="text-align: center; padding: 50px; color: #e74c3c;">เกิดข้อผิดพลาดในการดึงรายการสั่งซื้อ</div>';
                }

            } catch (error) {
                ordersListContainer.innerHTML = '<div style="text-align: center; padding: 50px; color: #e74c3c;">ไม่สามารถติดต่อ Server ได้ กรุณาตรวจสอบว่า Backend Server รันอยู่ (Port 3000)</div>';
                console.error('Fetch Orders Error:', error);
            }
        }
        
        // ฟังก์ชันแสดงผลรายการทั้งหมด
        function renderOrdersList(orders) {
            ordersListContainer.innerHTML = ''; 
            noOrdersMsg.style.display = 'none';

            orders.forEach(order => {
                // *** [แก้ไข] เพิ่ม Logic แสดงเลข Tracking ***
                let trackingInfo = '';
                if (order.status === 'Shipped' && order.trackingNumber) {
                    // กำหนด URL ใหม่ตามที่คุณต้องการ: https://ems.thaiware.com/[เลขพัสดุ]
                    const trackingUrl = `https://ems.thaiware.com/${order.trackingNumber}`;
                    
                    trackingInfo = `<p style="font-weight: 600; color: #1B5E20; margin-top: 10px;">
                                        เลขที่พัสดุ: <a href="${trackingUrl}" target="_blank" style="color: #007bff; text-decoration: none;">
                                            ${order.trackingNumber} <i class="fas fa-external-link-alt"></i>
                                        </a>
                                    </p>`;
                } else if (order.status === 'Paid') {
                    trackingInfo = '<p style="font-weight: 600; color: #2E7D32; margin-top: 10px;">กำลังเตรียมการจัดส่ง...</p>';
                }
               
                // ********************************************
                
                const isPaymentPending = order.status === 'Payment Pending'; // สถานะใหม่
                const statusClass = order.status === 'Paid' ? 'paid' : (order.status === 'Shipped' ? 'shipped' : (isPaymentPending ? 'PaymentPending' : 'pending'));
                const statusText = order.status === 'Paid' ? 'ชำระเงินแล้ว' : (order.status === 'Shipped' ? 'จัดส่งแล้ว' : (isPaymentPending ? 'รอตรวจสอบสลิป' : 'รอการชำระเงิน'));
                
                const orderDate = new Date(order.orderDate).toLocaleDateString('th-TH', { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                });

                let itemsHtml = order.items.map(item => 
                    `<p>${item.name} x ${item.quantity} (฿${(item.price * item.quantity).toFixed(2)})</p>`
                ).join('');
                
                // เพิ่มปุ่ม "อัปโหลดหลักฐาน" เมื่อสถานะเป็น Pending (รอการชำระเงิน)
                let orderActionsHtml = '';
                if (order.status === 'Pending') {
                    orderActionsHtml = `<a href="upload.html?orderId=${order.orderId}" class="back-to-shop-btn" style="width: auto; margin-top: 15px; display: inline-block;">
                                            <i class="fas fa-file-upload"></i> อัปโหลดหลักฐานการโอน
                                        </a>`;
                }

                const orderCardHtml = `
                    <div class="order-card">
                        <div class="order-header">
                            <span>คำสั่งซื้อ: #${order.orderId}</span>
                            <span class="status ${statusClass}">${statusText}</span>
                        </div>
                        <div class="order-details">
                            <p><strong>วันที่สั่ง:</strong> ${orderDate}</p>
                            <p><strong>ที่อยู่จัดส่ง:</strong> ${order.address}</p>
                            <hr>
                            <h4>รายการสินค้า:</h4>
                            <div class="order-item-list">${itemsHtml}</div>
                            <div class="order-total">ยอดสุทธิ: ฿${order.total}</div>
                            ${trackingInfo}
                            ${orderActionsHtml} 
                        </div>
                    </div>
                `;
           
        ordersListContainer.innerHTML += orderCardHtml; // <-- แสดงผลการ์ด
    });
                

        }
        
        // ฟังก์ชันแสดงข้อความไม่มีรายการสั่งซื้อ
        function displayNoOrderMessage() {
            noOrdersMsg.style.display = 'block';
            ordersListContainer.innerHTML = '';
            noOrdersMsg.innerHTML = '<i class="fas fa-box-open fa-3x"></i><p>คุณยังไม่มีรายการสั่งซื้อ</p><a href="index.html" class="back-to-shop-btn">เลือกซื้อสินค้าต่อ</a>';
        }

        // ฟังก์ชันแสดงข้อความต้อง Login
        function displayLoginRequiredMessage() {
            noOrdersMsg.style.display = 'block';
            ordersListContainer.innerHTML = '';
            noOrdersMsg.innerHTML = '<i class="fas fa-lock fa-3x"></i><p>กรุณา Login เพื่อดูรายการสั่งซื้อของคุณ</p><a href="#" class="back-to-shop-btn" id="login-button-from-orders">เข้าสู่ระบบ</a>';
            
            document.getElementById('login-button-from-orders').addEventListener('click', (e) => {
                e.preventDefault();
                const loginBtnOnNav = document.getElementById('login-button');
                if (loginBtnOnNav) loginBtnOnNav.click();
            });
        }
    }
    
    // =======================================================
    // 8. Logic สำหรับหน้า Admin (admin.html)
    // =======================================================
    function initAdminPage() {
        
        // ตรวจสอบว่าอยู่หน้า Admin หรือไม่
        if (!document.querySelector('.admin-container')) return;
        
        const currentUser = getCurrentUser(); 
        
        // 1. **ตรวจสอบสิทธิ์ Admin (ป้องกันการเข้าถึง)**
        if (currentUser !== ADMIN_ID) {
            alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
            window.location.href = 'index.html'; 
            return; 
        }
        
        // 2. ประกาศตัวแปรสำหรับองค์ประกอบ Admin Page
        const ordersListContainer = document.getElementById('admin-orders-list');
        const statusMessage = document.getElementById('admin-status-message');
        
        // โค้ดสำหรับ Modal ดูสลิป (ต้องมีใน admin.html)
        const slipModal = document.getElementById('slip-display-modal');
        const slipImage = document.getElementById('slip-image');
        const slipCloseBtn = slipModal ? slipModal.querySelector('.close-btn') : null;
        
        // Modal สำหรับใส่เลข Tracking
        const trackingModal = document.getElementById('tracking-modal');
        const trackingForm = document.getElementById('tracking-form');
        const trackingOrderIdInput = document.getElementById('tracking-order-id');
        const displayTrackingOrderId = document.getElementById('display-tracking-order-id');
        
        
        fetchOrdersList(); // เริ่มดึงข้อมูล

        // 3. ฟังก์ชันดึงรายการสั่งซื้อทั้งหมดจาก Backend
        async function fetchOrdersList() {
            ordersListContainer.innerHTML = '';
            statusMessage.textContent = 'กำลังโหลดข้อมูล...';
            
            try {
                // API: ดึงออเดอร์ทั้งหมด
                const response = await fetch(`${BACKEND_URL}/api/admin/orders`);
                const orders = await response.json(); 

                if (response.ok && orders.length > 0) {
                    statusMessage.style.display = 'none';
                    renderAdminOrders(orders);
                } else if (orders.length === 0) {
                    statusMessage.textContent = 'ยังไม่มีคำสั่งซื้อเข้ามา';
                } else {
                    statusMessage.textContent = 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์';
                }
            } catch (error) {
                statusMessage.textContent = 'ไม่สามารถติดต่อ Backend Server ได้ (Port 3000)';
                console.error('Admin Fetch Error:', error);
            }
        }

        // 4. แสดงผลรายการสั่งซื้อทั้งหมด
        function renderAdminOrders(orders) {
            ordersListContainer.innerHTML = '';
            orders.forEach(order => {
                const isPending = order.status === 'Pending' || order.status === 'Payment Pending';
                const isShipped = order.status === 'Shipped';
                const statusClass = order.status === 'Paid' ? 'paid' : (order.status === 'Payment Pending' ? 'PaymentPending' : (isShipped ? 'shipped' : 'pending'));
                const cardClass = isPending ? 'order-card order-card-admin' : 'order-card';

                const orderDate = new Date(order.orderDate).toLocaleDateString('th-TH', { 
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });
                
                const statusText = order.status === 'Paid' ? 'ชำระเงินแล้ว' : (order.status === 'Shipped' ? 'จัดส่งแล้ว' : (order.status === 'Payment Pending' ? 'รอตรวจสอบสลิป' : 'รอการชำระเงิน'));
                const trackingDisplay = order.trackingNumber ? 
                    `<p><strong>Tracking:</strong> <a href="https://th.kerryexpress.com/th/track/?track=${order.trackingNumber}" target="_blank" style="color: #007bff;">${order.trackingNumber}</a></p>` : '';


                let itemsHtml = order.items.map(item => 
                    `<p>${item.name} x ${item.quantity} (฿${(item.price * item.quantity).toFixed(2)})</p>`
                ).join('');
                
                
                let actionButtons = '';
                
                // 1. ปุ่มยืนยันชำระเงิน (แสดงเมื่อไม่ใช่ Paid/Shipped)
                if (order.status !== 'Paid' && order.status !== 'Shipped') {
                    actionButtons += `<button class="confirm-paid-btn" data-order-id="${order.orderId}">
                                        <i class="fas fa-check-circle"></i> ยืนยันการชำระเงิน
                                    </button>`;
                } else if (order.status === 'Paid') {
                    // 2. ปุ่มป้อนเลขพัสดุ (แสดงเมื่อ Paid แต่ยังไม่ Shipped)
                    actionButtons += `<button class="open-tracking-btn confirm-paid-btn" style="background-color: #007bff;" data-order-id="${order.orderId}">
                                        <i class="fas fa-truck"></i> ป้อนเลขพัสดุ
                                    </button>`;
                } else if (order.status === 'Shipped') {
                     actionButtons += `<button class="confirm-paid-btn" style="background-color: #1B5E20;" disabled>
                                        จัดส่งแล้ว
                                    </button>`;
                }

                const adminActionsHtml = `
                    <div class="admin-actions">
                        ${order.slipUrl ? 
                            `<button class="view-slip-btn" data-slip-url="${BACKEND_URL}/${order.slipUrl}">
                                <i class="fas fa-image"></i> ดูสลิป
                            </button>` : ''}
                        
                        ${actionButtons}
                    </div>
                `;
                
                const orderCardHtml = `
                    <div class="${cardClass}" data-order-id="${order.orderId}">
                        <div class="order-header order-header-admin">
                            <span>ออเดอร์: #${order.orderId} (User: ${order.userId})</span>
                            <span class="status ${statusClass}">${statusText}</span>
                        </div>
                        <div class="order-details">
                            <p><strong>วันที่สั่ง:</strong> ${orderDate}</p>
                            <p><strong>ที่อยู่จัดส่ง:</strong> ${order.address}</p>
                            ${trackingDisplay}
                            <hr>
                            <h4>รายการสินค้า:</h4>
                            <div class="order-item-list">${itemsHtml}</div>
                            <div class="order-total">ยอดสุทธิ: ฿${order.total}</div>
                            ${adminActionsHtml}
                        </div>
                    </div>
                `;
                ordersListContainer.innerHTML += orderCardHtml;
            });

            // 5. ผูก Event Listener หลังสร้าง HTML เสร็จ
            document.querySelectorAll('.confirm-paid-btn').forEach(button => {
                // ถ้าปุ่มเป็นสีน้ำเงิน (ป้อนเลขพัสดุ) ให้ใช้ handleOpenTracking
                if(button.classList.contains('open-tracking-btn')) {
                    button.addEventListener('click', handleOpenTracking);
                } else {
                    // ถ้าเป็นปุ่มยืนยันชำระเงิน (สีเขียวปกติ) ให้ใช้ handleConfirmPayment
                    button.addEventListener('click', handleConfirmPayment);
                }
            });
            document.querySelectorAll('.view-slip-btn').forEach(button => {
                button.addEventListener('click', handleViewSlip);
            });
        }
        
        // 6. ฟังก์ชันจัดการการกดยืนยันการชำระเงิน (Paid)
        async function handleConfirmPayment(event) {
            // ... (โค้ด handleConfirmPayment เหมือนเดิม) ...
            const button = event.currentTarget;
            const orderId = button.dataset.orderId;
            
            if (!confirm(`ยืนยันการชำระเงินสำหรับ Order ID: ${orderId} หรือไม่?`)) {
                return;
            }

            button.textContent = 'กำลังยืนยัน...';
            button.disabled = true;

            try {
                const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}/paid`, {
                    method: 'PUT'
                });

                if (response.ok) {
                    alert(`ยืนยันการชำระเงิน Order ${orderId} สำเร็จ!`);
                    fetchOrdersList(); 
                } else {
                    alert('เกิดข้อผิดพลาดในการยืนยัน');
                    button.textContent = 'ยืนยันการชำระเงิน';
                    button.disabled = false;
                }
            } catch (error) {
                alert('ไม่สามารถติดต่อ Server ได้');
                button.textContent = 'ยืนยันการชำระเงิน';
                button.disabled = false;
            }
        }
        
        // 7. ฟังก์ชันเปิด Modal ป้อนเลข Tracking
        function handleOpenTracking(event) {
            const orderId = event.currentTarget.dataset.orderId;
            trackingOrderIdInput.value = orderId; // กำหนด Order ID ให้กับ Modal Form
            if (displayTrackingOrderId) {
            displayTrackingOrderId.textContent = orderId; 
        }
            trackingModal.classList.add('active');
        }
        
        // 8. Logic การส่งเลข Tracking ไป Server
        if(trackingForm) trackingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const orderId = trackingOrderIdInput.value;
            const trackingNum = document.getElementById('tracking-input').value.trim();
            const submitBtn = trackingForm.querySelector('button[type="submit"]');

            if (trackingNum.length < 5) {
                alert('กรุณาใส่เลขพัสดุให้ถูกต้อง');
                return;
            }
            
            submitBtn.textContent = 'กำลังส่ง...';
            submitBtn.disabled = true;

            try {
                // API ใหม่: PUT /api/orders/:orderId/ship
                const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}/ship`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trackingNumber: trackingNum })
                });

                if (response.ok) {
                    alert(`ป้อนเลขพัสดุ Order ${orderId} สำเร็จ!`);
                    trackingModal.classList.remove('active');
                    document.getElementById('tracking-input').value = ''; // Clear input
                    fetchOrdersList(); // โหลดรายการใหม่
                } else {
                    alert('เกิดข้อผิดพลาดในการบันทึกเลขพัสดุ');
                }
            } catch (error) {
                alert('ไม่สามารถติดต่อ Server ได้');
            } finally {
                 submitBtn.textContent = 'บันทึกเลขพัสดุ';
                 submitBtn.disabled = false;
            }
        });
        
        // 9. ฟังก์ชันจัดการการเปิดดูสลิป
        function handleViewSlip(event) {
            const slipUrl = event.currentTarget.dataset.slipUrl;
            slipImage.src = slipUrl;
            slipModal.classList.add('active');
        }
        
        // 10. การปิด Modal ดูสลิป
        if (slipCloseBtn) {
            slipCloseBtn.addEventListener('click', () => {
                slipModal.classList.remove('active');
            });
            window.addEventListener('click', (event) => {
                if (event.target === slipModal) {
                    slipModal.classList.remove('active');
                }
            });
        }
    }
    
    // =======================================================
    // 7. 9. Logic สำหรับหน้าอัปโหลดสลิป (upload.html)
    // =======================================================
    function initUploadPage() {
        // ... (โค้ด initUploadPage เหมือนเดิม)
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        const orderIdDisplay = document.getElementById('order-id-display');
        const uploadForm = document.getElementById('slip-upload-form');
        const uploadStatus = document.getElementById('upload-status');

        if (!orderId) {
            orderIdDisplay.textContent = 'ไม่พบ Order ID';
            uploadStatus.innerHTML = '<p style="color: red;">ไม่สามารถดำเนินการต่อได้</p>';
            return;
        }
        
        orderIdDisplay.textContent = orderId;

        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const slipInput = document.getElementById('slip-input');
            const file = slipInput.files[0];

            if (!file) {
                alert('กรุณาเลือกไฟล์สลิปเพื่ออัปโหลด');
                return;
            }

            uploadStatus.innerHTML = '<p style="color: #007bff;"><i class="fas fa-spinner fa-spin"></i> กำลังอัปโหลด...</p>';
            
            const formData = new FormData();
            formData.append('orderId', orderId); 
            formData.append('slipImage', file); 

            try {
                const response = await fetch(`${BACKEND_URL}/api/upload-slip`, {
                    method: 'POST',
                    body: formData 
                });

                const result = await response.json();
                
                if (response.ok) {
                    uploadStatus.innerHTML = '<p style="color: #2E7D32;"><i class="fas fa-check-circle"></i> อัปโหลดสลิปสำเร็จ! ระบบกำลังดำเนินการตรวจสอบ</p>';
                    alert('อัปโหลดสำเร็จ! ระบบจะพาคุณกลับไปหน้าติดตามออเดอร์');
                    
                    checkoutModal.classList.remove('active');
                    window.location.href = `orders.html?orderId=${orderId}`; 

                } else {
                    uploadStatus.innerHTML = `<p style="color: #e74c3c;">Error: ${result.message}</p>`;
                    console.error('Upload Error:', result);
                }

            } catch (error) {
                uploadStatus.innerHTML = '<p style="color: #e74c3c;">ไม่สามารถติดต่อ Server ได้ (Upload)</p>';
                console.error('Network or Server connection error:', error);
            }
        });
    }

}); // สิ้นสุด document.addEventListener