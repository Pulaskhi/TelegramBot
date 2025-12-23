const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventos/eventosController');

router.get('/ejemplo', eventosController.ejemplo);

module.exports = router;
