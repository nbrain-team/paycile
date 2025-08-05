# React to Angular Migration Plan

## Current Status ✅
- Angular project structure created
- Core configuration complete
- Authentication system converted
- Routing with lazy loading implemented
- Dev server running on port 3000
- API integration configured

## Priority Order for Component Migration

### Phase 1: Core Business Logic (Week 1)
#### High Priority Pages
1. **Policies Page** 
   - List view with filtering/sorting
   - Create/Edit policy forms
   - Policy status management
   
2. **Invoices Page**
   - Invoice listing with status filters
   - Payment modal
   - Invoice details view
   
3. **Payments Page**
   - Payment list with reconciliation status
   - Payment processing
   - Waterfall allocation display

### Phase 2: Detail Views (Week 2)
4. **Policy Detail Page**
   - Policy information display
   - Edit capabilities
   - Related invoices/payments
   
5. **Payment Detail Page**
   - Payment information
   - Waterfall breakdown
   - Edit allocations

6. **Reconciliation Page**
   - Matching interface
   - Dispute handling
   - Manual matching

### Phase 3: Management Pages (Week 3)
7. **Clients Page**
   - Client list with search
   - Client details
   - Associated policies

8. **Agents Page** (Broker only)
   - Agent management
   - Commission tracking
   - Performance metrics

9. **Insurance Companies Page** (Broker only)
   - Company management
   - Waterfall configuration
   - Commission settings

### Phase 4: Analytics & Support (Week 4)
10. **Insights Page**
    - Charts integration (ng2-charts)
    - Performance metrics
    - AI insights section

11. **Chat Page**
    - AI assistant interface
    - Message history
    - WebSocket integration

12. **Settings Page**
    - User preferences
    - System configuration
    - Export/Import features

## Technical Tasks per Component

### For Each Page Component:
1. **Create Angular Component Structure**
   - Component TypeScript file
   - HTML template (convert JSX)
   - Component styles
   - Unit tests

2. **Create Service Layer**
   - API service for data operations
   - State management (signals)
   - Error handling

3. **Implement Forms**
   - Convert to Angular Reactive Forms
   - Add validators
   - Error display

4. **Convert React Hooks to Angular**
   - useState → Angular signals
   - useEffect → ngOnInit/ngAfterViewInit
   - useCallback → class methods
   - useMemo → computed signals

5. **Update Data Models**
   - Create TypeScript interfaces
   - Add type safety
   - Validation rules

## Shared Components to Create

### UI Components
- **DataTable Component**
  - Sorting, filtering, pagination
  - Reusable across all list views

- **Modal Component**
  - Generic modal wrapper
  - Form modals
  - Confirmation dialogs

- **LoadingSpinner Component**
  - Consistent loading states

- **ErrorMessage Component**
  - Standardized error display

### Form Components
- **FormField Component**
  - Input wrapper with labels/errors
  
- **SelectField Component**
  - Dropdown with search

- **DatePicker Component**
  - Date selection with validation

## API Services to Implement

1. **PolicyService**
   - CRUD operations
   - Status updates
   - Filtering/search

2. **InvoiceService**
   - List/create/update
   - Payment processing
   - Status management

3. **PaymentService**
   - Payment operations
   - Waterfall allocations
   - Reconciliation

4. **ClientService**
   - Client management
   - Associated data

5. **AgentService**
   - Agent operations
   - Commission tracking

6. **InsuranceCompanyService**
   - Company management
   - Waterfall configuration

7. **DashboardService**
   - Statistics
   - Charts data

8. **ChatService**
   - WebSocket connection
   - Message handling

## Testing Strategy

### Unit Tests
- Component logic testing
- Service method testing
- Form validation testing

### Integration Tests
- API integration
- Route navigation
- Auth flow

### E2E Tests
- Critical user flows
- Payment processing
- Policy creation

## Migration Checklist

### Before Starting Each Component:
- [ ] Review React component functionality
- [ ] Identify all API calls
- [ ] Document state management needs
- [ ] List all user interactions

### During Migration:
- [ ] Create component structure
- [ ] Implement template/styles
- [ ] Add service layer
- [ ] Implement forms/validation
- [ ] Add error handling
- [ ] Test functionality

### After Migration:
- [ ] Unit tests passing
- [ ] Manual testing complete
- [ ] Performance check
- [ ] Code review

## Risk Mitigation

### Potential Issues:
1. **State Management Complexity**
   - Solution: Use Angular signals for simple state
   - Consider NgRx for complex state if needed

2. **Form Complexity**
   - Solution: Build reusable form components
   - Use Angular Form Builder patterns

3. **Performance**
   - Solution: Implement OnPush change detection
   - Use lazy loading consistently

4. **Third-party Libraries**
   - Chart.js → ng2-charts ✅
   - React Query → Angular HttpClient + RxJS
   - React Hook Form → Angular Reactive Forms
   - Zustand → Angular Signals

## Success Metrics

- All pages functional
- API integration complete
- Authentication working
- Performance comparable to React version
- All tests passing
- No console errors
- Responsive design maintained

## Timeline Estimate

**Total: 4 weeks for full migration**
- Week 1: Core business pages
- Week 2: Detail views
- Week 3: Management pages  
- Week 4: Analytics, testing, polish

## Next Immediate Steps

1. Start with Policies page (most complex)
2. Create reusable DataTable component
3. Implement PolicyService
4. Test end-to-end flow
5. Move to Invoices page 