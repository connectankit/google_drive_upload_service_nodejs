const express = require('express')
const app = express()
const controller = require("../contoller/auth")
const router = express.Router()

router.post('/upload', controller.uploadDocuments)
router.post('/fetchDocument', controller.sendFileToClient)

module.exports = router