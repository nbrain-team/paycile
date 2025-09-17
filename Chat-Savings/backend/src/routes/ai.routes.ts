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
    
    // Calculate detailed metrics to provide context
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const agents = users.filter(u => u.role === 'agent');
    const clients = users.filter(u => u.role === 'client');
    
    // Calculate agent-specific metrics
    const agentMetrics = agents.map(agent => {
      const agentPolicies = policies.filter(p => p.agentId === agent.id);
      const agentPremium = agentPolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
      return {
        name: `${agent.firstName} ${agent.lastName}`,
        policies: agentPolicies.length,
        premium: agentPremium,
      };
    }).sort((a, b) => b.premium - a.premium);
    
    // Payment method breakdown
    const paymentBreakdown = {
      creditCard: payments.filter(p => p.paymentMethod === 'credit_card').length,
      ach: payments.filter(p => p.paymentMethod === 'ach').length,
      check: payments.filter(p => p.paymentMethod === 'check').length,
      wire: payments.filter(p => p.paymentMethod === 'wire').length,
    };
    
    // Collection rate
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const collectionRate = totalInvoiced > 0 
      ? Math.round((totalRevenue / totalInvoiced) * 100)
      : 0;
    
    const systemPrompt = `You are an AI analytics assistant for Paycile, an insurance premium payment management platform. 
    You have access to the following current data:
    
    FINANCIAL METRICS:
    - Total Revenue: $${totalRevenue.toLocaleString()}
    - Collection Rate: ${collectionRate}%
    - Overdue Amount: $${overdueAmount.toLocaleString()}
    - Total Invoices: ${invoices.length}
    - Average Invoice: $${Math.round(totalInvoiced / invoices.length).toLocaleString()}
    
    OPERATIONAL DATA:
    - Active Policies: ${policies.filter(p => p.status === 'active').length}
    - Total Policies: ${policies.length}
    - Total Payments: ${payments.length}
    - Payment Methods: Credit Card (${paymentBreakdown.creditCard}), ACH (${paymentBreakdown.ach}), Check (${paymentBreakdown.check}), Wire (${paymentBreakdown.wire})
    
    TEAM PERFORMANCE:
    - Total Agents: ${agents.length} (${agents.map(a => a.firstName + ' ' + a.lastName).join(', ')})
    - Top Agent: ${agentMetrics[0]?.name} with ${agentMetrics[0]?.policies} policies and $${agentMetrics[0]?.premium.toLocaleString()} in premiums
    - Agent Rankings by Premium: ${agentMetrics.map((a, i) => `${i+1}. ${a.name}: $${a.premium.toLocaleString()}`).join(', ')}
    
    CLIENT DATA:
    - Total Clients: ${clients.length}
    - Individual Clients: ${clients.filter(c => !c.companyName).length}
    - Business Clients: ${clients.filter(c => c.companyName).length}
    
    Provide insightful, data-driven responses about payment trends, agent performance, client behavior, and actionable recommendations.
    Be specific when referring to agents by name. Focus on the metrics that matter and provide concrete suggestions.`;

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