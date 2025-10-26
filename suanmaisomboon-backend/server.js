// server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');        // สำหรับจัดการไฟล์
const path = require('path');           // สำหรับจัดการ Path ของไฟล์

// 1. ตั้งค่า Express App
const app = express();
const PORT = 3000; 

// =======================================================
// 2. Middleware และการเชื่อมต่อ MongoDB
// =======================================================

// *** URL การเชื่อมต่อ MongoDB (ใช้ค่าที่ถูกต้องของคุณ) ***
const dbUri = 'mongodb+srv://worachet3899_db_user:rWLa2xoewCzQOY2H@cluster0.erm6o0f.mongodb.net/SuanMaiDB?retryWrites=true&w=majority&appName=Cluster0'; 

mongoose.connect(dbUri)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));


// =======================================================
// 3. โครงสร้างข้อมูล (Schema) และ Model
// =======================================================

const OrderItemSchema = new mongoose.Schema({
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
});

const OrderSchema = new mongoose.Schema({
    address: { type: String, required: true },
    total: { type: Number, required: true },
    items: [OrderItemSchema], 
    userId: { type: String, required: true }, // ผูกกับผู้ใช้ที่ Login
    orderId: { type: String, required: true, unique: true },
    status: { type: String, default: 'Pending' }, 
    orderDate: { type: Date, default: Date.now },
    slipUrl: { type: String, default: null }, // บันทึก Path ของสลิป
    trackingNumber: { type: String, default: null },
});

const Order = mongoose.model('Order', OrderSchema); // ประกาศ Model ให้อยู่ใน Global Scope


// =======================================================
// 4. Middleware สำหรับ Request (ต้องอยู่หลัง Model)
// =======================================================
app.use(bodyParser.json()); 
app.use(cors());

// *** [สำคัญมาก] อนุญาตให้ Frontend เข้าถึงไฟล์ในโฟลเดอร์ uploads ได้ ***
// Frontend จะเรียกรูปสลิปจาก http://localhost:3000/uploads/...
app.use('/uploads', express.static('uploads'));
// *************************************************************************


// =======================================================
// 5. การตั้งค่า Multer สำหรับจัดการไฟล์อัปโหลด
// =======================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // บันทึกไฟล์ลงในโฟลเดอร์ 'uploads/' (ต้องสร้างโฟลเดอร์นี้ไว้แล้ว)
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์: Order ID + วันที่ + นามสกุลเดิม
        const orderId = req.body.orderId || 'UNKNOWN';
        cb(null, orderId + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ไม่เกิน 5MB
});


// =======================================================
// 6. API Routes (การกำหนดเส้นทาง)
// =======================================================

// 6.1 [POST] /api/orders: รับคำสั่งซื้อใหม่
app.post('/api/orders', async (req, res) => {
    try {
        const { address, total, items, userId } = req.body; 
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required to place an order.' });
        }

        const orderId = 'SMBS' + Date.now(); 

        const newOrder = new Order({
            orderId: orderId,
            userId: userId, 
            address: address,
            total: total,
            items: items,
            status: 'Pending',
        });

        const savedOrder = await newOrder.save();

        res.status(201).json({ 
            message: 'Order placed successfully', 
            order: savedOrder,
            orderId: orderId 
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Failed to place order', error: error.message });
    }
});

// 6.2 [POST] /api/upload-slip: รับไฟล์สลิปและอัปเดตสถานะ (ใช้ multer)
app.post('/api/upload-slip', upload.single('slipImage'), async (req, res) => {
    try {
        const orderId = req.body.orderId;
        
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded or file type is invalid.' });
        }
        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is missing.' });
        }

        const relativePath = req.file.path; // Path ของไฟล์ที่ Multer สร้าง (เช่น uploads/...)
        
        // อัปเดต Order ในฐานข้อมูล
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderId, status: 'Pending' }, 
            { 
                slipUrl: relativePath, 
                status: 'Payment Pending' // เปลี่ยนสถานะเป็น 'รอตรวจสอบการชำระเงิน'
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found or already processed.' });
        }

        res.status(200).json({ 
            message: 'Slip uploaded and order status updated.', 
            order: updatedOrder
        });

    } catch (error) {
        console.error('Error processing slip upload:', error);
        res.status(500).json({ message: 'Failed to upload slip.', error: error.message });
    }
});

// 6.3 [GET] /api/orders/user/:userId: ดึงรายการสั่งซื้อทั้งหมดของ User นี้
app.get('/api/orders/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const orders = await Order.find({ userId: userId }).sort({ orderDate: -1 });

        res.status(200).json(orders);

    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
});

// 6.4 [GET] /api/admin/orders: ดึงรายการสั่งซื้อทั้งหมด (สำหรับ Admin)
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ orderDate: -1 });

        res.status(200).json(orders);

    } catch (error) {
        console.error('Error fetching all orders for admin:', error);
        res.status(500).json({ message: 'Failed to fetch all orders.', error: error.message });
    }
});

// 6.5 [PUT] /api/orders/:orderId/paid: อัปเดตสถานะเป็น "Paid" (สำหรับ Admin)
app.put('/api/orders/:orderId/paid', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderId },
            { status: 'Paid' },
            { new: true } 
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        
        res.status(200).json({ 
            message: `Order ${orderId} status updated to Paid.`,
            order: updatedOrder
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Failed to update order status.', error: error.message });
    }
});

// ในไฟล์ server.js (ส่วน 6. API Routes)

// 6.6 [PUT] /api/orders/:orderId/ship: อัปเดตเลข Tracking และเปลี่ยนสถานะเป็น 'Shipped'
app.put('/api/orders/:orderId/ship', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        // รับเลข Tracking Number จาก Admin Frontend
        const { trackingNumber } = req.body; 

        if (!trackingNumber) {
            return res.status(400).json({ message: 'Tracking number is required.' });
        }

        // ค้นหา Order ด้วย Order ID และอัปเดตเลข Tracking และสถานะ
        const updatedOrder = await Order.findOneAndUpdate(
            // ป้องกันการอัปเดตซ้ำ ถ้าสถานะเป็น Shipped แล้วจะไม่ทำอะไร
            { orderId: orderId, status: { $ne: 'Shipped' } }, 
            { 
                status: 'Shipped', // <--- สถานะเปลี่ยนเป็นจัดส่งแล้ว
                trackingNumber: trackingNumber 
            },
            { new: true } // คืนค่าเอกสารที่อัปเดตแล้ว
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found or already shipped.' });
        }
        
        res.status(200).json({ 
            message: `Order ${orderId} marked as Shipped.`,
            order: updatedOrder
        });

    } catch (error) {
        console.error('Error updating shipping status:', error);
        res.status(500).json({ message: 'Failed to update shipping status.', error: error.message });
    }
});

// =======================================================
// 7. เริ่มต้น Server
// =======================================================
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});