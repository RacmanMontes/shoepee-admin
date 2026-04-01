import React, { useState, useEffect } from 'react';
import { Table, Spinner, Badge, Button, Form, Modal, Card, Row, Col } from 'react-bootstrap';
import toast from 'react-hot-toast';
import api from '../services/api';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        console.log('Fetching categories...');
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            
            if (!token) {
                console.error('No token found');
                toast.error('Please login again');
                setLoading(false);
                return;
            }

            const response = await api.get('/admin/categories');
            const data = response.data;
            
            // Handle if data is array or object
            if (Array.isArray(data)) {
                setCategories(data);
            } else if (data && data.categories && Array.isArray(data.categories)) {
                setCategories(data.categories);
            } else if (data && data.data && Array.isArray(data.data)) {
                setCategories(data.data);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            if (error.response?.status === 404) {
                toast.error('Backend server not found');
            } else {
                toast.error('Failed to load categories');
            }
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingCategory 
                ? `/admin/categories/${editingCategory.id}`
                : '/admin/categories';
            const method = editingCategory ? 'put' : 'post';

            const response = await api[method](url, {
                name: categoryName,
                description: categoryDescription
            });

            toast.success(editingCategory ? 'Category updated' : 'Category created');
            setShowModal(false);
            setEditingCategory(null);
            setCategoryName('');
            setCategoryDescription('');
            fetchCategories();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await api.delete(`/admin/categories/${id}`);
                toast.success('Category deleted');
                fetchCategories();
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(error.response?.data?.message || 'Failed to delete category');
            }
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setCategoryName(category.name);
        setCategoryDescription(category.description || '');
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        setCategoryName('');
        setCategoryDescription('');
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading categories...</p>
            </div>
        );
    }

    const totalCategories = Array.isArray(categories) ? categories.length : 0;

    return (
        <>
            {/* Stats Cards */}
            <Row className="g-4 mb-4">
                <Col md={6} lg={3}>
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Total Categories</h6>
                                    <h3 className="mb-0">{totalCategories}</h3>
                                </div>
                                <div 
                                    className="p-3 rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', width: '60px', height: '60px' }}
                                >
                                    <span style={{ fontSize: '24px' }}>📁</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Categories Table */}
            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0">ID</th>
                                    <th className="border-0">Category Name</th>
                                    <th className="border-0">Description</th>
                                    <th className="border-0">Products Count</th>
                                    <th className="border-0 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!Array.isArray(categories) || categories.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5">
                                            <div className="text-muted">
                                                <span style={{ fontSize: '48px' }}>📁</span>
                                                <p className="mt-2">No categories found</p>
                                                <Button 
                                                    variant="primary" 
                                                    size="sm" 
                                                    onClick={openCreateModal}
                                                >
                                                    Add your first category
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((category) => (
                                        <tr key={category.id} className="align-middle">
                                            <td>#{category.id}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div 
                                                        className="rounded-circle me-3 d-flex align-items-center justify-content-center text-white"
                                                        style={{ 
                                                            width: '40px', 
                                                            height: '40px', 
                                                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
                                                        }}
                                                    >
                                                        {category.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <strong>{category.name}</strong>
                                                </div>
                                            </td>
                                            <td className="text-muted">
                                                {category.description || 'No description'}
                                            </td>
                                            <td>
                                                <Badge bg="info" className="px-3 py-2">
                                                    {category.products_count || 0} products
                                                </Badge>
                                            </td>
                                            <td className="text-center">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm" 
                                                    className="me-2"
                                                    onClick={() => handleEdit(category)}
                                                >
                                                    ✏️ Edit
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleDelete(category.id)}
                                                >
                                                    🗑️ Delete
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
                onClick={openCreateModal}
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
                <span style={{ fontSize: '24px' }}>+</span>
            </Button>

            {/* Category Modal */}
            <Modal show={showModal} onHide={() => {
                setShowModal(false);
                setEditingCategory(null);
                setCategoryName('');
                setCategoryDescription('');
            }} centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>
                        {editingCategory ? '✏️ Edit Category' : '➕ Add New Category'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Category Name *</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                placeholder="Enter category name"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Category description"
                                value={categoryDescription}
                                onChange={(e) => setCategoryDescription(e.target.value)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => {
                            setShowModal(false);
                            setEditingCategory(null);
                            setCategoryName('');
                            setCategoryDescription('');
                        }}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingCategory ? 'Update Category' : 'Create Category'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default Categories;