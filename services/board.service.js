const Thread = require('../models/Thread');
const Reply = require('../models/Reply');
const bcrypt = require('bcrypt');

const saltRounds = 10;

module.exports = {
  // Thread operations
  createThread: async (board, text, password) => {
    const hashed = await bcrypt.hash(password, saltRounds);
    return new Thread({ board, text, password: hashed }).save();
  },

  getRecentThreads: async (board) => {
    return Thread.find({ board })
      .sort('-bumped_on')
      .limit(10)
      .populate({
        path: 'replies',
        options: { sort: { created_on: -1 }, limit: 3 },
        select: '-reported -password'
      })
      .select('-reported -password')
      .lean();
  },

  reportThread: async (thread_id) => {
    return Thread.findByIdAndUpdate(thread_id, { reported: true }, { new: true });
  },

  deleteThread: async (thread_id, password) => {
    const thread = await Thread.findById(thread_id);
    if (!thread) return false;
    
    const match = await bcrypt.compare(password, thread.password);
    if (!match) return false;
    
    await Reply.deleteMany({ _id: { $in: thread.replies } });
    await Thread.findByIdAndDelete(thread_id);
    return true;
  },

  // Reply operations
  createReply: async (thread_id, text, password) => {
    const hashed = await bcrypt.hash(password, saltRounds);
    const reply = new Reply({ text, thread: thread_id, password: hashed });
    await reply.save();

    await Thread.findByIdAndUpdate(
      thread_id,
      { $push: { replies: reply._id }, bumped_on: Date.now() },
      { new: true }
    );

    return reply;
  },

  getThreadWithReplies: async (thread_id) => {
    return Thread.findById(thread_id)
      .populate({
        path: 'replies',
        select: '-reported -password'
      })
      .select('-reported -password')
      .lean();
  },

  reportReply: async (reply_id) => {
    return Reply.findByIdAndUpdate(reply_id, { reported: true }, { new: true });
  },

  deleteReply: async (reply_id, password) => {
    const reply = await Reply.findById(reply_id);
    if (!reply) return false;
    
    const match = await bcrypt.compare(password, reply.password);
    if (!match) return false;
    
    reply.text = '[deleted]';
    await reply.save();
    return true;
  }
};