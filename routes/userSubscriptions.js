const express = require('express');
const router = express.Router();
const UserSubscription = require('../models/UserSubscription');
const Service = require('../models/Service');
const SubService = require('../models/SubService');

// CREATE a new UserSubscription
router.post('/', async (req, res) => {
  try {
    const { user, services } = req.body;
    const newSubscription = new UserSubscription({ user, services });
    const savedSubscription = await newSubscription.save();
    res.status(201).json(savedSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error creating subscription', error });
  }
});

// READ all UserSubscriptions
router.get('/', async (req, res) => {
  try {
    const subscriptions = await UserSubscription.find().populate('user').populate('services');
    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscriptions', error });
  }
});

router.get('/generate_service_tree/all', async (req, res) => {
  try {
    // Fetch the subscriptions and populate user and services (including parentService)
    const subscriptions = await UserSubscription.find()
      .populate({
        path: 'user',
        select: 'name email role' // Selecting only necessary user fields
      })
      .populate({
        path: 'services', // Populate the services (subServices)
        populate: {
          path: 'parentService', // Populate parentService from each subService
          select: 'name', // Select only the name field from parentService
        }
      });

    // Transform the response into user -> parentService -> subServices structure
    const result = subscriptions.map(subscription => {
      // Group services by parentService
      const groupedServices = {};
      
      subscription.services.forEach(subService => {
        const parentServiceId = subService.parentService._id;
        const parentServiceName = subService.parentService.name;

        if (!groupedServices[parentServiceId]) {
          groupedServices[parentServiceId] = {
            _id: parentServiceId,
            name: parentServiceName,
            subServices: []
          };
        }

        groupedServices[parentServiceId].subServices.push({
          _id: subService._id,
          name: subService.name
        });
      });

      // Return structured user data with services grouped by parentService
      return {
        _id: subscription.user._id,
        name: subscription.user.name,
        email: subscription.user.email,
        role: subscription.user.role,
        services: Object.values(groupedServices)
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscriptions', error });
  }
});

router.get('/generate_service_tree/:userObjectId', async (req, res) => {
  try {
    const { userObjectId } = req.params;

    // Fetch the subscriptions for the specific user and populate user and services (including parentService)
    const subscriptions = await UserSubscription.find({ user: userObjectId }) // Filter by userObjectId
      .populate({
        path: 'user',
        select: 'name email role' // Selecting only necessary user fields
      })
      .populate({
        path: 'services', // Populate the services (subServices)
        populate: {
          path: 'parentService', // Populate parentService from each subService
          select: 'name', // Select only the name field from parentService
        }
      });

    // Check if subscriptions exist for the user
    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No subscriptions found for this user.' });
    }

    // Initialize a result object to hold the user data and grouped services
    let result = {
      _id: subscriptions[0].user._id, // Since it's the same user, we can use the first subscription's user data
      name: subscriptions[0].user.name,
      email: subscriptions[0].user.email,
      role: subscriptions[0].user.role,
      services: {} // Object to store grouped services by parentService
    };

    // Iterate through each subscription and group services by parentService
    subscriptions.forEach(subscription => {
      subscription.services.forEach(subService => {
        const parentServiceId = subService.parentService._id;
        const parentServiceName = subService.parentService.name;

        // If the parentService doesn't exist in the result, create a new entry
        if (!result.services[parentServiceId]) {
          result.services[parentServiceId] = {
            _id: parentServiceId,
            name: parentServiceName,
            subServices: []
          };
        }

        // Add the subService to the corresponding parentService
        result.services[parentServiceId].subServices.push({
          _id: subService._id,
          name: subService.name
        });
      });
    });

    // Convert the services object into an array
    result.services = Object.values(result.services);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscriptions', error });
  }
});



// show locked and unlocked services

router.get('/generate_service_tree/show_locked_unlocked_services/:userObjectId', async (req, res) => {
  try {
    const { userObjectId } = req.params;

    // Fetch all services and populate subServices
    const allServices = await SubService.find().populate('parentService');
    
    // Create a map to group all services by their parentService name
    const groupedAllServices = {};

    allServices.forEach(subService => {
      const parentName = subService.parentService.name;

      if (!groupedAllServices[parentName]) {
        groupedAllServices[parentName] = {
          name: parentName,
          subServices: []
        };
      }

      groupedAllServices[parentName].subServices.push({
        _id: subService._id,
        name: subService.name,
        __v: subService.__v
      });
    });

    const availableServices = Object.values(groupedAllServices);

    // Fetch the subscriptions for the specific user and populate user and services
    const subscriptions = await UserSubscription.find({ user: userObjectId })
      .populate({
        path: 'user',
        select: 'name email role' // Selecting only necessary user fields
      })
      .populate({
        path: 'services', // Populate the services (subServices)
        populate: {
          path: 'parentService', // Populate parentService from each subService
          select: 'name', // Select only the name field from parentService
        }
      });

    // Check if subscriptions exist for the user
    if (subscriptions.length === 0) {
      return res.status(404).json({ message: 'No subscriptions found for this user.' });
    }

    // Group user subscribed services
    const subscribedServiceIds = new Set();
    const userGroupedServices = {};

    subscriptions.forEach(subscription => {
      subscription.services.forEach(subService => {
        const parentServiceId = subService.parentService._id;
        const parentServiceName = subService.parentService.name;

        // Add to user grouped services if not already present
        if (!userGroupedServices[parentServiceId]) {
          userGroupedServices[parentServiceId] = {
            _id: parentServiceId,
            name: parentServiceName,
            subServices: []
          };
        }

        userGroupedServices[parentServiceId].subServices.push({
          _id: subService._id,
          name: subService.name
        });

        subscribedServiceIds.add(subService._id);
      });
    });

    // Prepare final output
    const result = {
      subscribedServices: Object.values(userGroupedServices),
      lockedServices: []
    };

    // Determine locked services
    availableServices.forEach(service => {
      const lockedService = {
        name: service.name,
        subServices: []
      };

      service.subServices.forEach(subService => {
        if (!subscribedServiceIds.has(subService._id)) {
          lockedService.subServices.push({
            _id: subService._id,
            name: subService.name
          });
        }
      });

      if (lockedService.subServices.length > 0) {
        result.lockedServices.push(lockedService);
      }
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching subscriptions', error });
  }
});







// READ a single UserSubscription by ID
router.get('/:id', async (req, res) => {
  try {
    const subscription = await UserSubscription.findById(req.params.id).populate('user').populate('services');
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscription', error });
  }
});

// UPDATE a UserSubscription by ID
router.put('/:id', async (req, res) => {
  try {
    const { user, services } = req.body;
    const updatedSubscription = await UserSubscription.findByIdAndUpdate(
      req.params.id,
      { user, services },
      { new: true, runValidators: true }
    ).populate('user').populate('services');
    if (!updatedSubscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.status(200).json(updatedSubscription);
  } catch (error) {
    res.status(500).json({ message: 'Error updating subscription', error });
  }
});

// DELETE a UserSubscription by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedSubscription = await UserSubscription.findByIdAndDelete(req.params.id);
    if (!deletedSubscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.status(200).json({ message: 'Subscription deleted', deletedSubscription });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subscription', error });
  }
});

module.exports = router;
