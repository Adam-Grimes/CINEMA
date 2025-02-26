const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json()); // Allow JSON body parsing
app.use(express.static(path.join(__dirname, 'Public')));

// Import routes
const bookingRoutes = require('./Server/routes/booking');
const filmRoutes = require('./Server/routes/film');
const screeningRoutes = require('./Server/routes/screening');
const theatreRoutes = require('./Server/routes/theatre');
const ticketRoutes = require('./Server/routes/ticket');
const ticketTypeRoutes = require('./Server/routes/ticketType');

// Use routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/films', filmRoutes);
app.use('/api/screenings', screeningRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/ticketTypes', ticketTypeRoutes);

// Start server
const server = app.listen(0, () => {
    const assignedPort = server.address().port;
    console.log(`Server running at http://localhost:${assignedPort}/`);
});