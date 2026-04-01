import React, { useState, useEffect } from 'react';
import { Table, Spinner, Badge, Card, Row, Col } from 'react-bootstrap';
import toast from 'react-hot-toast';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        revenue: 0
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        console.log('Fetching orders...');
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            console.log('Token exists?', !!token);
            
            if (!token) {
                console.error('No token found');
                toast.error('Please login again');
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:5000/api/admin/orders', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (response.status === 404) {
                console.error('API endpoint not found');
                toast.error('Backend server not found. Please start the backend server.');
                setOrders([]);
                setLoading(false);
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Orders data:', data);
            
            // Handle if data is an array or object
            let ordersArray = [];
            if (Array.isArray(data)) {
                ordersArray = data;
            } else if (data && data.orders && Array.isArray(data.orders)) {
                ordersArray = data.orders;
            } else if (data && data.data && Array.isArray(data.data)) {
                ordersArray = data.data;
            } else {
                ordersArray = [];
            }
            
            setOrders(ordersArray);
            
            // Calculate stats
            const totalRevenue = ordersArray.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
            const pendingOrders = ordersArray.filter(order => 
                order.order_status === 'pending' || order.order_status === 'processing'
            ).length;
            const completedOrders = ordersArray.filter(order => 
                order.order_status === 'completed' || order.order_status === 'delivered'
            ).length;
            
            setStats({
                total: ordersArray.length,
                pending: pendingOrders,
                completed: completedOrders,
                revenue: totalRevenue
            });
            
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders: ' + error.message);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status?.toLowerCase()) {
            case 'pending':
                return <Badge bg="warning" className="px-3 py-2">⏳ Pending</Badge>;
            case 'processing':
                return <Badge bg="info" className="px-3 py-2">🔄 Processing</Badge>;
            case 'shipped':
                return <Badge bg="primary" className="px-3 py-2">📦 Shipped</Badge>;
            case 'delivered':
            case 'completed':
                return <Badge bg="success" className="px-3 py-2">✅ Delivered</Badge>;
            case 'cancelled':
                return <Badge bg="danger" className="px-3 py-2">❌ Cancelled</Badge>;
            default:
                return <Badge bg="secondary" className="px-3 py-2">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading orders...</p>
            </div>
        );
    }

    return (
        <>
            

            

            {/* Orders Table */}
            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0">Order #</th>
                                    <th className="border-0">Customer</th>
                                    <th className="border-0">Email</th>
                                    <th className="border-0">Amount</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!Array.isArray(orders) || orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <div className="text-muted">
                                                <span style={{ fontSize: '48px' }}>📦</span>
                                                <p className="mt-2">No orders found</p>
                                                <p className="small">Backend server might not be running or no orders exist</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id} className="align-middle">
                                            <td>
                                                <strong>#{order.order_number || order.id}</strong>
                                            </td>
                                            <td>
                                                <div>
                                                    <strong>{order.first_name} {order.last_name}</strong>
                                                </div>
                                            </td>
                                            <td>{order.email}</td>
                                            <td>
                                                <strong className="text-success">
                                                    ${parseFloat(order.total_amount || 0).toFixed(2)}
                                                </strong>
                                            </td>
                                            <td>{getStatusBadge(order.order_status)}</td>
                                            <td className="text-muted">
                                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </>
    );
};

export default Orders;