import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit2, FiTrash2, FiTag, FiSave, FiX } = FiIcons;

const Categories = () => {
  const { state, dispatch } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subcategories: ['']
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const categoryData = {
      ...formData,
      subcategories: formData.subcategories.filter(sub => sub.trim() !== '')
    };

    if (editingCategory) {
      dispatch({
        type: 'UPDATE_CATEGORY',
        payload: { ...categoryData, id: editingCategory.id }
      });
    } else {
      dispatch({
        type: 'ADD_CATEGORY',
        payload: categoryData
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', subcategories: [''] });
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      subcategories: category.subcategories.length > 0 ? category.subcategories : ['']
    });
    setShowForm(true);
  };

  const handleDelete = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      dispatch({ type: 'DELETE_CATEGORY', payload: categoryId });
    }
  };

  const addSubcategory = () => {
    setFormData({
      ...formData,
      subcategories: [...formData.subcategories, '']
    });
  };

  const removeSubcategory = (index) => {
    setFormData({
      ...formData,
      subcategories: formData.subcategories.filter((_, i) => i !== index)
    });
  };

  const updateSubcategory = (index, value) => {
    const newSubcategories = [...formData.subcategories];
    newSubcategories[index] = value;
    setFormData({
      ...formData,
      subcategories: newSubcategories
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Organize your transactions with categories</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <SafeIcon icon={FiPlus} className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Category Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-500"
            >
              <SafeIcon icon={FiX} className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter category name"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Subcategories (Optional)</label>
                <button
                  type="button"
                  onClick={addSubcategory}
                  className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
                >
                  <SafeIcon icon={FiPlus} className="h-4 w-4 mr-1" />
                  Add Subcategory
                </button>
              </div>
              <div className="space-y-2">
                {formData.subcategories.map((subcategory, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => updateSubcategory(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Subcategory name"
                    />
                    {formData.subcategories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubcategory(index)}
                        className="text-gray-400 hover:text-danger-600 transition-colors"
                      >
                        <SafeIcon icon={FiX} className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 transition-colors flex items-center"
              >
                <SafeIcon icon={FiSave} className="h-4 w-4 mr-2" />
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-full mr-4">
                  <SafeIcon icon={FiTag} className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">
                    {category.subcategories.length} subcategories
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <SafeIcon icon={FiEdit2} className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-gray-400 hover:text-danger-600 transition-colors"
                >
                  <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {category.subcategories.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Subcategories:</h4>
                <div className="flex flex-wrap gap-2">
                  {category.subcategories.map((subcategory, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {subcategory}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {state.categories.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiTag} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
          <p className="text-gray-600 mb-4">Create categories to organize your transactions</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add Category
          </button>
        </div>
      )}
    </div>
  );
};

export default Categories;