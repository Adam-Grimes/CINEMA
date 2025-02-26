const express = require('express');
const { db } = require('../firebase-config');
const { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs } = require("firebase/firestore");

const router = express.Router();

// Add a Booking (Create)
router.post('/', async (req, res) => {
    const { BookingID, ScreeningID, NoOfSeats, Cost, EmailAddress } = req.body;

    try {
        await setDoc(doc(collection(db, "Booking"), BookingID), { // BookingID is doc ID
            ScreeningID: ScreeningID,
            NoOfSeats: NoOfSeats,
            Cost: Cost,
            EmailAddress: EmailAddress
        });
        res.status(200).json({ message: "Booking added successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error adding booking: " + error.message });
    }
});

// Get all Bookings
router.get('/', async (req, res) => {
    try {
        const bookingsSnapshot = await getDocs(collection(db, "Booking"));
        const bookings = bookingsSnapshot.docs.map(doc => ({
            BookingID: doc.id, // Map doc ID to BookingID
            ...doc.data()
        }));
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: "Error fetching bookings: " + error.message });
    }
});

// Get a Booking by ID (Read)
router.get('/:bookingID', async (req, res) => {
    const { bookingID } = req.params;

    try {
        const bookingDoc = await getDoc(doc(db, "Booking", bookingID));
        if (bookingDoc.exists()) {
            res.status(200).json({
                BookingID: bookingID, // Include doc ID as BookingID
                ...bookingDoc.data()
            });
        } else {
            res.status(404).json({ message: "Booking not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error fetching booking: " + error.message });
    }
});

// Update a Booking (Update)
router.put('/:bookingID', async (req, res) => {
    const { bookingID } = req.params;
    const updatedData = req.body;

    try {
        const bookingRef = doc(db, "Booking", bookingID);
        await updateDoc(bookingRef, updatedData);
        res.status(200).json({ message: "Booking updated successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error updating booking: " + error.message });
    }
});

// Delete a Booking (Delete)
router.delete('/:bookingID', async (req, res) => {
    const { bookingID } = req.params;

    try {
        await deleteDoc(doc(db, "Booking", bookingID));
        res.status(200).json({ message: "Booking deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error deleting booking: " + error.message });
    }
});

module.exports = router;