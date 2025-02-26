const express = require('express');
const { db } = require('../firebase-config');
const { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs } = require("firebase/firestore");

const router = express.Router();

// Create Theatre
router.post('/', async (req, res) => {
    const { TheatreID, Capacity } = req.body;

    try {
        // Use TheatreID as document ID, don't store it as a field
        await setDoc(doc(collection(db, "Theatre"), TheatreID), {
            Capacity: Capacity
        });
        res.status(200).json({ message: "Theatre created successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error creating theatre: " + error.message });
    }
});

// Get All Theatres
router.get('/', async (req, res) => {
    try {
        const theatresSnapshot = await getDocs(collection(db, "Theatre"));
        const theatres = theatresSnapshot.docs.map(doc => ({
            TheatreID: doc.id,  // Map document ID to TheatreID
            Capacity: doc.data().Capacity
        }));
        res.status(200).json(theatres);
    } catch (error) {
        res.status(500).json({ error: "Error fetching theatres: " + error.message });
    }
});

// Get Single Theatre by ID
router.get('/:theatreID', async (req, res) => {
    const { theatreID } = req.params;

    try {
        const theatreDoc = await getDoc(doc(db, "Theatre", theatreID));
        if (!theatreDoc.exists()) {
            return res.status(404).json({ message: "Theatre not found" });
        }
        
        res.status(200).json({
            TheatreID: theatreID,  // Include document ID as TheatreID
            Capacity: theatreDoc.data().Capacity
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching theatre: " + error.message });
    }
});

// Update Theatre
router.put('/:theatreID', async (req, res) => {
    const { theatreID } = req.params;
    const { Capacity } = req.body;

    try {
        const theatreRef = doc(db, "Theatre", theatreID);
        await updateDoc(theatreRef, {
            Name: Name,
            Capacity: Capacity
        });
        res.status(200).json({ message: "Theatre updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error updating theatre: " + error.message });
    }
});

// Delete Theatre
router.delete('/:theatreID', async (req, res) => {
    const { theatreID } = req.params;

    try {
        await deleteDoc(doc(db, "Theatre", theatreID));
        res.status(200).json({ message: "Theatre deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting theatre: " + error.message });
    }
});

module.exports = router;