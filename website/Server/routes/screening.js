const express = require('express');
const { db } = require('../firebase-config');
const { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, runTransaction } = require("firebase-admin/firestore");

const router = express.Router();

// ✅ **Create Screening with auto-generated ID**
router.post('/', async (req, res) => {
    const { FilmID, TheatreID, Date, StartTime, SeatsRemaining } = req.body;

    // Validate required fields
    if (!FilmID || !TheatreID || !Date || !StartTime || SeatsRemaining === undefined) {
        return res.status(400).json({ 
            error: "Missing required fields: FilmID, TheatreID, Date, StartTime, SeatsRemaining" 
        });
    }

    // Validate data types
    if (typeof FilmID !== 'string' || typeof TheatreID !== 'string' || typeof Date !== 'string' || 
        typeof StartTime !== 'string' || typeof SeatsRemaining !== 'number') {
        return res.status(400).json({ 
            error: "Invalid data types: FilmID, TheatreID, Date, StartTime must be strings; SeatsRemaining must be a number" 
        });
    }

    try {
        // Check if Film exists
        const filmRef = db.collection("Film").doc(FilmID);
        const filmDoc = await filmRef.get();
        if (!filmDoc.exists) {
            return res.status(404).json({ error: `FilmID ${FilmID} not found` });
        }

        // Check if Theatre exists
        const theatreRef = db.collection("Theatre").doc(TheatreID);
        const theatreDoc = await theatreRef.get();
        if (!theatreDoc.exists) {
            return res.status(404).json({ error: `TheatreID ${TheatreID} not found` });
        }

        // Generate new ScreeningID using a counter
        const counterRef = db.collection('counters').doc('Screening');
        let newCount;

        // Atomic transaction to increment counter
        await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            newCount = (counterDoc.exists ? counterDoc.data().count : 0) + 1;
            transaction.set(counterRef, { count: newCount }, { merge: true });
        });

        // Generate new ScreeningID
        const newScreeningID = `Screening${newCount}`;

        // Create the new screening document
        await db.collection("Screening").doc(newScreeningID).set({
            FilmID: filmRef, // Store reference to Film document
            TheatreID: theatreRef, // Store reference to Theatre document
            Date: Date,
            StartTime: StartTime,
            SeatsRemaining: SeatsRemaining
        });

        res.status(200).json({ 
            message: "Screening created successfully",
            generatedId: newScreeningID 
        });
    } catch (error) {
        res.status(500).json({ error: "Error creating screening: " + error.message });
    }
});

// ✅ **Get All Screenings**
router.get('/', async (req, res) => {
    try {
        const screeningsSnapshot = await db.collection("Screening").get();
        const screenings = screeningsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ScreeningID: doc.id,
                FilmID: data.FilmID.id, // Extract FilmID from reference
                TheatreID: data.TheatreID.id, // Extract TheatreID from reference
                Date: data.Date,
                StartTime: data.StartTime,
                SeatsRemaining: data.SeatsRemaining
            };
        });
        res.status(200).json(screenings);
    } catch (error) {
        res.status(500).json({ error: "Error fetching screenings: " + error.message });
    }
});

// ✅ **Get Single Screening by ID**
router.get('/:screeningID', async (req, res) => {
    const { screeningID } = req.params;

    // Validate screeningID format (optional)
    if (!screeningID.startsWith("Screening")) {
        return res.status(400).json({ error: "Invalid ScreeningID format" });
    }

    try {
        const screeningRef = db.collection("Screening").doc(screeningID);
        const screeningDoc = await screeningRef.get();
        if (!screeningDoc.exists) {
            return res.status(404).json({ message: "Screening not found" });
        }
        
        const data = screeningDoc.data();
        res.status(200).json({
            ScreeningID: screeningID,
            FilmID: data.FilmID.id, // Extract FilmID from reference
            TheatreID: data.TheatreID.id, // Extract TheatreID from reference
            Date: data.Date,
            StartTime: data.StartTime,
            SeatsRemaining: data.SeatsRemaining
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching screening: " + error.message });
    }
});

// ✅ **Update Screening**
router.put('/:screeningID', async (req, res) => {
    const { screeningID } = req.params;
    const { FilmID, TheatreID, Date, StartTime, SeatsRemaining } = req.body;

    // Validate at least one field is provided
    if (!FilmID && !TheatreID && !Date && !StartTime && SeatsRemaining === undefined) {
        return res.status(400).json({ 
            error: "At least one field is required for update: FilmID, TheatreID, Date, StartTime, SeatsRemaining" 
        });
    }

    // Validate data types (if fields are provided)
    if (FilmID && typeof FilmID !== 'string') {
        return res.status(400).json({ error: "FilmID must be a string" });
    }
    if (TheatreID && typeof TheatreID !== 'string') {
        return res.status(400).json({ error: "TheatreID must be a string" });
    }
    if (Date && typeof Date !== 'string') {
        return res.status(400).json({ error: "Date must be a string" });
    }
    if (StartTime && typeof StartTime !== 'string') {
        return res.status(400).json({ error: "StartTime must be a string" });
    }
    if (SeatsRemaining !== undefined && typeof SeatsRemaining !== 'number') {
        return res.status(400).json({ error: "SeatsRemaining must be a number" });
    }

    try {
        const screeningRef = db.collection("Screening").doc(screeningID);

        // Check if screening exists
        const screeningDoc = await screeningRef.get();
        if (!screeningDoc.exists) {
            return res.status(404).json({ message: "Screening not found" });
        }

        // Prepare update data
        const updateData = {};
        if (FilmID) {
            // Check if new FilmID exists
            const filmRef = db.collection("Film").doc(FilmID);
            const filmDoc = await filmRef.get();
            if (!filmDoc.exists) {
                return res.status(404).json({ error: `FilmID ${FilmID} not found` });
            }
            updateData.FilmID = filmRef; // Update with reference
        }
        if (TheatreID) {
            // Check if new TheatreID exists
            const theatreRef = db.collection("Theatre").doc(TheatreID);
            const theatreDoc = await theatreRef.get();
            if (!theatreDoc.exists) {
                return res.status(404).json({ error: `TheatreID ${TheatreID} not found` });
            }
            updateData.TheatreID = theatreRef; // Update with reference
        }
        if (Date) updateData.Date = Date;
        if (StartTime) updateData.StartTime = StartTime;
        if (SeatsRemaining !== undefined) updateData.SeatsRemaining = SeatsRemaining;

        // Update the screening document
        await screeningRef.update(updateData);
        res.status(200).json({ message: "Screening updated successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error updating screening: " + error.message });
    }
});

// ✅ **Delete Screening**
router.delete('/:screeningID', async (req, res) => {
    const { screeningID } = req.params;

    // Validate screeningID format (optional)
    if (!screeningID.startsWith("Screening")) {
        return res.status(400).json({ error: "Invalid ScreeningID format" });
    }

    try {
        const screeningRef = db.collection("Screening").doc(screeningID);

        // Check if screening exists
        const screeningDoc = await screeningRef.get();
        if (!screeningDoc.exists) {
            return res.status(404).json({ message: "Screening not found" });
        }

        // Delete the screening document
        await screeningRef.delete();
        res.status(200).json({ message: "Screening deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error deleting screening: " + error.message });
    }
});

module.exports = router;