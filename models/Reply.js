const mongoose = require('mongoose');

// reply.model.js
const replySchema = new mongoose.Schema({
  text: String,
  created_on: Date,
  reported: { 
    type: Boolean, 
    default: false
  },
  delete_password: String,
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread'
  }
});

module.exports = mongoose.model('Reply', replySchema);
