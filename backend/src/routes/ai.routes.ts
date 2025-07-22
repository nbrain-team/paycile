import { Router } from 'express';
import OpenAI from 'openai';
import { getMockData } from '../services/mockData.service';

export const aiRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// AI Chat for insurance regulatory questions
aiRouter.post('/chat', async (req, res) => {
  const { message } = req.body;
  
  try {
    const systemPrompt = `You are an AI assistant for Paycile, specialized in insurance premium payment regulations. 
    You provide accurate, helpful information about:
    - State-specific insurance payment regulations
    - Premium collection compliance requirements
    - Payment processing timelines and deadlines
    - Refund and cancellation policies
    - Trust account and escrow requirements
    - Agent commission regulations
    - Client payment rights and protections
    
    Always ask for the state if not provided, as regulations vary by state.
    Provide clear, concise answers and cite relevant regulations when possible.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content || 'I couldn\'t process your request at this time.';

    res.json({
      success: true,
      data: { content: response },
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process AI request',
    });
  }
});

// AI Insights Analytics
aiRouter.post('/insights', async (req, res) => {
  const { query, context } = req.body;
  
  try {
    const { payments, invoices, policies, users, reconciliations } = getMockData();
    
    // Calculate some key metrics to provide context
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const agents = users.filter(u => u.role === 'agent');
    const clients = users.filter(u => u.role === 'client');
    
    const systemPrompt = `You are an AI analytics assistant for Paycile, an insurance premium payment management platform. 
    You have access to the following current data:
    - Total Revenue: $${totalRevenue.toLocaleString()}
    - Active Policies: ${policies.filter(p => p.status === 'active').length}
    - Total Agents: ${agents.length}
    - Total Clients: ${clients.length}
    - Total Payments: ${payments.length}
    - Overdue Amount: $${overdueAmount.toLocaleString()}
    - Payment Methods: Credit Card, ACH, Check, Wire
    
    Provide insightful, data-driven responses about payment trends, agent performance, client behavior, and actionable recommendations.
    Keep responses concise and focused on the metrics that matter.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content || 'I couldn\'t analyze the data at this time.';

    res.json({
      success: true,
      data: { content: response },
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze data',
    });
  }
}); 