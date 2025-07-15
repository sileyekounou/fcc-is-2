const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let testThreadId;
  let testReplyId;
  const board = 'testboard';
  const password = 'test123';

  // 1. Create new thread + récupération de son ID
  test('POST /api/threads/{board} - Create new thread', function(done) {
    chai.request(server)
      .post(`/api/threads/${board}`)
      .redirects(0)
      .send({ text: 'Test thread', password })
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
      .send({ thread_id: testThreadId, password: 'badpass' })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 4. Delete thread with correct password
  test('DELETE /api/threads/{board} - Correct password', function(done) {
    chai.request(server)
      .delete(`/api/threads/${board}`)
      .send({ thread_id: testThreadId, password })
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
      .send({ text: 'Thread à report', password })
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
      .send({ text: 'Thread pour reply', password })
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
              .send({ thread_id: testThreadId, text: 'Ma réponse', password })
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
      .query({ thread_id: testThreadId })   // use query, not send
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
      .send({ reply_id: testReplyId, password: 'badpass' })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 9. Delete reply correct password
  test('DELETE /api/replies/{board} - Correct password', function(done) {
    chai.request(server)
      .delete(`/api/replies/${board}`)
      .send({ reply_id: testReplyId, password })
      .end((err, res) => {
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 10. Report reply
  test('PUT /api/replies/{board} - Report reply', function(done) {
    chai.request(server)
      .put(`/api/replies/${board}`)
      .send({ reply_id: testReplyId })
      .end((err, res) => {
        assert.equal(res.text, 'reported');
        done();
      });
  });
});
