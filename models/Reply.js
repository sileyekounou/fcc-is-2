const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({

  
  text: {
    type: String,
    required: true
  },
  created_on: {
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
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    required: true
  }
});

module.exports = mongoose.model('Reply', replySchema);

replySchema.pre('save', async function(next) {
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
replySchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};