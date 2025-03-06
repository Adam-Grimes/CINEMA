const express = require('express');
const { db } = require('../firebase-config');
const { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs } = require("firebase-admin/firestore");

const router = express.Router();

// ✅ **Create Film**
router.post('/', async (req, res) => {
    const { FilmID, Name, Category, Genre, Duration, Trailer, Poster } = req.body;

    // Validate required fields
    if (!FilmID || !Name || !Category || !Genre || !Duration) {
        return res.status(400).json({ 
            error: "Missing required fields: FilmID, Name, Category, Genre, Duration" 
        });
    }

    // Validate data types
    if (typeof FilmID !== 'string' || typeof Name !== 'string' || typeof Category !== 'string' || 
        typeof Genre !== 'string' || typeof Duration !== 'number') {
        return res.status(400).json({ 
            error: "Invalid data types: FilmID, Name, Category, Genre must be strings; Duration must be a number" 
        });
    }

    try {
        // Check if FilmID already exists
        const filmRef = db.collection("Film").doc(FilmID);
        const filmDoc = await filmRef.get();
        if (filmDoc.exists) {
            return res.status(400).json({ error: `FilmID ${FilmID} already exists` });
        }

        // Create the new film document
        await filmRef.set({
            Name: Name,
            Category: Category,
            Genre: Genre,
            Duration: Duration,
            Trailer: Trailer || null, // Optional field
            Poster: Poster || null // Optional field
        });

        res.status(200).json({ 
            message: "Film created successfully",
            FilmID: FilmID 
        });
    } catch (error) {
        res.status(500).json({ error: "Error creating film: " + error.message });
    }
});

// ✅ **Get All Films**
router.get('/', async (req, res) => {
    try {
        const filmsSnapshot = await db.collection("Film").get();
        const films = filmsSnapshot.docs.map(doc => ({
            FilmID: doc.id, // Map document ID to FilmID
            ...doc.data()
        }));
        res.status(200).json(films);
    } catch (error) {
        res.status(500).json({ error: "Error fetching films: " + error.message });
    }
});

// ✅ **Get Single Film by ID**
router.get('/:filmID', async (req, res) => {
    const { filmID } = req.params;

    // Validate filmID format (optional)
    if (!filmID.startsWith("Film")) {
        return res.status(400).json({ error: "Invalid FilmID format" });
    }

    try {
        const filmRef = db.collection("Film").doc(filmID);
        const filmDoc = await filmRef.get();
        if (!filmDoc.exists) {
            return res.status(404).json({ message: "Film not found" });
        }
        
        res.status(200).json({
            FilmID: filmID, // Include document ID as FilmID
            ...filmDoc.data()
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching film: " + error.message });
    }
});

router.get('/film/:filmId', async (req, res) => {
    // Added log to verify route execution
    console.log("GET /api/screenings/film route called with", req.params.filmId);
   
    let { filmId } = req.params;
    const sanitizedFilmId = filmId.replace(/^\/?Film\//, '').trim(); // Ensure clean FilmID
    const filmRef = doc(db, "Film", sanitizedFilmId);

    console.log("Sanitized FilmID:", sanitizedFilmId);
    console.log("Film Reference Path:", filmRef.path);

    try {
        // Check if film exists
        const filmDoc = await getDoc(filmRef);
        if (!filmDoc.exists()) {
            return res.status(404).json({ message: "Film not found" });
        }

        console.log(`Film ${sanitizedFilmId} exists. Fetching screenings...`);

        //Fetch all screenings and manually filter (fixes reference issue)
        const allScreeningsSnapshot = await getDocs(collection(db, "Screening"));
        const allScreenings = allScreeningsSnapshot.docs.map(doc => ({
            ScreeningID: doc.id,
            ...doc.data()
        }));

        //  Debugging: Log all FilmIDs in screenings
        allScreenings.forEach(screening => {
            if (screening.FilmID && screening.FilmID.path) {
                console.log(`Screening ${screening.ScreeningID}: FilmID -> ${screening.FilmID.path}`);
            } else {
                console.log(`Screening ${screening.ScreeningID}: No FilmID reference`);
            }
        });

        //  Filter screenings manually by FilmID reference
        const filteredScreenings = allScreenings.filter(screening =>
            screening.FilmID && screening.FilmID.path === filmRef.path
        );
        console.log(`Filtered screenings for ${sanitizedFilmId}:`, filteredScreenings);

        res.status(200).json(filteredScreenings);
    } catch (error) {
        console.error("Error fetching screenings:", error);
        res.status(500).json({ error: "Failed to fetch screenings" });
    }
});


// ✅ **Update Film**
router.put('/:filmID', async (req, res) => {
    const { filmID } = req.params;
    const { Name, Category, Genre, Duration, Trailer, Poster } = req.body;

    // Validate at least one field is provided
    if (!Name && !Category && !Genre && !Duration && !Trailer && !Poster) {
        return res.status(400).json({ 
            error: "At least one field is required for update: Name, Category, Genre, Duration, Trailer, Poster" 
        });
    }

    // Validate data types (if fields are provided)
    if (Name && typeof Name !== 'string') {
        return res.status(400).json({ error: "Name must be a string" });
    }
    if (Category && typeof Category !== 'string') {
        return res.status(400).json({ error: "Category must be a string" });
    }
    if (Genre && typeof Genre !== 'string') {
        return res.status(400).json({ error: "Genre must be a string" });
    }
    if (Duration && typeof Duration !== 'number') {
        return res.status(400).json({ error: "Duration must be a number" });
    }
    if (Trailer && typeof Trailer !== 'string') {
        return res.status(400).json({ error: "Trailer must be a string" });
    }
    if (Poster && typeof Poster !== 'string') {
        return res.status(400).json({ error: "Poster must be a string" });
    }

    try {
        const filmRef = db.collection("Film").doc(filmID);

        // Check if film exists
        const filmDoc = await filmRef.get();
        if (!filmDoc.exists) {
            return res.status(404).json({ message: "Film not found" });
        }

        // Prepare update data
        const updateData = {};
        if (Name !== undefined) updateData.Name = Name;
        if (Category !== undefined) updateData.Category = Category;
        if (Genre !== undefined) updateData.Genre = Genre;
        if (Duration !== undefined) updateData.Duration = Duration;
        if (Trailer !== undefined) updateData.Trailer = Trailer;
        if (Poster !== undefined) updateData.Poster = Poster;

        // Update the film document
        await filmRef.update(updateData);
        res.status(200).json({ message: "Film updated successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error updating film: " + error.message });
    }
});

// ✅ **Delete Film**
router.delete('/:filmID', async (req, res) => {
    const { filmID } = req.params;

    // Validate filmID format (optional)
    if (!filmID.startsWith("Film")) {
        return res.status(400).json({ error: "Invalid FilmID format" });
    }

    try {
        const filmRef = db.collection("Film").doc(filmID);

        // Check if film exists
        const filmDoc = await filmRef.get();
        if (!filmDoc.exists) {
            return res.status(404).json({ message: "Film not found" });
        }

        // Delete the film document
        await filmRef.delete();
        res.status(200).json({ message: "Film deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Error deleting film: " + error.message });
    }
});

module.exports = router;