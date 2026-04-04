require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./config/mqtt'); // Initialize MQTT client

const app = express();

const sensorRoutes = require('./routes/sensorRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const actionRoutes = require('./routes/actionRoutes');

// Import swagger UI
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

app.use(cors());
app.use(express.json());

// Set up Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Register API Routes
app.use('/api/sensors', sensorRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/actions', actionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});