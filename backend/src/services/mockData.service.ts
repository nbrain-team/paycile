import { v4 as uuidv4 } from 'uuid';

// Helper functions
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Mock data arrays
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'Robert', 'Emily', 'David', 'Lisa', 'James', 'Mary'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const companies = ['ABC Corp', 'XYZ Industries', 'Acme Inc', 'Global Solutions', 'Tech Innovations', 'Prime Services'];
const policyTypes = ['General Liability', 'Professional Liability', 'Property Insurance', 'Auto Insurance', 'Workers Compensation', 'Cyber Insurance'];
const paymentMethods = ['ach', 'credit_card', 'check', 'wire'];
const insuranceCompanies = [
  { id: uuidv4(), name: 'Shield Insurance Group', code: 'SHIELD' },
  { id: uuidv4(), name: 'Premier Coverage LLC', code: 'PREMIER' },
  { id: uuidv4(), name: 'Secure Protection Co', code: 'SECURE' },
];

// Generate mock users
export const generateMockUsers = () => {
  const users = [];
  
  // Add some agents
  for (let i = 0; i < 5; i++) {
    users.push({
      id: uuidv4(),
      email: `agent${i + 1}@paycile.com`,
      firstName: randomElement(firstNames),
      lastName: randomElement(lastNames),
      role: 'agent',
      phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      companyName: 'Paycile Insurance Agency',
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: randomDate(new Date(2023, 0, 1), new Date()),
      updatedAt: new Date(),
    });
  }
  
  // Add clients
  for (let i = 0; i < 50; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    users.push({
      id: uuidv4(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      firstName,
      lastName,
      role: 'client',
      phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      companyName: Math.random() > 0.5 ? randomElement(companies) : null,
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: randomDate(new Date(2022, 0, 1), new Date()),
      updatedAt: new Date(),
    });
  }
  
  return users;
};

// Generate mock policies
export const generateMockPolicies = (users: any[]) => {
  const policies = [];
  const clients = users.filter(u => u.role === 'client');
  const agents = users.filter(u => u.role === 'agent');
  
  for (let i = 0; i < 100; i++) {
    const client = randomElement(clients);
    const agent = randomElement(agents);
    const effectiveDate = randomDate(new Date(2023, 0, 1), new Date());
    const expirationDate = new Date(effectiveDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    
    policies.push({
      id: uuidv4(),
      policyNumber: `POL-2024-${String(i + 1).padStart(5, '0')}`,
      clientId: client.id,
      client,
      agentId: agent.id,
      agent,
      insuranceCompanyId: randomElement(insuranceCompanies).id,
      insuranceCompany: randomElement(insuranceCompanies),
      policyType: randomElement(policyTypes),
      premiumAmount: Math.floor(Math.random() * 10000) + 1000,
      paymentFrequency: randomElement(['monthly', 'quarterly', 'semi-annual', 'annual']),
      effectiveDate,
      expirationDate,
      status: randomElement(['active', 'active', 'active', 'pending', 'expired']),
      createdAt: effectiveDate,
      updatedAt: new Date(),
    });
  }
  
  return policies;
};

// Generate mock invoices
export const generateMockInvoices = (policies: any[]) => {
  const invoices = [];
  const today = new Date();
  
  policies.forEach((policy, index) => {
    const invoiceCount = policy.paymentFrequency === 'monthly' ? 12 : 
                        policy.paymentFrequency === 'quarterly' ? 4 :
                        policy.paymentFrequency === 'semi-annual' ? 2 : 1;
    
    for (let i = 0; i < invoiceCount; i++) {
      const billingPeriodStart = new Date(policy.effectiveDate);
      if (policy.paymentFrequency === 'monthly') {
        billingPeriodStart.setMonth(billingPeriodStart.getMonth() + i);
      } else if (policy.paymentFrequency === 'quarterly') {
        billingPeriodStart.setMonth(billingPeriodStart.getMonth() + (i * 3));
      } else if (policy.paymentFrequency === 'semi-annual') {
        billingPeriodStart.setMonth(billingPeriodStart.getMonth() + (i * 6));
      }
      
      const billingPeriodEnd = new Date(billingPeriodStart);
      if (policy.paymentFrequency === 'monthly') {
        billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);
      } else if (policy.paymentFrequency === 'quarterly') {
        billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 3);
      } else if (policy.paymentFrequency === 'semi-annual') {
        billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 6);
      } else {
        billingPeriodEnd.setFullYear(billingPeriodEnd.getFullYear() + 1);
      }
      
      const dueDate = new Date(billingPeriodStart);
      dueDate.setDate(dueDate.getDate() + 30);
      
      let status = 'sent';
      if (dueDate < today) {
        status = Math.random() > 0.3 ? 'paid' : Math.random() > 0.5 ? 'overdue' : 'partially_paid';
      }
      
      const invoiceAmount = policy.paymentFrequency === 'annual' ? policy.premiumAmount :
                           policy.premiumAmount / invoiceCount;
      
      invoices.push({
        id: uuidv4(),
        invoiceNumber: `INV-2024-${String(invoices.length + 1).padStart(6, '0')}`,
        policyId: policy.id,
        policy,
        clientId: policy.clientId,
        client: policy.client,
        amount: Math.round(invoiceAmount * 100) / 100,
        dueDate,
        status,
        billingPeriodStart,
        billingPeriodEnd,
        notes: status === 'overdue' ? 'Payment reminder sent' : null,
        createdAt: billingPeriodStart,
        updatedAt: new Date(),
      });
    }
  });
  
  return invoices;
};

// Generate mock payments
export const generateMockPayments = (invoices: any[]) => {
  const payments = [];
  const paidInvoices = invoices.filter(inv => ['paid', 'partially_paid'].includes(inv.status));
  
  paidInvoices.forEach(invoice => {
    const paymentAmount = invoice.status === 'partially_paid' ? 
                         invoice.amount * (0.3 + Math.random() * 0.4) : 
                         invoice.amount;
    
    payments.push({
      id: uuidv4(),
      paymentReference: `PAY-2024-${String(payments.length + 1).padStart(6, '0')}`,
      clientId: invoice.clientId,
      client: invoice.client,
      amount: Math.round(paymentAmount * 100) / 100,
      paymentMethod: randomElement(paymentMethods),
      status: 'completed',
      paymentDate: randomDate(invoice.billingPeriodStart, invoice.dueDate),
      processorReference: `STRIPE-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
  
  // Add some unmatched payments
  for (let i = 0; i < 10; i++) {
    const randomInvoice = randomElement(invoices);
    payments.push({
      id: uuidv4(),
      paymentReference: `PAY-2024-${String(payments.length + 1).padStart(6, '0')}`,
      clientId: randomInvoice.clientId,
      client: randomInvoice.client,
      amount: Math.round((Math.random() * 5000 + 500) * 100) / 100,
      paymentMethod: randomElement(paymentMethods),
      status: randomElement(['completed', 'pending', 'failed']),
      paymentDate: randomDate(new Date(2024, 0, 1), new Date()),
      processorReference: `STRIPE-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  return payments;
};

// Generate mock reconciliations
export const generateMockReconciliations = (payments: any[], invoices: any[]) => {
  const reconciliations = [];
  
  payments.forEach(payment => {
    const matchingInvoices = invoices.filter(inv => 
      inv.clientId === payment.clientId && 
      Math.abs(inv.amount - payment.amount) < 10
    );
    
    const status = matchingInvoices.length > 0 ? 
                  randomElement(['matched', 'matched', 'matched', 'disputed']) : 
                  'unmatched';
    
    const invoice = matchingInvoices.length > 0 ? randomElement(matchingInvoices) : null;
    
    reconciliations.push({
      id: uuidv4(),
      paymentId: payment.id,
      payment,
      invoiceId: invoice?.id || null,
      invoice,
      status,
      confidenceScore: status === 'matched' ? 0.85 + Math.random() * 0.15 : 
                      status === 'disputed' ? 0.4 + Math.random() * 0.3 :
                      0.2 + Math.random() * 0.3,
      aiSuggestions: status === 'unmatched' ? {
        suggestedMatches: matchingInvoices.slice(0, 3).map(inv => ({
          invoiceId: inv.id,
          confidence: 0.5 + Math.random() * 0.4,
          reason: `Amount difference: $${Math.abs(inv.amount - payment.amount).toFixed(2)}`
        })),
        anomalies: ['Payment amount does not match any invoice']
      } : null,
      manualNotes: status === 'disputed' ? 'Client claims payment was for different invoice' : null,
      reconciledBy: status === 'matched' ? 'AI' : null,
      reconciledAt: status === 'matched' ? new Date() : null,
      createdAt: payment.createdAt,
      updatedAt: new Date(),
    });
  });
  
  return reconciliations;
};

// Main mock data generator
export const generateAllMockData = () => {
  const users = generateMockUsers();
  const policies = generateMockPolicies(users);
  const invoices = generateMockInvoices(policies);
  const payments = generateMockPayments(invoices);
  const reconciliations = generateMockReconciliations(payments, invoices);
  
  return {
    users,
    policies,
    invoices,
    payments,
    reconciliations,
    insuranceCompanies,
  };
};

// Store mock data in memory
let mockData: any = null;

export const getMockData = () => {
  if (!mockData) {
    mockData = generateAllMockData();
  }
  return mockData;
}; 