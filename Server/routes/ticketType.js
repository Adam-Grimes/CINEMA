const express = require('express');
const { db } = require('../firebase-config');
const { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs } = require("firebase/firestore");

const router = express.Router();

// Create TicketType (Document ID = TicketTypeID)
router.post('/', async (req, res) => {
    const { TicketTypeID, Cost } = req.body;

    try {
        await setDoc(doc(collection(db, "TicketType"), TicketTypeID), {
            Cost: Cost
        });
        res.status(200).json({ message: "Ticket type created successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error creating ticket type: " + error.message });
    }
});

// Get All TicketTypes
router.get('/', async (req, res) => {
    try {
        const ticketTypesSnapshot = await getDocs(collection(db, "TicketType"));
        const ticketTypes = ticketTypesSnapshot.docs.map(doc => ({
            TicketTypeID: doc.id, // Document ID is the identifier (e.g., "adult")
            Cost: doc.data().Cost
        }));
        res.status(200).json(ticketTypes);
    } catch (error) {
        res.status(500).json({ error: "Error fetching ticket types: " + error.message });
    }
});

// Get Single TicketType by ID
router.get('/:ticketTypeID', async (req, res) => {
    const { ticketTypeID } = req.params;

    try {
        const ticketTypeDoc = await getDoc(doc(db, "TicketType", ticketTypeID));
        if (!ticketTypeDoc.exists()) {
            return res.status(404).json({ message: "Ticket type not found" });
        }
        res.status(200).json({
            TicketTypeID: ticketTypeID,
            Cost: ticketTypeDoc.data().Cost
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching ticket type: " + error.message });
    }
});

// Update TicketType (Only Cost can be updated)
router.put('/:ticketTypeID', async (req, res) => {
    const { ticketTypeID } = req.params;
    const { Cost } = req.body;

    try {
        const ticketTypeRef = doc(db, "TicketType", ticketTypeID);
        await updateDoc(ticketTypeRef, { Cost: Cost });
        res.status(200).json({ message: "Ticket type updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error updating ticket type: " + error.message });
    }
});

// Delete TicketType
router.delete('/:ticketTypeID', async (req, res) => {
    const { ticketTypeID } = req.params;

    try {
        await deleteDoc(doc(db, "TicketType", ticketTypeID));
        res.status(200).json({ message: "Ticket type deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting ticket type: " + error.message });
    }
});

module.exports = router;