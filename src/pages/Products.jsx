import React, { useState, useEffect, useRef } from 'react';
import { Table, Spinner, Badge, Button, Form, Modal, Card, Row, Col, Image, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import api from '../services/api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [imageInput, setImageInput] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock_quantity: '',
        description: '',
        category_id: '',
        brand: '',
        sku: '',
        image_urls: [],
        discount_price: '',
        is_active: 1
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/admin/categories');
            const data = response.data;
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProducts = async () => {
        console.log('Fetching products...');
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            
            if (!token) {
                console.error('No token found');
                toast.error('Please login again');
                setLoading(false);
                return;
            }

            const response = await api.get('/admin/products');
            const data = response.data;
            
            if (Array.isArray(data)) {
                setProducts(data);
                console.log('✅ Fetched products:', data.map(p => ({ 
                    id: p.id, 
                    name: p.name, 
                    image_urls: p.image_urls,
                    hasImages: p.image_urls && p.image_urls.length > 0
                })));
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products: ' + (error.response?.data?.message || error.message));
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/admin/products/${id}`);
                toast.success('Product deleted successfully');
                fetchProducts();
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(error.response?.data?.message || 'Failed to delete product');
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploading(true);
        
        try {
            const token = localStorage.getItem('admin_token');
            const formDataImg = new FormData();
            formDataImg.append('image', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataImg
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📸 Upload response:', data);
                
                // Use the URL as is (it should be relative)
                let imageUrl = data.imageUrl;
                
                console.log('✅ Processed image URL:', imageUrl);
                
                const currentImages = Array.isArray(formData.image_urls) ? formData.image_urls : [];
                const newImages = [...currentImages, imageUrl];
                
                setFormData(prev => ({
                    ...prev,
                    image_urls: newImages
                }));
                
                toast.success('Image uploaded successfully');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleAddImageUrlManually = () => {
        if (imageInput && imageInput.trim()) {
            let imageUrl = imageInput.trim();
            
            const currentImages = Array.isArray(formData.image_urls) ? formData.image_urls : [];
            setFormData(prev => ({
                ...prev,
                image_urls: [...currentImages, imageUrl]
            }));
            setImageInput('');
            toast.success('Image URL added');
        } else {
            toast.error('Please enter a valid URL');
        }
    };

    const handleRemoveImage = (index) => {
        const currentImages = Array.isArray(formData.image_urls) ? [...formData.image_urls] : [];
        currentImages.splice(index, 1);
        setFormData(prev => ({ ...prev, image_urls: currentImages }));
        toast.success('Image removed');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const url = editingProduct 
                ? `/admin/products/${editingProduct.id}`
                : '/admin/products';
            const method = editingProduct ? 'put' : 'post';

            // Prepare the data to send
            const submitData = {
                name: formData.name,
                price: parseFloat(formData.price),
                stock_quantity: parseInt(formData.stock_quantity),
                description: formData.description,
                category_id: formData.category_id ? parseInt(formData.category_id) : null,
                brand: formData.brand,
                sku: formData.sku,
                image_urls: Array.isArray(formData.image_urls) ? formData.image_urls : [],
                discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
                is_active: formData.is_active
            };

            console.log('📤 Submitting product data:', submitData);
            console.log('🖼️ Image URLs being sent:', submitData.image_urls);

            const response = await api[method](url, submitData);

            console.log('✅ Server response:', response.data);
            
            toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
            setShowModal(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error('❌ Submit error:', error);
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (product) => {
        console.log('✏️ Editing product:', product.id, 'with images:', product.image_urls);
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            price: product.price || '',
            stock_quantity: product.stock_quantity || '',
            description: product.description || '',
            category_id: product.category_id || '',
            brand: product.brand || '',
            sku: product.sku || '',
            image_urls: product.image_urls || [],
            discount_price: product.discount_price || '',
            is_active: product.is_active !== undefined ? product.is_active : 1
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            stock_quantity: '',
            description: '',
            category_id: '',
            brand: '',
            sku: '',
            image_urls: [],
            discount_price: '',
            is_active: 1
        });
        setEditingProduct(null);
        setImageInput('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading products...</p>
            </div>
        );
    }

    const getFirstImage = (imageUrls) => {
        if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
            return imageUrls[0];
        }
        return null;
    };

    const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect x="2" y="2" width="20" height="20" rx="2"%3E%3C/rect%3E%3Cpath d="M8 2v20M16 2v20M2 8h20M2 16h20"%3E%3C/path%3E%3C/svg%3E';

    // Calculate stats
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock_quantity < 10 && p.stock_quantity > 0).length;
    const outOfStock = products.filter(p => p.stock_quantity === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);

    return (
        <>
            

            {/* Products Table */}
            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0">Image</th>
                                    <th className="border-0">Product Name</th>
                                    <th className="border-0">Price</th>
                                    <th className="border-0">Stock</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <div className="text-muted">
                                                <span style={{ fontSize: '48px' }}>📦</span>
                                                <p className="mt-2">No products found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id}>
                                            <td className="align-middle">
                                                {getFirstImage(product.image_urls) ? (
                                                    <Image 
                                                        src={getFirstImage(product.image_urls)} 
                                                        alt={product.name}
                                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                        rounded
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = placeholderImage;
                                                        }}
                                                    />
                                                ) : (
                                                    <div 
                                                        className="d-flex align-items-center justify-content-center bg-light rounded"
                                                        style={{ width: '50px', height: '50px' }}
                                                    >
                                                        <span>📦</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="align-middle">
                                                <div>
                                                    <strong>{product.name}</strong>
                                                    {product.brand && (
                                                        <div className="small text-muted">Brand: {product.brand}</div>
                                                    )}
                                                    {product.description && (
                                                        <div className="small text-muted">
                                                            {product.description.substring(0, 50)}...
                                                        </div>
                                                    )}
                                                    {product.image_urls && product.image_urls.length > 0 && (
                                                        <div className="small text-success mt-1">
                                                            ✅ {product.image_urls.length} image(s)
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="align-middle">
                                                <strong>${parseFloat(product.price).toFixed(2)}</strong>
                                                {product.discount_price && (
                                                    <div className="small text-danger">
                                                        Sale: ${parseFloat(product.discount_price).toFixed(2)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="align-middle">
                                                <Badge 
                                                    bg={product.stock_quantity > 10 ? 'success' : product.stock_quantity > 0 ? 'warning' : 'danger'}
                                                    className="px-3 py-2"
                                                >
                                                    {product.stock_quantity} units
                                                </Badge>
                                            </td>
                                            <td className="align-middle">
                                                <Badge 
                                                    bg={product.is_active ? 'success' : 'secondary'}
                                                >
                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="align-middle text-center">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm" 
                                                    className="me-2"
                                                    onClick={() => handleEdit(product)}
                                                >
                                                    ✏️ Edit
                                                </Button>
                                                {/*
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleDelete(product.id)}
                                                >
                                                    🗑️ Delete
                                                </Button>
                                                   */}
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
                <span style={{ fontSize: '24px' }}>+</span>
            </Button>

            {/* Product Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>
                        {editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Product Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        required
                                        placeholder="Enter product name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Price ($) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Discount Price ($)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.discount_price}
                                        onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Stock Quantity *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        required
                                        placeholder="0"
                                        value={formData.stock_quantity}
                                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category</Form.Label>
                                    <Form.Select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Brand</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Brand name"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>SKU</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Product SKU"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Product description..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Product Images</Form.Label>
                                    
                                    {/* Show current image count */}
                                    <Alert variant="secondary" className="mb-2">
                                        <strong>Images Added:</strong> {Array.isArray(formData.image_urls) ? formData.image_urls.length : 0} image(s)
                                    </Alert>
                                    
                                    {/* Upload from device */}
                                    <div className="mb-3">
                                        <Alert variant="info" className="mb-2">
                                            <strong>Upload from device:</strong> Select an image file (JPG, PNG, GIF - max 5MB)
                                        </Alert>
                                        <div className="d-flex gap-2">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                style={{ display: 'none' }}
                                                id="image-upload-input"
                                            />
                                            <Button 
                                                variant="outline-primary" 
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="d-flex align-items-center gap-2"
                                            >
                                                {uploading ? (
                                                    <>
                                                        <Spinner animation="border" size="sm" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>📁 Upload Image</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Add image URL */}
                                    <div className="mb-3">
                                        <Alert variant="info" className="mb-2">
                                            <strong>Add from URL:</strong> Enter image URL
                                        </Alert>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter image URL (https://... or /uploads/...)"
                                                value={imageInput}
                                                onChange={(e) => setImageInput(e.target.value)}
                                            />
                                            <Button variant="outline-primary" onClick={handleAddImageUrlManually}>
                                                Add URL
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Display images */}
                                    {Array.isArray(formData.image_urls) && formData.image_urls.length > 0 && (
                                        <div className="mt-3">
                                            <Form.Label>Image Gallery ({formData.image_urls.length} images)</Form.Label>
                                            <div className="d-flex flex-wrap gap-2">
                                                {formData.image_urls.map((url, index) => (
                                                    <div key={index} className="position-relative">
                                                        <Image 
                                                            src={url} 
                                                            alt={`Product ${index + 1}`}
                                                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                            rounded
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = placeholderImage.replace('50', '100');
                                                            }}
                                                        />
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            className="position-absolute top-0 end-0"
                                                            style={{ transform: 'translate(50%, -50%)' }}
                                                            onClick={() => handleRemoveImage(index)}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="switch"
                                        label="Product Active"
                                        checked={formData.is_active === 1}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingProduct ? 'Update Product' : 'Create Product'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default Products;
