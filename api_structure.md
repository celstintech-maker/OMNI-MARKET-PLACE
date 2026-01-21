
# Omni Marketplace API Structure

## Auth
- `POST /api/auth/register` - New user/seller signup
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current session user

## Marketplace
- `GET /api/products` - List all products (supports filters: `category`, `seller_id`)
- `GET /api/stores` - List all active stores
- `GET /api/stores/:id` - Get store details & products

## Seller Dashboard (Auth Required: Seller)
- `POST /api/seller/products` - Add new product
- `PUT /api/seller/products/:id` - Update product
- `DELETE /api/seller/products/:id` - Remove product
- `GET /api/seller/analytics` - Get sales & traffic data

## Admin Panel (Auth Required: Admin)
- `GET /api/admin/vendors` - List all vendors
- `PATCH /api/admin/vendors/:id/status` - Suspend/Activate vendor
- `DELETE /api/admin/vendors/:id` - Remove vendor and store

## Real-time Chat (WebSockets/Socket.io)
- `emit('send_message', { recipient_id, text })`
- `on('receive_message', (msg) => { ... })`
