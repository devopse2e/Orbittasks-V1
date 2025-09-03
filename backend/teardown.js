const mongoose = require('mongoose');

module.exports = async function () {
  // Force disconnect if any connection is open
  if (mongoose.connections && mongoose.connections.length > 0) {
    await Promise.all(mongoose.connections.map(conn => conn.close()));
    console.log('Force-closed all MongoDB connections in teardown');
  } else if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB in teardown');
  }

  // Grace period for other async ops
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};
