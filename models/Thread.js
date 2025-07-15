const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;


const threadSchema = new mongoose.Schema({
  board: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  created_on: {
    type: Date,
    default: Date.now
  },
  bumped_on: {
    type: Date,
    default: Date.now
  },
  reported: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: true
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reply'
  }]
});

module.exports = mongoose.model('Thread', threadSchema);


threadSchema.pre('save', async function(next) {
  // Ne hash le mot de passe que s'il est modifié ou nouveau
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
threadSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
