# Veli Jože production data model
members: id, email(unique), password_hash/provider_id, display_name, zone, parcel_private, role, approved, created_at
sessions: id, member_id, expires_at
chat_messages: id, room, author_id, body, created_at, deleted_at
announcements: id, title, body, severity, author_id, published_at
events: id, title, description, starts_at, location, author_id
listings: id, member_id, category, title, body, price, status, created_at
reports: id, member_id, category, location, description, status, created_at
moderation_actions: id, moderator_id, target_type, target_id, action, created_at

Rules:
- parcel_private and email are never exposed in public member APIs.
- registration requires approval before member-only community features.
- passwords must only be stored as secure hashes by the selected auth provider.
- all admin/moderator writes require server-side role checks.
- chat moderation keeps an audit record.
