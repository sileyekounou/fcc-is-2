const Thread = require('../models/Thread');
const Reply = require('../models/Reply');
const bcrypt = require('bcrypt');

const saltRounds = 10;

module.exports = {
  // Thread operations
  createThread: async (board, text, delete_password) => {
    const hashed = await bcrypt.hash(delete_password, saltRounds);
    return new Thread({ board, text, delete_password: hashed }).save();
  },

  getRecentThreads: async (board) => {
    return await Thread.find({ board })
      .sort('-bumped_on')
      .limit(10)
      .populate({
        path: 'replies',
        options: { sort: { created_on: -1 }, limit: 3 },
        select: '-reported -delete_password'
      })
      .select('-reported -delete_password')
      .lean();
  },

  reportThread: async (thread_id) => {
    await Thread.findByIdAndUpdate(
      thread_id,
      { reported: true },
      { new: true }
    );
    return 'reported';
  },

  deleteThread: async (thread_id, delete_password) => {
    const thread = await Thread.findById(thread_id);
    if (!thread) return false;
    
    const match = await bcrypt.compare(delete_password, thread.delete_password);
    if (!match) return false;
    
    await Reply.deleteMany({ _id: { $in: thread.replies } });
    await Thread.findByIdAndDelete(thread_id);
    return true;
  },
 
  createReply: async (thread_id, text, delete_password) => {
    try {
      const hashed = await bcrypt.hash(delete_password, saltRounds);
      
      // Vérifier que le thread existe
      const thread = await Thread.findById(thread_id);
      if (!thread) throw new Error('Thread not found');
      
      // Créer la réponse dans la collection Reply
      const reply = new Reply({
        text,
        thread: thread_id,
        delete_password: hashed
      });
      await reply.save();
      
      // Mettre à jour le thread
      thread.replies.push(reply._id);
      thread.bumped_on = new Date();
      await thread.save();
      
      return reply;
    } catch (error) {
      throw new Error(`Error creating reply: ${error.message}`);
    }
  },

  
  getThreadWithReplies: async (thread_id) => {
    return await Thread.findById(thread_id)
      .populate({
        path: 'replies',
        select: '-reported -delete_password',
        options: { sort: { created_on: 1 }}
    })
      .select('-reported -delete_password')
      .lean();
  },
  
  reportReply: async (reply_id) => {
    try {
      await Reply.findByIdAndUpdate(
        reply_id,
        { reported: true },
        { new: true }
      );
      return 'reported';
    } catch (error) {
      throw new Error(`Error reporting reply: ${error.message}`);
    }
  },

  // board.service.js
  deleteReply: async (thread_id, reply_id, delete_password) => {
    try {
      const reply = await Reply.findById(reply_id);
      if (!reply) return false;
      
      // Vérifier que la réponse appartient au thread
      if (reply.thread.toString() !== thread_id) {
        return false;
      }
      
      // Vérifier le mot de passe
      const match = await bcrypt.compare(delete_password, reply.delete_password);
      if (!match) return false;
      
      // Mettre à jour la réponse
      reply.text = '[deleted]';
      await reply.save();
      
      // Mettre à jour le thread parent
      await Thread.findByIdAndUpdate(
        thread_id,
        { bumped_on: new Date() },
        { new: true }
      );
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting reply: ${error.message}`);
    }
  }
};