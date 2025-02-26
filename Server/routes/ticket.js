const express = require('express');
const { db } = require('../firebase-config');
const { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs } = require("firebase/firestore");

const router = express.Router();

// Create Ticket
router.post('/', async (req, res) => {
    const { TicketID, BookingID, ScreeningID, TicketType } = req.body;

    try {
        // Use TicketID as document ID
        await setDoc(doc(collection(db, "Ticket"), TicketID), {
            BookingID: BookingID,
            ScreeningID: ScreeningID,
            TicketType: TicketType, // Reference to TicketType collection
        
        });
        res.status(200).json({ message: "Ticket created successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error creating ticket: " + error.message });
    }
});

// Get All Tickets
router.get('/', async (req, res) => {
    try {
        const ticketsSnapshot = await getDocs(collection(db, "Ticket"));
        const tickets = ticketsSnapshot.docs.map(doc => ({
            TicketID: doc.id, // Map document ID to TicketID
            BookingID: doc.data().BookingID,
            ScreeningID: doc.data().ScreeningID,
            TicketType: doc.data().TicketType,

        }));
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ error: "Error fetching tickets: " + error.message });
    }
});

// Get Single Ticket by ID
router.get('/:ticketID', async (req, res) => {
    const { ticketID } = req.params;

    try {
        const ticketDoc = await getDoc(doc(db, "Ticket", ticketID));
        if (!ticketDoc.exists()) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        
        res.status(200).json({
            TicketID: ticketID, // Document ID as TicketID
            ...ticketDoc.data()
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching ticket: " + error.message });
    }
});

// Update Ticket
router.put('/:ticketID', async (req, res) => {
    const { ticketID } = req.params;
    const { BookingID, ScreeningID, TicketType } = req.body;

    try {
        const ticketRef = doc(db, "Ticket", ticketID);
        await updateDoc(ticketRef, {
            BookingID: BookingID,
            ScreeningID: ScreeningID,
            TicketType: TicketType,
            Cost: Cost
        });
        res.status(200).json({ message: "Ticket updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error updating ticket: " + error.message });
    }
});

// Delete Ticket
router.delete('/:ticketID', async (req, res) => {
    const { ticketID } = req.params;

    try {
        await deleteDoc(doc(db, "Ticket", ticketID));
        res.status(200).json({ message: "Ticket deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting ticket: " + error.message });
    }
});

module.exports = router;