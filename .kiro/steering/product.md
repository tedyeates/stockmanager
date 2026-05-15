# Product Overview

PC Elemac Stock Management System — an inventory management application for tracking stock items, inbound receipts (instock), and outbound withdrawals (outstock).

## Core Domain

- **Items**: Stock-keeping units with SKU codes, pricing (min/max/sum), quantities, groups, and brands
- **Instock**: Records of items received into inventory (invoices, suppliers, purchase orders, jobs)
- **Outstock**: Records of items withdrawn from inventory (requesters, departments, customers, jobs)
- **Groups**: Categories for organizing items
- **Customers**: External entities associated with outstock transactions

## Key Business Rules

- Outstock quantity cannot exceed available item quantity
- Item pricing aggregates (min, max, sum) are recalculated on instock changes
- Item quantity is automatically adjusted on instock/outstock creation and updates
- All stock operations use database transactions for consistency
- Token-based authentication is required for API access
