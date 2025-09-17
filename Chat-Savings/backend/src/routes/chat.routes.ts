import { Router } from 'express';
import { chatService } from '../services/chat.service';

export const chatRouter = Router();

chatRouter.post('/message', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MESSAGE',
          message: 'Message is required',
        },
      });
    }

    const result = await chatService.chat({
      message,
      conversationHistory: conversationHistory || [],
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHAT_ERROR',
        message: 'Failed to process chat request',
      },
    });
  }
}); 