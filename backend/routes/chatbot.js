
const express = require('express');
const router = express.Router();
const { runChat } = require('../ai/gemini');

router.post('/', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).send({ error: 'A "prompt" is required in the request body.' });
    }

    try {
        const responseText = await runChat(prompt);
        res.json({ response: responseText });
    } catch (error) {
        console.error('Error in chatbot route:', error);
        res.status(500).send({ error: 'Failed to get a response from the AI.' });
    }
});

module.exports = router;
