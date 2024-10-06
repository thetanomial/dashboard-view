const express = require('express');
const mongoose = require('mongoose');
const Service = require('../models/Service'); // Adjust the path to your Service model as necessary
const router = express.Router();

// Create a new service
router.post('/', async (req, res) => {
  try {
    const { name } = req.body; // No need for subLinks now
    const newService = new Service({ name });
    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    res.status(500).json({ message: 'Error creating service', error });
  }
});

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find(); // No need to populate subLinks
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error });
  }
});

// Get a service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id); // No need to populate subLinks
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching service', error });
  }
});

// Update a service by ID
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body; // No need for subLinks
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true } // Return the updated document and run validators
    );
    if (!updatedService) return res.status(404).json({ message: 'Service not found' });
    res.status(200).json(updatedService);
  } catch (error) {
    res.status(500).json({ message: 'Error updating service', error });
  }
});

// Delete a service by ID
router.delete('/:id', async (req, res) => {
    try {
      // Find the service to be deleted
      const service = await Service.findById(req.params.id);
      if (!service) return res.status(404).json({ message: 'Service not found' });
  
      // Delete all SubServices associated with this Service
      await SubService.deleteMany({ parentService: service._id });
  
      // Now delete the Service
      const deletedService = await Service.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Service and associated SubServices deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting service', error });
    }
  });

// Export the router
module.exports = router;
