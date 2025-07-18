const Joi = require('joi');

module.exports = {
  createThreadSchema: Joi.object({
    text: Joi.string().required(),
    delete_password: Joi.string().required()
  }),

  deleteThreadSchema: Joi.object({
    thread_id: Joi.string().required(),
    delete_password: Joi.string().required()
  }),

  reportThreadSchema: Joi.object({
    thread_id: Joi.string().required()
  }),

  createReplySchema: Joi.object({
    thread_id: Joi.string().required(),
    text: Joi.string().required(),
    delete_password: Joi.string().required()
  }),
  
  deleteReplySchema: Joi.object({
    thread_id: Joi.string().required(),
    reply_id: Joi.string().required(),
    delete_password: Joi.string().required()
  }),

  reportReplySchema: Joi.object({
    thread_id: Joi.string().required(),
    reply_id: Joi.string().required()
  }),
};