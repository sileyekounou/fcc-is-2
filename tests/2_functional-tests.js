const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Reply = require('../models/Reply')
chai.use(chaiHttp);

suite('Functional Tests', function() {
  let testThreadId;
  let testReplyId;
  const board = 'testboard';
  const delete_password = 'test123';

  // 1. Create new thread + récupération de son ID
  test('POST /api/threads/{board} - Create new thread', function(done) {
    chai.request(server)
      .post(`/api/threads/${board}`)
      .redirects(0)
      .send({ text: 'Test thread', delete_password })
      .end((err, res) => {
        assert.equal(res.status, 302);

        // Maintenant on récupère l’ID via le GET
        chai.request(server)
          .get(`/api/threads/${board}`)
          .end((err2, res2) => {
            assert.equal(res2.status, 200);
            assert.isArray(res2.body);
            testThreadId = res2.body[0]._id;
            done();
          });
      });
  });

  // 2. Get recent threads (juste pour vérifier)
  test('GET /api/threads/{board} - Get recent threads', function(done) {
    chai.request(server)
      .get(`/api/threads/${board}`)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        done();
      });
  });

  // 3. Delete thread with wrong password
  test('DELETE /api/threads/{board} - Incorrect password', function(done) {
    chai.request(server)
      .delete(`/api/threads/${board}`)
      .send({ thread_id: testThreadId, delete_password: 'badpass' })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // Tests (exemple pour deleteThread)
  test('DELETE /api/threads/{board} - Correct password', function(done) {
    chai.request(server)
      .delete(`/api/threads/${board}`)
      .send({
        thread_id: testThreadId,
        delete_password: delete_password
      })
      .end((err, res) => {
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 5. Report thread
  test('PUT /api/threads/{board} - Report thread', function(done) {
    // recréer un thread pour le reporter
    chai.request(server)
      .post(`/api/threads/${board}`)
      .redirects(0)
      .send({ text: 'Thread à report', delete_password })
      .end((err, res) => {
        // récupération ID
        chai.request(server)
          .get(`/api/threads/${board}`)
          .end((err2, res2) => {
            const threadId = res2.body[0]._id;
            // on le reporte
            chai.request(server)
              .put(`/api/threads/${board}`)
              .send({ thread_id: threadId })
              .end((err3, res3) => {
                assert.equal(res3.text, 'reported');
                done();
              });
          });
      });
  });

  // 6. Create reply
  test('POST /api/replies/{board} - Create reply', function(done) {
    // Re-créer un fil pour y répondre
    chai.request(server)
      .post(`/api/threads/${board}`)
      .redirects(0)
      .send({ text: 'Thread pour reply', delete_password })
      .end((err, res) => {
        // récupération ID
        chai.request(server)
          .get(`/api/threads/${board}`)
          .end((err2, res2) => {
            testThreadId = res2.body[0]._id;
            // on poste la reply
            chai.request(server)
              .post(`/api/replies/${board}`)
              .redirects(0)
              .send({ thread_id: testThreadId, text: 'Ma réponse', delete_password })
              .end((err3, res3) => {
                assert.equal(res3.status, 302);
                done();
              });
          });
      });
  });

  // 7. Get thread with replies + récupération du reply_id
  test('GET /api/replies/{board} - Get thread with replies', function(done) {
    chai.request(server)
      .get(`/api/replies/${board}`)
      .query({ thread_id: testThreadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, '_id');
        assert.property(res.body, 'replies');
        assert.isArray(res.body.replies);
        testReplyId = res.body.replies[0]._id;
        done();
      });
  });

  // 8. Delete reply wrong password
  test('DELETE /api/replies/{board} - Incorrect password', function(done) {
    chai.request(server)
      .delete(`/api/replies/${board}`)
      .send({
        thread_id: testThreadId,
        reply_id: testReplyId,
        delete_password: 'badpass'
      })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 9. Delete reply correct password
  test('DELETE /api/replies/{board} - Correct password', function(done) {
    chai.request(server)
      .delete(`/api/replies/${board}`)
      .send({
        thread_id: testThreadId,
        reply_id: testReplyId,
        delete_password: delete_password
      })
      .end((err, res) => {
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 10. Report reply
  // test('PUT /api/replies/{board} - Report reply', function(done) {
  //   chai.request(server)
  //     .put(`/api/replies/${board}`)
  //     .send({
  //       reply_id: testReplyId  // Seul reply_id est requis
  //     })
  //     .end((err, res) => {
  //       assert.equal(res.text, 'reported');
  //       done();
  //     });
  // });
  // test
  // test('PUT /api/replies/{board} - Report reply', function(done) {
  //   // Créer d'abord une réponse à signaler
  //   chai.request(server)
  //     .post(`/api/threads/${board}`)
  //     .send({ text: 'Thread for reply', delete_password })
  //     .end((err, res) => {
  //       chai.request(server)
  //         .get(`/api/threads/${board}`)
  //         .end((err2, res2) => {
  //           const threadId = res2.body[0]._id;
            
  //           // Créer une réponse
  //           chai.request(server)
  //             .post(`/api/replies/${board}`)
  //             .send({ thread_id: threadId, text: 'Test reply', delete_password })
  //             .end((err3, res3) => {
  //               // Récupérer l'ID de la réponse
  //               chai.request(server)
  //                 .get(`/api/replies/${board}`)
  //                 .query({ thread_id: threadId })
  //                 .end((err4, res4) => {
  //                   const replyId = res4.body.replies[0]._id;
                    
  //                   // Signaler la réponse
  //                   chai.request(server)
  //                     .put(`/api/replies/${board}`)
  //                     .send({ reply_id: replyId })
  //                     .end((err5, res5) => {
  //                       assert.equal(res5.text, 'reported');
                        
  //                       // Vérifier que le champ reported est bien true
  //                       chai.request(server)
  //                         .get(`/api/replies/${board}`)
  //                         .query({ thread_id: threadId })
  //                         .end((err6, res6) => {
  //                           assert.equal(res6.body.replies[0].reported, true);
  //                           done();
  //                         });
  //                     });
  //                 });
  //             });
  //         });
  //     });
  // });

  // test('PUT /api/replies/{board} - Report reply', function(done) {
  //   // Créer un thread
  //   chai.request(server)
  //     .post(`/api/threads/${board}`)
  //     .send({ text: 'Thread for reply', delete_password })
  //     .end((err, res) => {
  //       // Récupérer l'ID du thread
  //       chai.request(server)
  //         .get(`/api/threads/${board}`)
  //         .end((err2, res2) => {
  //           const threadId = res2.body[0]._id;
            
  //           // Créer une réponse
  //           chai.request(server)
  //             .post(`/api/replies/${board}`)
  //             .send({ thread_id: threadId, text: 'Test reply', delete_password })
  //             .end((err3, res3) => {
  //               // Récupérer l'ID de la réponse
  //               chai.request(server)
  //                 .get(`/api/replies/${board}`)
  //                 .query({ thread_id: threadId })
  //                 .end((err4, res4) => {
  //                   const replyId = res4.body.replies[0]._id;
                    
  //                   // Signaler la réponse
  //                   chai.request(server)
  //                     .put(`/api/replies/${board}`)
  //                     .send({ reply_id: replyId })
  //                     .end((err5, res5) => {
  //                       assert.equal(res5.text, 'reported');
                        
  //                       // Vérifier le champ reported
  //                       chai.request(server)
  //                         .get(`/api/replies/${board}`)
  //                         .query({ thread_id: threadId })
  //                         .end((err6, res6) => {
  //                           // Vérifier directement dans le modèle Reply
  //                           Reply.findById(replyId, (err, reply) => {
  //                             assert.equal(reply.reported, true);
  //                             done();
  //                           });
  //                         });
  //                     });
  //                 });
  //             });
  //         });
  //     });
  // });

//   test('PUT /api/replies/{board} - Report reply', function(done) {
//   // Créer un thread
//   chai.request(server)
//     .post(`/api/threads/${board}`)
//     .send({ text: 'Thread for reply', delete_password })
//     .end((err, res) => {
//       if (err) return done(err);
      
//       // Récupérer l'ID du thread
//       const threadId = res.body._id || testThreadId; // Utiliser l'ID directement si disponible
      
//       // Créer une réponse
//       chai.request(server)
//         .post(`/api/replies/${board}`)
//         .send({ thread_id: threadId, text: 'Test reply', delete_password })
//         .end((err2, res2) => {
//           if (err2) return done(err2);
          
//           // Récupérer l'ID de la réponse
//           const replyId = res2.body._id;
          
//           // Signaler la réponse
//           chai.request(server)
//             .put(`/api/replies/${board}`)
//             .send({ reply_id: replyId })
//             .end((err3, res3) => {
//               if (err3) return done(err3);
//               assert.equal(res3.text, 'reported');
              
//               // Vérifier dans la base (sans callback)
//               Reply.findById(replyId)
//                 .then(reply => {
//                   assert.equal(reply.reported, true);
//                   done();
//                 })
//                 .catch(err => done(err));
//             });
//         });
//     });
// });

  // test('PUT /api/replies/{board} - Report reply', function(done) {
  //   this.timeout(5000); // Augmentez le timeout
    
  //   // Créer un thread et une réponse
  //   chai.request(server)
  //     .post(`/api/threads/${board}`)
  //     .send({ text: 'Thread for reply', delete_password })
  //     .end((err, res) => {
  //       if (err) return done(err);
  //       const threadId = res.body._id;
        
  //       // Créer une réponse
  //       chai.request(server)
  //         .post(`/api/replies/${board}`)
  //         .send({ thread_id: threadId, text: 'Test reply', delete_password })
  //         .end((err2, res2) => {
  //           if (err2) return done(err2);
  //           const replyId = res2.body._id;
            
  //           // Signaler la réponse
  //           chai.request(server)
  //             .put(`/api/replies/${board}`)
  //             .send({ reply_id: replyId }) // Seul reply_id est envoyé
  //             .end((err3, res3) => {
  //               if (err3) return done(err3);
  //               assert.equal(res3.text, 'reported');
  //               done();
  //             });
  //         });
  //     });
  // });
  test('PUT /api/replies/{board} - Report reply', function(done) {
    this.timeout(5000);
    
    // Créer un thread
    chai.request(server)
      .post(`/api/threads/${board}`)
      .send({ text: 'Thread for reply', delete_password })
      .end((err, res) => {
        if (err) return done(err);
        
        // Récupérer l'ID du thread depuis la liste
        chai.request(server)
          .get(`/api/threads/${board}`)
          .end((err2, res2) => {
            if (err2) return done(err2);
            const threadId = res2.body[0]._id;
            
            // Créer une réponse
            chai.request(server)
              .post(`/api/replies/${board}`)
              .send({ thread_id: threadId, text: 'Test reply', delete_password })
              .end((err3, res3) => {
                if (err3) return done(err3);
                
                // Récupérer l'ID de la réponse depuis le thread
                chai.request(server)
                  .get(`/api/replies/${board}`)
                  .query({ thread_id: threadId })
                  .end((err4, res4) => {
                    if (err4) return done(err4);
                    const replyId = res4.body.replies[0]._id;
                    
                    // Signaler la réponse
                    chai.request(server)
                      .put(`/api/replies/${board}`)
                      .send({
                        thread_id: threadId,
                        reply_id: replyId
                      })
                      .end((err5, res5) => {
                        if (err5) return done(err5);
                        assert.equal(res5.text, 'reported');
                        done();
                      });
                  });
              });
          });
      });
  });
});
