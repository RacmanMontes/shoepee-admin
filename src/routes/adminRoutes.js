const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { protect, admin } = require('../middleware/authMiddleware');

// Apply admin middleware to all routes
router.use(protect, admin);

// Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const [totalProducts] = await pool.execute('SELECT COUNT(*) as count FROM products');
        const [totalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
        const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const [totalRevenue] = await pool.execute('SELECT SUM(total_amount) as total FROM orders WHERE payment_status = "paid"');
        
        res.json({
            products: totalProducts[0].count,
            orders: totalOrders[0].count,
            users: totalUsers[0].count,
            revenue: totalRevenue[0].total || 0,
            growth: {
                products: 12,
                orders: 8,
                users: 15,
                revenue: 23
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Recent Orders
router.get('/orders/recent', async (req, res) => {
    try {
        const [orders] = await pool.execute(
            `SELECT o.*, u.first_name, u.last_name, u.email 
             FROM orders o 
             JOIN users u ON o.user_id = u.id 
             ORDER BY o.created_at DESC 
             LIMIT 5`
        );
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Sales Data for Charts
router.get('/sales/last-7-days', async (req, res) => {
    try {
        const [data] = await pool.execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders,
                SUM(total_amount) as sales
            FROM orders 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        
        // Fill in missing dates
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const found = data.find(d => d.date.toISOString().split('T')[0] === dateStr);
            result.push({
                date: dateStr,
                orders: found ? found.orders : 0,
                sales: found ? parseFloat(found.sales) : 0
            });
        }
        
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Products Management
router.get('/products', async (req, res) => {
    try {
        const [products] = await pool.execute(
            `SELECT p.*, c.name as category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             ORDER BY p.created_at DESC`
        );
        
        // Parse image_urls
        products.forEach(p => {
            if (p.image_urls) {
                try {
                    p.image_urls = JSON.parse(p.image_urls);
                } catch(e) {
                    p.image_urls = [];
                }
            }
        });
        
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/products', async (req, res) => {
    try {
        const { name, description, price, discount_price, stock_quantity, category_id, brand, sku, is_active } = req.body;
        
        const [result] = await pool.execute(
            `INSERT INTO products 
             (name, description, price, discount_price, stock_quantity, category_id, brand, sku, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, description, price, discount_price || null, stock_quantity, category_id || null, brand, sku, is_active !== false]
        );
        
        res.status(201).json({ id: result.insertId, message: 'Product created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/products/:id', async (req, res) => {
    try {
        const { name, description, price, discount_price, stock_quantity, category_id, brand, sku, is_active } = req.body;
        
        await pool.execute(
            `UPDATE products 
             SET name=?, description=?, price=?, discount_price=?, stock_quantity=?, 
                 category_id=?, brand=?, sku=?, is_active=?
             WHERE id=?`,
            [name, description, price, discount_price || null, stock_quantity, category_id || null, brand, sku, is_active !== false, req.params.id]
        );
        
        res.json({ message: 'Product updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Orders Management
router.get('/orders', async (req, res) => {
    try {
        const [orders] = await pool.execute(
            `SELECT o.*, u.first_name, u.last_name, u.email 
             FROM orders o 
             JOIN users u ON o.user_id = u.id 
             ORDER BY o.created_at DESC`
        );
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/orders/:id', async (req, res) => {
    try {
        const { order_status, payment_status } = req.body;
        await pool.execute(
            'UPDATE orders SET order_status = ?, payment_status = ? WHERE id = ?',
            [order_status, payment_status || 'pending', req.params.id]
        );
        res.json({ message: 'Order updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/orders/:id/items', async (req, res) => {
    try {
        const [items] = await pool.execute(
            'SELECT * FROM order_items WHERE order_id = ?',
            [req.params.id]
        );
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Users Management
router.get('/users', async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, email, first_name, last_name, phone, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const { role } = req.body;
        await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ message: 'User updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Categories Management
router.get('/categories', async (req, res) => {
    try {
        const [categories] = await pool.execute(
            `SELECT c.*, COUNT(p.id) as product_count 
             FROM categories c 
             LEFT JOIN products p ON c.id = p.category_id 
             GROUP BY c.id 
             ORDER BY c.created_at DESC`
        );
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const { name, description, parent_id } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)',
            [name, description, parent_id || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Category created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;