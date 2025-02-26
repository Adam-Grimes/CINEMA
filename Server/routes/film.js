const express = require('express');
const { db } = require('../firebase-config');
const { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs } = require("firebase/firestore");

const router = express.Router();

// Add a Film (Create)
// Add a Film (Create)
router.post('/', async (req, res) => {
    const { FilmID, Name, Category, Genre, Duration } = req.body;

    try {
        await setDoc(doc(collection(db, "Film"), FilmID), { // FilmID is the document ID
            Name: Name,
            Category: Category,
            Genre: Genre,
            Duration: Duration
        });
        res.status(200).json({ message: "Film entry added successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error adding film entry: " + error.message });
    }
});
// Get all Films
router.get('/', async (req, res) => {
    try {
        const filmsSnapshot = await getDocs(collection(db, "Film"));
        const films = filmsSnapshot.docs.map(doc => ({
            FilmID: doc.id,
            ...doc.data()
        }));
        res.status(200).json(films);
    } catch (error) {
        res.status(500).json({ error: "Error fetching films: " + error.message });
    }
});

// Get a Film (Read)
router.get('/:filmID', async (req, res) => {
    const { filmID } = req.params;

    try {
        const filmDoc = await getDoc(doc(db, "Film", filmID));
        if (filmDoc.exists()) {
            res.status(200).json(filmDoc.data());
        } else {
            res.status(404).json({ message: "Film not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error getting film entry: " + error.message });
    }
});

// Update a Film (Update)
// Update a Film (Update)
router.put('/:filmID', async (req, res) => {
    const { filmID } = req.params;
    const updatedData = req.body;

    try {
        const filmRef = doc(db, "Film", filmID);
        await updateDoc(filmRef, updatedData);
        res.status(200).json({ message: "Film entry updated successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error updating film entry: " + error.message });
    }
});

// Delete a Film (Delete)
router.delete('/:filmID', async (req, res) => {
    const { filmID } = req.params;

    try {
        const filmRef = doc(db, "Film", filmID);
        await deleteDoc(filmRef);
        res.status(200).json({ message: "Film entry deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error deleting film entry: " + error.message });
    }
});

module.exports = router;