'use strict';

const boardService = require('../services/board.service');
const schemas = require('../schemas/board.schemas');

const validate = (schema, source = 'body') => (req, res, next) => {
  const toValidate = req[source];
  const { error } = schema.validate(toValidate);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};


const sanitize = (req, res, next) => {
  const skipFields = ['reply_id', 'thread_id', 'delete_password']; // on ne touche pas à ceux-là
  for (const key in req.body) {
    if (
      typeof req.body[key] === 'string' &&
      !skipFields.includes(key)
    ) {
      req.body[key] = req.body[key].replace(/<[^>]*>?/gm, '');
    }
  }
  next();
};


module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(
        sanitize,
        validate(schemas.createThreadSchema),
        async (req, res) => {
          try {
            await boardService.createThread(
              req.params.board,
              req.body.text,
              req.body.delete_password
            );
            res.redirect(`/b/${req.params.board}/`);
          } catch (error) {
            res.status(500).json({ error: `Server error ${error}` });
          }
        }
      )
    .get(async (req, res) => {
      try {
        const threads = await boardService.getRecentThreads(req.params.board);
        res.json(threads);
      } catch (error) {
        res.status(500).json({ error: `Server error ${error}` });
      }
    })
    .put(
      sanitize,
      validate(schemas.reportThreadSchema),
      async (req, res) => {
        const result = await boardService.reportThread(req.body.thread_id);
        res.send(result);
      }
    )

    .delete(
      sanitize,
      validate(schemas.deleteThreadSchema),
      // validate(schemas.deleteThreadSchema, 'body'),
      async (req, res) => {
        try {
          const success = await boardService.deleteThread(
            req.body.thread_id,
            req.body.delete_password
          );
          res.send(success ? 'success' : 'incorrect password');
        } catch (error) {
          res.status(500).json({ error: `Server error ${error}` });
        }
      }
    );
    
  app.route('/api/replies/:board')
    .post(
        sanitize,
        validate(schemas.createReplySchema),
        async (req, res) => {
          try {
            await boardService.createReply(
              req.body.thread_id,
              req.body.text,
              req.body.delete_password
            );
            res.redirect(`/b/${req.params.board}/${req.body.thread_id}`);
          } catch (error) {
            res.status(500).json({ error: `Server error ${error}` });
          }
        }
      )
    .get(      
      async (req, res) => {
        try {
          const thread = await boardService.getThreadWithReplies(req.query.thread_id);
          res.json(thread);
        } catch (error) {
          res.status(500).json({ error: `Server error ${error}` });
        }
      }
    )
    .put(
      sanitize,
      validate(schemas.reportReplySchema),
      async (req, res) => {
        try {
          const result = await boardService.reportReply(
            req.body.reply_id
          );
          res.send(result);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      }
    )
    .delete(
      sanitize,
      validate(schemas.deleteReplySchema),
      async (req, res) => {
        try {
          const success = await boardService.deleteReply(
            req.body.thread_id, // Ajouté
            req.body.reply_id,
            req.body.delete_password
          );
          res.send(success ? 'success' : 'incorrect password');
        } catch (error) {
          res.status(500).json({ error: `Server error ${error}` });
        }
      }
    )

};
