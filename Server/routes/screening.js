const express = require('express');
const { db } = require('../firebase-config');
const { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs } = require("firebase/firestore");

const router = express.Router();

// Create Screening
router.post('/', async (req, res) => {
    const { ScreeningID, FilmID, TheatreID, Date, StartTime, SeatsRemaining } = req.body;

    try {
        // Use ScreeningID as document ID
        await setDoc(doc(collection(db, "Screening"), ScreeningID), {
            FilmID: FilmID,
            TheatreID: TheatreID,
            Date: Date,          // Format: "YYYY-MM-DD"
            StartTime: StartTime, // Format: "HH:MM" (24-hour)
            SeatsRemaining: SeatsRemaining
        });
        res.status(200).json({ message: "Screening created successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error creating screening: " + error.message });
    }
});

// Get All Screenings
router.get('/', async (req, res) => {
    try {
        const screeningsSnapshot = await getDocs(collection(db, "Screening"));
        const screenings = screeningsSnapshot.docs.map(doc => ({
            ScreeningID: doc.id, // Map document ID to ScreeningID
            FilmID: doc.data().FilmID,
            TheatreID: doc.data().TheatreID,
            Date: doc.data().Date,
            StartTime: doc.data().StartTime,
            SeatsRemaining: doc.data().SeatsRemaining
        }));
        res.status(200).json(screenings);
    } catch (error) {
        res.status(500).json({ error: "Error fetching screenings: " + error.message });
    }
});

// Get Single Screening by ID
router.get('/:screeningID', async (req, res) => {
    const { screeningID } = req.params;

    try {
        const screeningDoc = await getDoc(doc(db, "Screening", screeningID));
        if (!screeningDoc.exists()) {
            return res.status(404).json({ message: "Screening not found" });
        }
        
        res.status(200).json({
            ScreeningID: screeningID, // Document ID as ScreeningID
            ...screeningDoc.data()
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching screening: " + error.message });
    }
});

// Update Screening
router.put('/:screeningID', async (req, res) => {
    const { screeningID } = req.params;
    const { FilmID, TheatreID, Date, StartTime, SeatsRemaining } = req.body;

    try {
        const screeningRef = doc(db, "Screening", screeningID);
        await updateDoc(screeningRef, {
            FilmID: FilmID,
            TheatreID: TheatreID,
            Date: Date,
            StartTime: StartTime,
            SeatsRemaining: SeatsRemaining
        });
        res.status(200).json({ message: "Screening updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error updating screening: " + error.message });
    }
});

// Delete Screening
router.delete('/:screeningID', async (req, res) => {
    const { screeningID } = req.params;

    try {
        await deleteDoc(doc(db, "Screening", screeningID));
        res.status(200).json({ message: "Screening deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting screening: " + error.message });
    }
});

module.exports = router;