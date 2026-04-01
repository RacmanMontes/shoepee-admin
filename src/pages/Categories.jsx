import React, { useState, useEffect } from 'react';
import { Table, Spinner, Badge, Button, Form, Modal, Card, Row, Col } from 'react-bootstrap';
import toast from 'react-hot-toast';

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

            const response = await fetch('http://localhost:5000/api/admin/categories', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 404) {
                toast.error('Backend server not found');
                setCategories([]);
                setLoading(false);
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
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
            toast.error('Failed to load categories');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            const url = editingCategory 
                ? `http://localhost:5000/api/admin/categories/${editingCategory.id}`
                : 'http://localhost:5000/api/admin/categories';
            const method = editingCategory ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: categoryName,
                    description: categoryDescription
                })
            });

            if (response.ok) {
                toast.success(editingCategory ? 'Category updated' : 'Category created');
                setShowModal(false);
                setEditingCategory(null);
                setCategoryName('');
                setCategoryDescription('');
                fetchCategories();
            } else {
                toast.error('Operation failed');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                const token = localStorage.getItem('admin_token');
                const response = await fetch(`http://localhost:5000/api/admin/categories/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    toast.success('Category deleted');
                    fetchCategories();
                } else {
                    toast.error('Failed to delete category');
                }
            } catch (error) {
                console.error('Delete error:', error);
                toast.error('Failed to delete category');
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