const express = require('express');
const { db } = require('../firebase-config');
const { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, runTransaction } = require("firebase-admin/firestore");

const router = express.Router();

// ✅ **Create Booking with auto-generated ID**
router.post('/', async (req, res) => {
    const { NoOfSeats, Cost, EmailAddress } = req.body;

    // Validate required fields
    if (!NoOfSeats || !Cost || !EmailAddress) {
        return res.status(400).json({ 
            error: "Missing required fields: NoOfSeats, Cost, EmailAddress" 
        });
    }

    // Validate data types
    if (typeof NoOfSeats !== 'number' || typeof Cost !== 'number' || typeof EmailAddress !== 'string') {
        return res.status(400).json({ 
            error: "Invalid data types: NoOfSeats and Cost must be numbers, EmailAddress must be a string" 
        });
    }

    try {
        const counterRef = db.collection('counters').doc('Booking'); // Counter for Booking IDs
        let newCount;

        // Atomic transaction to increment counter
        await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            newCount = (counterDoc.exists ? counterDoc.data().count : 0) + 1;
            transaction.set(counterRef, { count: newCount }, { merge: true });
        });

        // Generate new BookingID
        const newBookingID = `Booking${newCount}`;

        // Create the new booking document
        await db.collection("Booking").doc(newBookingID).set({
            NoOfSeats: NoOfSeats,
            Cost: Cost,
            EmailAddress: EmailAddress
        });

        res.status(200).json({ 
            message: "Booking created successfully",
            generatedId: newBookingID 
        });
    } catch (error) {
        res.status(500).json({ error: "Error creating booking: " + error.message });
    }
});

// ✅ **Get All Bookings**
router.get('/', async (req, res) => {
    try {
        const bookingsSnapshot = await db.collection("Booking").get();
        const bookings = bookingsSnapshot.docs.map(doc => ({
            BookingID: doc.id, // Map document ID to BookingID
            ...doc.data()
        }));
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: "Error fetching bookings: " + error.message });
    }
});

// ✅ **Get Single Booking by ID**
router.get('/:bookingID', async (req, res) => {
    const { bookingID } = req.params;

    // Validate bookingID format (optional)
    if (!bookingID.startsWith("Booking")) {
        return res.status(400).json({ error: "Invalid BookingID format" });
    }

    try {
        const bookingDoc = await db.collection("Booking").doc(bookingID).get();
        if (!bookingDoc.exists) {
            return res.status(404).json({ message: "Booking not found" });
        }
        
        res.status(200).json({
            BookingID: bookingID, // Include document ID as BookingID
            ...bookingDoc.data()
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching booking: " + error.message });
    }
});

// ✅ **Update Booking**
router.put('/:bookingID', async (req, res) => {
    const { bookingID } = req.params;
    const { NoOfSeats, Cost, EmailAddress } = req.body;

    // Validate required fields
    if (!NoOfSeats && !Cost && !EmailAddress) {
        return res.status(400).json({ 
            error: "At least one field is required for update: NoOfSeats, Cost, EmailAddress" 
        });
    }

    // Validate data types (if fields are provided)
    if (NoOfSeats && typeof NoOfSeats !== 'number') {
        return res.status(400).json({ error: "NoOfSeats must be a number" });
    }
    if (Cost && typeof Cost !== 'number') {
        return res.status(400).json({ error: "Cost must be a number" });
    }
    if (EmailAddress && typeof EmailAddress !== 'string') {
        return res.status(400).json({ error: "EmailAddress must be a string" });
    }

    try {
        const bookingRef = db.collection("Booking").doc(bookingID);

        // Check if booking exists
        const bookingDoc = await bookingRef.get();
        if (!bookingDoc.exists) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Prepare update data
        const updateData = {};
        if (NoOfSeats !== undefined) updateData.NoOfSeats = NoOfSeats;
        if (Cost !== undefined) updateData.Cost = Cost;
        if (EmailAddress !== undefined) updateData.EmailAddress = EmailAddress;

        // Update the booking document
        await bookingRef.update(updateData);
        res.status(200).json({ message: "Booking updated successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error updating booking: " + error.message });
    }
});

// ✅ **Delete Booking**
router.delete('/:bookingID', async (req, res) => {
    const { bookingID } = req.params;

    // Validate bookingID format (optional)
    if (!bookingID.startsWith("Booking")) {
        return res.status(400).json({ error: "Invalid BookingID format" });
    }

    try {
        const bookingRef = db.collection("Booking").doc(bookingID);

        // Check if booking exists
        const bookingDoc = await bookingRef.get();
        if (!bookingDoc.exists) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Delete the booking document
        await bookingRef.delete();
        res.status(200).json({ message: "Booking deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error deleting booking: " + error.message });
    }
});

module.exports = router;