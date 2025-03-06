const express = require('express');
const { db } = require('../firebase-config');
const { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, runTransaction } = require("firebase-admin/firestore");

const router = express.Router();

// ✅ **Create Ticket with auto-generated ID**
router.post('/', async (req, res) => {
    const { BookingID, ScreeningID, TicketType, SeatRow, SeatColumn } = req.body;

    // Validate required fields
    if (!BookingID || !ScreeningID || !TicketType || SeatRow === undefined || SeatColumn === undefined) {
        return res.status(400).json({ 
            error: "Missing required fields: BookingID, ScreeningID, TicketType, SeatRow, SeatColumn" 
        });
    }

    // Validate data types
    if (typeof BookingID !== 'string' || typeof ScreeningID !== 'string' || typeof TicketType !== 'string' || 
        typeof SeatRow !== 'number' || typeof SeatColumn !== 'number') {
        return res.status(400).json({ 
            error: "Invalid data types: BookingID, ScreeningID, TicketType must be strings; SeatRow, SeatColumn must be numbers" 
        });
    }

    try {
        // Check if Booking exists
        const bookingRef = db.collection("Booking").doc(BookingID);
        const bookingDoc = await bookingRef.get();
        if (!bookingDoc.exists) {
            return res.status(404).json({ error: `BookingID ${BookingID} not found` });
        }

        // Check if Screening exists
        const screeningRef = db.collection("Screening").doc(ScreeningID);
        const screeningDoc = await screeningRef.get();
        if (!screeningDoc.exists) {
            return res.status(404).json({ error: `ScreeningID ${ScreeningID} not found` });
        }

        // Check if TicketType exists
        const ticketTypeRef = db.collection("TicketType").doc(TicketType);
        const ticketTypeDoc = await ticketTypeRef.get();
        if (!ticketTypeDoc.exists) {
            return res.status(404).json({ error: `TicketType ${TicketType} not found` });
        }

        // Generate new TicketID using a counter
        const counterRef = db.collection('counters').doc('Ticket');
        let newCount;

        // Atomic transaction to increment counter
        await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            newCount = (counterDoc.exists ? counterDoc.data().count : 0) + 1;
            transaction.set(counterRef, { count: newCount }, { merge: true });
        });

        // Generate new TicketID
        const newTicketID = `Ticket${newCount}`;

        // Create the new ticket document
        await db.collection("Ticket").doc(newTicketID).set({
            BookingID: bookingRef, // Store reference to Booking document
            ScreeningID: screeningRef, // Store reference to Screening document
            TicketType: ticketTypeRef, // Store reference to TicketType document
            SeatRow: SeatRow,
            SeatColumn: SeatColumn
        });

        res.status(200).json({ 
            message: "Ticket created successfully",
            generatedId: newTicketID 
        });
    } catch (error) {
        res.status(500).json({ error: "Error creating ticket: " + error.message });
    }
});

// ✅ **Get All Tickets**
router.get('/', async (req, res) => {
    try {
        const ticketsSnapshot = await db.collection("Ticket").get();
        const tickets = ticketsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                TicketID: doc.id,
                BookingID: data.BookingID.id, // Extract BookingID from reference
                ScreeningID: data.ScreeningID.id, // Extract ScreeningID from reference
                TicketType: data.TicketType.id, // Extract TicketType from reference
                SeatRow: data.SeatRow,
                SeatColumn: data.SeatColumn
            };
        });
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ error: "Error fetching tickets: " + error.message });
    }
});

// ✅ **Get Single Ticket by ID**
router.get('/:ticketID', async (req, res) => {
    const { ticketID } = req.params;

    // Validate ticketID format (optional)
    if (!ticketID.startsWith("Ticket")) {
        return res.status(400).json({ error: "Invalid TicketID format" });
    }

    try {
        const ticketRef = db.collection("Ticket").doc(ticketID);
        const ticketDoc = await ticketRef.get();
        if (!ticketDoc.exists) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        
        const data = ticketDoc.data();
        res.status(200).json({
            TicketID: ticketID,
            BookingID: data.BookingID.id, // Extract BookingID from reference
            ScreeningID: data.ScreeningID.id, // Extract ScreeningID from reference
            TicketType: data.TicketType.id, // Extract TicketType from reference
            SeatRow: data.SeatRow,
            SeatColumn: data.SeatColumn
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching ticket: " + error.message });
    }
});

// ✅ **Update Ticket**
router.put('/:ticketID', async (req, res) => {
    const { ticketID } = req.params;
    const { BookingID, ScreeningID, TicketType, SeatRow, SeatColumn } = req.body;

    // Validate at least one field is provided
    if (!BookingID && !ScreeningID && !TicketType && SeatRow === undefined && SeatColumn === undefined) {
        return res.status(400).json({ 
            error: "At least one field is required for update: BookingID, ScreeningID, TicketType, SeatRow, SeatColumn" 
        });
    }

    // Validate data types (if fields are provided)
    if (BookingID && typeof BookingID !== 'string') {
        return res.status(400).json({ error: "BookingID must be a string" });
    }
    if (ScreeningID && typeof ScreeningID !== 'string') {
        return res.status(400).json({ error: "ScreeningID must be a string" });
    }
    if (TicketType && typeof TicketType !== 'string') {
        return res.status(400).json({ error: "TicketType must be a string" });
    }
    if (SeatRow !== undefined && typeof SeatRow !== 'number') {
        return res.status(400).json({ error: "SeatRow must be a number" });
    }
    if (SeatColumn !== undefined && typeof SeatColumn !== 'number') {
        return res.status(400).json({ error: "SeatColumn must be a number" });
    }

    try {
        const ticketRef = db.collection("Ticket").doc(ticketID);

        // Check if ticket exists
        const ticketDoc = await ticketRef.get();
        if (!ticketDoc.exists) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // Prepare update data
        const updateData = {};
        if (BookingID) {
            // Check if new BookingID exists
            const bookingRef = db.collection("Booking").doc(BookingID);
            const bookingDoc = await bookingRef.get();
            if (!bookingDoc.exists) {
                return res.status(404).json({ error: `BookingID ${BookingID} not found` });
            }
            updateData.BookingID = bookingRef; // Update with reference
        }
        if (ScreeningID) {
            // Check if new ScreeningID exists
            const screeningRef = db.collection("Screening").doc(ScreeningID);
            const screeningDoc = await screeningRef.get();
            if (!screeningDoc.exists) {
                return res.status(404).json({ error: `ScreeningID ${ScreeningID} not found` });
            }
            updateData.ScreeningID = screeningRef; // Update with reference
        }
        if (TicketType) {
            // Check if new TicketType exists
            const ticketTypeRef = db.collection("TicketType").doc(TicketType);
            const ticketTypeDoc = await ticketTypeRef.get();
            if (!ticketTypeDoc.exists) {
                return res.status(404).json({ error: `TicketType ${TicketType} not found` });
            }
            updateData.TicketType = ticketTypeRef; // Update with reference
        }
        if (SeatRow !== undefined) updateData.SeatRow = SeatRow;
        if (SeatColumn !== undefined) updateData.SeatColumn = SeatColumn;

        // Update the ticket document
        await ticketRef.update(updateData);
        res.status(200).json({ message: "Ticket updated successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error updating ticket: " + error.message });
    }
});

// ✅ **Delete Ticket**
router.delete('/:ticketID', async (req, res) => {
    const { ticketID } = req.params;

    // Validate ticketID format (optional)
    if (!ticketID.startsWith("Ticket")) {
        return res.status(400).json({ error: "Invalid TicketID format" });
    }

    try {
        const ticketRef = db.collection("Ticket").doc(ticketID);

        // Check if ticket exists
        const ticketDoc = await ticketRef.get();
        if (!ticketDoc.exists) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // Delete the ticket document
        await ticketRef.delete();
        res.status(200).json({ message: "Ticket deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error deleting ticket: " + error.message });
    }
});

module.exports = router;