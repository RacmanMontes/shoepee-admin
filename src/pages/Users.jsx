import React, { useState, useEffect } from 'react';
import { Table, Spinner, Badge, Card, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { FiPlus, FiUserPlus, FiEdit2, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import api from '../services/api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'user'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        console.log('Fetching users...');
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            
            if (!token) {
                console.error('No token found');
                toast.error('Please login again');
                setLoading(false);
                return;
            }

            const response = await api.get('/admin/users');
            const data = response.data;
            
            let usersArray = [];
            if (Array.isArray(data)) {
                usersArray = data;
            } else if (data && data.users && Array.isArray(data.users)) {
                usersArray = data.users;
            } else if (data && data.data && Array.isArray(data.data)) {
                usersArray = data.data;
            } else {
                usersArray = [];
            }
            
            setUsers(usersArray);
        } catch (error) {
            console.error('Error fetching users:', error);
            if (error.response?.status === 404) {
                toast.error('Backend server not found');
            } else {
                toast.error('Failed to load users: ' + (error.response?.data?.message || error.message));
            }
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            toast.success('User created successfully');
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            toast.error(error.response?.data?.message || 'Failed to create user');
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${editingUser.id}/role`, {
                role: formData.role
            });
            toast.success('User role updated successfully');
            setShowEditModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error(error.response?.data?.message || 'Failed to update user');
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            try {
                await api.delete(`/admin/users/${userId}`);
                toast.success('User deleted successfully');
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error(error.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            password: '',
            role: user.role
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            role: 'user'
        });
        setEditingUser(null);
    };

    const getRoleBadge = (role) => {
        switch(role?.toLowerCase()) {
            case 'admin':
                return <Badge bg="danger" className="px-3 py-2">👑 Admin</Badge>;
            case 'manager':
                return <Badge bg="warning" className="px-3 py-2" style={{ color: '#000' }}>⭐ Manager</Badge>;
            default:
                return <Badge bg="secondary" className="px-3 py-2">👤 User</Badge>;
        }
    };

    // Calculate stats safely
    const totalUsers = Array.isArray(users) ? users.length : 0;
    const activeUsers = Array.isArray(users) ? users.filter(u => u.status !== 'inactive' && u.status !== 'blocked').length : 0;
    const adminUsers = Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0;
    const newThisMonth = Array.isArray(users) ? users.filter(u => {
        if (!u.created_at) return false;
        const date = new Date(u.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length : 0;

    const statCards = [
        { title: 'Total Users', value: totalUsers, icon: '👥', color: 'primary' },
        { title: 'Active Users', value: activeUsers, icon: '✅', color: 'success' },
        { title: 'Admin Users', value: adminUsers, icon: '👑', color: 'danger' },
        { title: 'New This Month', value: newThisMonth, icon: '📅', color: 'info' },
    ];

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading users...</p>
            </div>
        );
    }

    return (
        <>
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

            {/* Users Table */}
            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead style={{ backgroundColor: '#f9fafb' }}>
                                <tr>
                                    <th className="border-0 py-3">User</th>
                                    <th className="border-0 py-3">Email</th>
                                    <th className="border-0 py-3">Role</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3">Joined</th>
                                    <th className="border-0 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!Array.isArray(users) || users.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <div className="text-muted">
                                                <span style={{ fontSize: '48px' }}>👥</span>
                                                <p className="mt-2 mb-0">No users found</p>
                                                <small>Click the + button to add a new user</small>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="align-middle">
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div 
                                                        className="rounded-circle me-3 d-flex align-items-center justify-content-center text-white fw-bold"
                                                        style={{ 
                                                            width: '40px', 
                                                            height: '40px', 
                                                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
                                                        }}
                                                    >
                                                        {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold">{user.first_name} {user.last_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <span className="me-2">📧</span>
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td>{getRoleBadge(user.role)}</td>
                                            <td>
                                                <Badge bg="success" className="px-3 py-2">
                                                    ✅ Active
                                                </Badge>
                                            </td>
                                            <td className="text-muted">
                                                <div className="d-flex align-items-center">
                                                    <span className="me-2">📅</span>
                                                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    }) : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm" 
                                                    className="me-2"
                                                    onClick={() => openEditModal(user)}
                                                >
                                                    <FiEdit2 size={16} /> Edit
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                                                >
                                                    <FiTrash2 size={16} /> Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Floating Action Button */}
            <Button
                variant="primary"
                onClick={() => setShowModal(true)}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000
                }}
                className="shadow-lg"
            >
                <FiPlus size={28} />
            </Button>

            {/* Create User Modal */}
            <Modal show={showModal} onHide={() => {
                setShowModal(false);
                resetForm();
            }} centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>
                        <FiUserPlus className="me-2" /> Add New User
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateUser}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>First Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        required
                                        placeholder="Enter first name"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Last Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        required
                                        placeholder="Enter last name"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Email Address *</Form.Label>
                            <Form.Control
                                type="email"
                                required
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password *</Form.Label>
                            <Form.Control
                                type="password"
                                required
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <Form.Text className="text-muted">
                                Password should be at least 6 characters
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="user">👤 User</option>
                                <option value="manager">⭐ Manager</option>
                                <option value="admin">👑 Admin</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => {
                            setShowModal(false);
                            resetForm();
                        }}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Create User
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit User Modal */}
            <Modal show={showEditModal} onHide={() => {
                setShowEditModal(false);
                resetForm();
            }} centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>
                        <FiEdit2 className="me-2" /> Edit User Role
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditUser}>
                    <Modal.Body>
                        <div className="mb-3">
                            <div className="p-3 bg-light rounded">
                                <div className="mb-2">
                                    <strong>Name:</strong> {editingUser?.first_name} {editingUser?.last_name}
                                </div>
                                <div>
                                    <strong>Email:</strong> {editingUser?.email}
                                </div>
                            </div>
                        </div>
                        <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="user">👤 User</option>
                                <option value="manager">⭐ Manager</option>
                                <option value="admin">👑 Admin</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => {
                            setShowEditModal(false);
                            resetForm();
                        }}>
                            <FiX size={16} /> Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            <FiSave size={16} /> Update Role
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default Users;