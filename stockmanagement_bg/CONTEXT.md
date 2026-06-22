# PC Elemac Stock Management — Backend

Inventory management system for tracking stock items through inbound receipts and outbound withdrawals.

## Language

**Item**: A distinct stock-keeping unit identified by a unique code. Tracks quantity, price history, and group membership.
_Avoid_: Product, SKU record

**Instock**: A single inbound receipt event — one item, one quantity, one price. Updates the item's quantity and price aggregates.
_Avoid_: Receipt, purchase, intake

**Outstock**: A single outbound withdrawal event — one item, one quantity, one requester. Decrements item quantity and snapshots remaining.
_Avoid_: Withdrawal, dispatch, issue

**Group**: A classification category for items (e.g., "Metal", "Electrical").
_Avoid_: Category, type

**Job**: An external reference to a customer project. Unmanaged — sourced from an external system.
_Avoid_: Project, work order

**Customer**: An external entity linked to jobs. Unmanaged — sourced from an external system.
_Avoid_: Client, account

**Store Type**: The physical storage classification of a stock event (metal, accessory, machine, service).
_Avoid_: Warehouse, location

**Remaining Quantity**: The snapshot of item quantity captured at the moment an outstock is created.
_Avoid_: Balance, stock level
