import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Badge } from 'react-bootstrap';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        totalUsers: 0,
        revenue: 0
    });
    const [chartData, setChartData] = useState({
        ordersData: [],
        revenueData: [],
        categoryData: [],
        productsData: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
        fetchChartData();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch('http://localhost:5000/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Stats data:', data);
            
            setStats({
                totalProducts: data.totalProducts || 0,
                totalOrders: data.totalOrders || 0,
                totalUsers: data.totalUsers || 0,
                revenue: data.revenue || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            setError(error.message);
        }
    };

    const fetchChartData = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            
            const [ordersRes, revenueRes, categoryRes, productsRes] = await Promise.all([
                fetch('http://localhost:5000/api/admin/stats/orders-over-time', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/admin/stats/revenue-over-time', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/admin/stats/products-by-category', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/admin/stats/top-products', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            
            const ordersData = ordersRes.ok ? await ordersRes.json() : { data: [] };
            const revenueData = revenueRes.ok ? await revenueRes.json() : { data: [] };
            const categoryData = categoryRes.ok ? await categoryRes.json() : { data: [] };
            const productsData = productsRes.ok ? await productsRes.json() : { data: [] };
            
            setChartData({
                ordersData: ordersData.data || [],
                revenueData: revenueData.data || [],
                categoryData: categoryData.data || [],
                productsData: productsData.data || []
            });
        } catch (error) {
            console.error('Error fetching chart data:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a'];

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading dashboard...</p>
            </div>
        );
    }

    const statCards = [
        { title: 'Total Products', value: stats.totalProducts, icon: '📦', color: 'primary' },
        { title: 'Total Orders', value: stats.totalOrders, icon: '🛒', color: 'success' },
        { title: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'info' },
        { title: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: '💰', color: 'warning' },
    ];

    return (
        <div>
            {/* Stats Cards */}
            <Row className="g-4 mb-4">
                {statCards.map((stat, idx) => (
                    <Col key={idx} md={6} lg={3}>
                        <Card className="shadow-sm border-0">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted mb-2">{stat.title}</h6>
                                        <h3 className="mb-0">{stat.value}</h3>
                                    </div>
                                    <div 
                                        className="p-3 rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ backgroundColor: `rgba(99, 102, 241, 0.1)`, width: '60px', height: '60px' }}
                                    >
                                        <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Daily Orders & Revenue Trend - Side by Side */}
            <Row className="mb-4">
                <Col lg={6} className="mb-4 mb-lg-0">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white border-0 pt-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0">📊 Daily Orders</h5>
                                    <small className="text-muted">Last 7 days</small>
                                </div>
                                <Badge bg="info" className="px-3 py-2">
                                    {chartData.ordersData.reduce((sum, item) => sum + (item.orders || 0), 0)} total orders
                                </Badge>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {chartData.ordersData.length === 0 ? (
                                <div className="text-center py-5">
                                    <p className="text-muted">No orders data available yet</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData.ordersData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line 
                                            type="monotone" 
                                            dataKey="orders" 
                                            stroke="#6366f1" 
                                            strokeWidth={2}
                                            dot={{ fill: '#6366f1', strokeWidth: 2 }}
                                            activeDot={{ r: 8 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white border-0 pt-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0">💰 Revenue Trend</h5>
                                    <small className="text-muted">Monthly revenue ($)</small>
                                </div>
                                <Badge bg="success" className="px-3 py-2">
                                    ${chartData.revenueData.reduce((sum, item) => sum + (item.revenue || 0), 0).toLocaleString()} total
                                </Badge>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {chartData.revenueData.length === 0 ? (
                                <div className="text-center py-5">
                                    <p className="text-muted">No revenue data available yet</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData.revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area 
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#10b981" 
                                            fill="#10b981" 
                                            fillOpacity={0.3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Products by Category - Bar Chart & Pie Chart */}
            <Row className="mb-4">
                <Col lg={6} className="mb-4 mb-lg-0">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white border-0 pt-4">
                            <h5 className="mb-0">📦 Products by Category</h5>
                            <small className="text-muted">Distribution across categories</small>
                        </Card.Header>
                        <Card.Body>
                            {chartData.categoryData.length === 0 ? (
                                <div className="text-center py-5">
                                    <p className="text-muted">No category data available</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData.categoryData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]}>
                                            {chartData.categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white border-0 pt-4">
                            <h5 className="mb-0">🥧 Category Distribution</h5>
                            <small className="text-muted">Percentage breakdown</small>
                        </Card.Header>
                        <Card.Body>
                            {chartData.categoryData.length === 0 ? (
                                <div className="text-center py-5">
                                    <p className="text-muted">No category data available</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={chartData.categoryData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => `${entry.name}: ${entry.value}`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {chartData.categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Top Selling Products - Bar Chart */}
            <Row className="mb-4">
                <Col lg={12}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-white border-0 pt-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0">🏆 Top Selling Products</h5>
                                    <small className="text-muted">Best performing products by sales count</small>
                                </div>
                                <Badge bg="warning" className="px-3 py-2">
                                    Top {chartData.productsData.length} Products
                                </Badge>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {chartData.productsData.length === 0 ? (
                                <div className="text-center py-5">
                                    <p className="text-muted">No product sales data available yet</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart 
                                        layout="vertical" 
                                        data={chartData.productsData}
                                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis type="category" dataKey="name" width={100} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="sales" fill="#f59e0b" radius={[0, 8, 8, 0]}>
                                            {chartData.productsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;