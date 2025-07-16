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

// Generate invoice line items
const generateInvoiceLineItems = (basePremium: number, policyType: string, isFirstInvoice: boolean = false) => {
  const lineItems = [];
  
  // Base Premium
  lineItems.push({
    id: uuidv4(),
    description: `${policyType} Premium`,
    type: 'premium',
    amount: basePremium,
    taxable: true,
  });
  
  // State taxes (varies by state, typically 2-5%)
  const stateTaxRate = 0.02 + Math.random() * 0.03;
  const stateTax = Math.round(basePremium * stateTaxRate * 100) / 100;
  lineItems.push({
    id: uuidv4(),
    description: 'State Premium Tax',
    type: 'tax',
    amount: stateTax,
    taxable: false,
  });
  
  // Policy fee (one-time or recurring)
  const policyFee = isFirstInvoice ? 25 : 5;
  lineItems.push({
    id: uuidv4(),
    description: isFirstInvoice ? 'Policy Issuance Fee' : 'Policy Service Fee',
    type: 'fee',
    amount: policyFee,
    taxable: false,
  });
  
  // Catastrophe Assessment Fee (common in certain states)
  if (Math.random() > 0.5) {
    const catFee = Math.round(basePremium * 0.01 * 100) / 100;
    lineItems.push({
      id: uuidv4(),
      description: 'Catastrophe Assessment Fee',
      type: 'fee',
      amount: catFee,
      taxable: false,
    });
  }
  
  // Fire Marshal Tax (for property insurance)
  if (policyType.includes('Property') && Math.random() > 0.3) {
    const fireMarshalTax = Math.round(basePremium * 0.0075 * 100) / 100;
    lineItems.push({
      id: uuidv4(),
      description: 'Fire Marshal Tax',
      type: 'tax',
      amount: fireMarshalTax,
      taxable: false,
    });
  }
  
  // Municipal Tax (varies by location)
  if (Math.random() > 0.6) {
    const municipalTax = Math.round(basePremium * 0.005 * 100) / 100;
    lineItems.push({
      id: uuidv4(),
      description: 'Municipal Tax',
      type: 'tax',
      amount: municipalTax,
      taxable: false,
    });
  }
  
  // Electronic Filing Fee
  if (Math.random() > 0.7) {
    lineItems.push({
      id: uuidv4(),
      description: 'Electronic Filing Fee',
      type: 'fee',
      amount: 2.50,
      taxable: false,
    });
  }
  
  // Installment Fee (for non-annual payments)
  if (Math.random() > 0.4 && !isFirstInvoice) {
    lineItems.push({
      id: uuidv4(),
      description: 'Installment Processing Fee',
      type: 'fee',
      amount: 3.00,
      taxable: false,
    });
  }
  
  // FIGA (Financial Insurance Guaranty Association) Assessment
  if (Math.random() > 0.5) {
    const figaFee = Math.round(basePremium * 0.002 * 100) / 100;
    lineItems.push({
      id: uuidv4(),
      description: 'FIGA Assessment',
      type: 'fee',
      amount: figaFee,
      taxable: false,
    });
  }
  
  // Broker Fee (if applicable)
  if (Math.random() > 0.6) {
    lineItems.push({
      id: uuidv4(),
      description: 'Broker Service Fee',
      type: 'fee',
      amount: 15.00,
      taxable: false,
    });
  }
  
  // Calculate subtotal and total
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const total = Math.round(subtotal * 100) / 100;
  
  return {
    lineItems,
    subtotal,
    total,
  };
};

// Generate mock users
export const generateMockUsers = () => {
  const users = [];
  
  // Add admin user
  users.push({
    id: uuidv4(),
    email: 'danny@nbrain.ai',
    firstName: 'Danny',
    lastName: 'Admin',
    role: 'admin',
    phone: '555-000-0001',
    companyName: 'Paycile Admin',
    isActive: true,
    emailVerified: true,
    twoFactorEnabled: true,
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date(),
  });
  
  // Add brokers
  const brokerIds = [];
  for (let i = 0; i < 3; i++) {
    const brokerId = uuidv4();
    brokerIds.push(brokerId);
    users.push({
      id: brokerId,
      email: `broker${i + 1}@paycile.com`,
      firstName: randomElement(firstNames),
      lastName: randomElement(lastNames),
      role: 'broker',
      phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      companyName: `${randomElement(['Premier', 'Elite', 'Professional'])} Insurance Brokers`,
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: true,
      createdAt: randomDate(new Date(2022, 0, 1), new Date(2023, 0, 1)),
      updatedAt: new Date(),
    });
  }
  
  // Add exactly 5 agents with specific demo accounts
  const agentData = [
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@paycile.com' },
    { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@paycile.com' },
    { firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@paycile.com' },
    { firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@paycile.com' },
    { firstName: 'Robert', lastName: 'Wilson', email: 'robert.wilson@paycile.com' },
  ];
  
  const agentIds = [];
  agentData.forEach((agent, i) => {
    const agentId = uuidv4();
    agentIds.push(agentId);
    users.push({
      id: agentId,
      email: agent.email,
      firstName: agent.firstName,
      lastName: agent.lastName,
      role: 'agent',
      brokerId: randomElement(brokerIds), // Assign agent to a broker
      phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      companyName: 'Paycile Insurance Agency',
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: randomDate(new Date(2023, 0, 1), new Date()),
      updatedAt: new Date(),
    });
  });
  
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

// Generate insurance companies with payment waterfall configuration
export const generateInsuranceCompanies = (brokerIds: string[]) => {
  const companies = [];
  const companyNames = [
    { name: 'Shield Insurance Group', code: 'SHIELD' },
    { name: 'Premier Coverage LLC', code: 'PREMIER' },
    { name: 'Secure Protection Co', code: 'SECURE' },
    { name: 'Guardian Insurance Inc', code: 'GUARDIAN' },
    { name: 'Atlas Coverage Solutions', code: 'ATLAS' },
    { name: 'Horizon Insurance Partners', code: 'HORIZON' },
    { name: 'Summit Risk Management', code: 'SUMMIT' },
  ];
  
  const lineItemTypes = ['premium', 'tax', 'fee'];
  
  companyNames.forEach((company, index) => {
    let waterfall;
    
    // Different waterfall configurations
    if (index === 0) {
      // Standard: Premium → Tax → Fee
      waterfall = [
        { id: uuidv4(), type: 'premium', priority: 1, description: 'Base Premium' },
        { id: uuidv4(), type: 'tax', priority: 2, description: 'State & Municipal Taxes' },
        { id: uuidv4(), type: 'fee', priority: 3, description: 'Policy & Service Fees' },
      ];
    } else if (index === 1 || index === 3) {
      // Tax-first: Tax → Premium → Fee
      waterfall = [
        { id: uuidv4(), type: 'tax', priority: 1, description: 'State & Municipal Taxes' },
        { id: uuidv4(), type: 'premium', priority: 2, description: 'Base Premium' },
        { id: uuidv4(), type: 'fee', priority: 3, description: 'Policy & Service Fees' },
      ];
    } else if (index === 2 || index === 5) {
      // Fee-first: Fee → Premium → Tax
      waterfall = [
        { id: uuidv4(), type: 'fee', priority: 1, description: 'Policy & Service Fees' },
        { id: uuidv4(), type: 'premium', priority: 2, description: 'Base Premium' },
        { id: uuidv4(), type: 'tax', priority: 3, description: 'State & Municipal Taxes' },
      ];
    } else if (index === 4) {
      // Premium-Fee-Tax: Premium → Fee → Tax
      waterfall = [
        { id: uuidv4(), type: 'premium', priority: 1, description: 'Base Premium' },
        { id: uuidv4(), type: 'fee', priority: 2, description: 'Policy & Service Fees' },
        { id: uuidv4(), type: 'tax', priority: 3, description: 'State & Municipal Taxes' },
      ];
    } else {
      // Tax-Fee-Premium: Tax → Fee → Premium
      waterfall = [
        { id: uuidv4(), type: 'tax', priority: 1, description: 'State & Municipal Taxes' },
        { id: uuidv4(), type: 'fee', priority: 2, description: 'Policy & Service Fees' },
        { id: uuidv4(), type: 'premium', priority: 3, description: 'Base Premium' },
      ];
    }
    
    companies.push({
      id: uuidv4(),
      ...company,
      brokerId: randomElement(brokerIds),
      contactEmail: `contact@${company.code.toLowerCase()}.com`,
      contactPhone: `1-800-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      address: {
        street: `${Math.floor(Math.random() * 9000) + 1000} ${randomElement(['Main', 'Oak', 'Elm', 'Market', 'Broadway'])} Street`,
        city: randomElement(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']),
        state: randomElement(['NY', 'CA', 'IL', 'TX', 'AZ']),
        zip: String(Math.floor(Math.random() * 90000) + 10000),
      },
      paymentWaterfall: waterfall,
      commissionRate: 0.10 + Math.random() * 0.05, // 10-15% commission
      claimsEmail: `claims@${company.code.toLowerCase()}.com`,
      claimsPhone: `1-800-${Math.floor(Math.random() * 900) + 100}-CLAIM`,
      policyTypes: randomElement([
        ['General Liability', 'Professional Liability'],
        ['Property Insurance', 'Auto Insurance'],
        ['Workers Compensation', 'Cyber Insurance'],
        ['General Liability', 'Property Insurance', 'Auto Insurance'],
      ]),
      isActive: true,
      createdAt: randomDate(new Date(2020, 0, 1), new Date(2022, 0, 1)),
      updatedAt: new Date(),
    });
  });
  
  return companies;
};

// Generate mock policies
export const generateMockPolicies = (users: any[], insuranceCompanies: any[]) => {
  const policies = [];
  const clients = users.filter(u => u.role === 'client');
  const agents = users.filter(u => u.role === 'agent');
  
  for (let i = 0; i < 100; i++) {
    const client = randomElement(clients);
    const agent = randomElement(agents);
    const insuranceCompany = randomElement(insuranceCompanies);
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
      insuranceCompanyId: insuranceCompany.id,
      insuranceCompany,
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
      
      const basePremium = policy.paymentFrequency === 'annual' ? policy.premiumAmount :
                          policy.premiumAmount / invoiceCount;
      
      // Generate line items
      const { lineItems, subtotal, total } = generateInvoiceLineItems(
        basePremium, 
        policy.policyType,
        i === 0 // First invoice gets additional fees
      );
      
      invoices.push({
        id: uuidv4(),
        invoiceNumber: `INV-2024-${String(invoices.length + 1).padStart(6, '0')}`,
        policyId: policy.id,
        policy,
        clientId: policy.clientId,
        client: policy.client,
        basePremium: Math.round(basePremium * 100) / 100,
        amount: total,
        lineItems,
        subtotal,
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
  const insuranceCompanies = generateInsuranceCompanies(users.filter(u => u.role === 'broker').map(u => u.id));
  const policies = generateMockPolicies(users, insuranceCompanies);
  const invoices = generateMockInvoices(policies);
  const payments = generateMockPayments(invoices);
  const reconciliations = generateMockReconciliations(payments, invoices);
  
  return {
    users,
    insuranceCompanies,
    policies,
    invoices,
    payments,
    reconciliations,
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