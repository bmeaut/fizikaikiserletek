const express = require('express');
let httpServer = null;

// Known sensor fields — used to auto-discover components from first reading
const SENSOR_FIELDS = {
  accelerometer:            ['x', 'y', 'z'],
  gyroscope:                ['x', 'y', 'z'],
  magnetometer:             ['x', 'y', 'z'],
  gravity:                  ['x', 'y', 'z'],
  accelerometeruncalibrated:['x', 'y', 'z'],
  gyroscopeuncalibrated:    ['x', 'y', 'z'],
  magnetometeruncalibrated: ['x', 'y', 'z'],
  orientation:              ['yaw', 'pitch', 'roll', 'qx', 'qy', 'qz', 'qw'],
  barometer:                ['pressure', 'relativeAltitude'],
  microphone:               ['dBFS'],
  brightness:               ['brightness'],
  pedometer:                ['steps'],
  battery:                  ['batteryLevel'],
  location:                 ['latitude', 'longitude', 'altitude', 'speed', 'bearing'],
};

async function startServer(port) {
  if (httpServer) return;

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.post('/data', (req, res) => {
    const body = req.body;
    if (!body || !Array.isArray(body.payload)) {
      return res.status(400).json({ error: 'invalid payload' });
    }

    const deviceId   = body.deviceId   || 'unknown';
    const sessionId  = body.sessionId  || 'unknown';
    const messageId  = body.messageId  ?? -1;

    // Process each reading in the batch
    const readings = [];
    for (const reading of body.payload) {
      const sensorName = reading.name;
      const timeNs     = reading.time;          // UTC nanoseconds
      const values     = reading.values || {};

      // Discover fields from actual data if not in known list
      const fields = SENSOR_FIELDS[sensorName] || Object.keys(values);

      for (const field of fields) {
        if (values[field] === undefined) continue;
        readings.push({
          deviceId,
          sessionId,
          messageId,
          sensor: sensorName,
          field,
          timeNs,
          value: values[field],
        });
      }
    }

    if (readings.length > 0 && global.onSensorData) {
      global.onSensorData({ deviceId, sessionId, messageId, readings });
    }

    res.status(200).json({ ok: true });
  });

  // Health check for Sensor Logger "Tap to Test"
  app.get('/data', (req, res) => res.status(200).send('OK'));

  await new Promise((resolve, reject) =>
    httpServer = app.listen(port, '0.0.0.0', (err) => err ? reject(err) : resolve())
  );
}

function stopServer() {
  if (httpServer) { httpServer.close(); httpServer = null; }
}

module.exports = { startServer, stopServer };
