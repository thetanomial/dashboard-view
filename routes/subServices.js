const express = require('express');
const subService = require('../models/SubService');
const router = express.Router();

// Create a new SubService
router.post('/', async (req, res) => {
  try {
    const { name, parentService } = req.body; // Expecting both name and parentService in the request body
    const newSubService = new subService({ name, parentService });
    const savedSubService = await newSubService.save();
    res.status(201).json(savedSubService);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error creating SubService', error });
  }
});

// Get all SubServices
router.get('/', async (req, res) => {
  try {
    const subServices = await subService.find().populate('parentService'); // Populate parentService to get service details
    res.status(200).json(subServices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching SubServices', error });
  }
});

// Get a SubService by ID
router.get('/:id', async (req, res) => {
  try {
    const subService = await subService.findById(req.params.id).populate('parentService');
    if (!subService) return res.status(404).json({ message: 'SubService not found' });
    res.status(200).json(subService);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching SubService', error });
  }
});

// Update a SubService by ID
router.put('/:id', async (req, res) => {
  try {
    const { name, parentService } = req.body; // Expecting updated name and parentService in the request body
    const updatedSubService = await subService.findByIdAndUpdate(
      req.params.id,
      { name, parentService },
      { new: true, runValidators: true } // Return the updated document and run validators
    );
    if (!updatedSubService) return res.status(404).json({ message: 'SubService not found' });
    res.status(200).json(updatedSubService);
  } catch (error) {
    res.status(500).json({ message: 'Error updating SubService', error });
  }
});

// Delete a SubService by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedSubService = await subService.findByIdAndDelete(req.params.id);
    if (!deletedSubService) return res.status(404).json({ message: 'SubService not found' });
    res.status(200).json({ message: 'SubService deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting SubService', error });
  }
});

// Export the router
module.exports = router;
