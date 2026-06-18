# Comments & Mentions

## Purpose
Define the comment system including threaded comments, @mention detection, rich text rendering, and integration with the notification system.

## Responsibilities

- Task-level commenting with nested threading
- @mention detection and user lookup
- Notification generation for mentions
- Edit history tracking
- Soft deletion with thread preservation
- Markdown content rendering

## Data Model

Comments use a self-referencing parent_id for threading. Threading is limited to one level of nesting in the UI. The data model supports arbitrary nesting but the UI collapses beyond depth 1.

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/v1/tasks/:taskId/comments | comment.read | List task comments |
| POST | /api/v1/tasks/:taskId/comments | comment.create | Add comment |
| PATCH | /api/v1/comments/:commentId | comment.update | Edit comment |
| DELETE | /api/v1/comments/:commentId | comment.delete | Soft-delete comment |

## @Mention Detection

**Frontend**: As user types, detect @ followed by text. Query project members: GET /api/v1/projects/:projectId/members?search=ja. Show autocomplete dropdown. On selection, insert [@displayName](user:uuid) markdown.

**Backend**: On comment creation, scan content for [@...](user:uuid) pattern. Extract UUIDs, validate they are project members, store in mentions array column. Generate notifications for each mentioned user.

**Mention notification format**:
```json
{
  "type": "comment.mention",
  "userId": "mentioned-uuid",
  "title": "Jane mentioned you in PROJ-42",
  "body": "@Jane: @John can you review this?",
  "data": {
    "taskId": "task-uuid",
    "taskTitle": "Implement Stripe checkout",
    "projectKey": "PROJ",
    "commentId": "comment-uuid",
    "mentionerName": "Jane Doe"
  }
}
```

## Comment Creation Flow

1. Client POSTs /api/v1/tasks/:taskId/comments with { content, parentId? }
2. Validate content (required, max 50000 chars, sanitized)
3. Parse @mentions from markdown
4. Validate mentioned users are project members
5. Create comment record with mentions array
6. If parentId provided: verify parent exists and is not deleted
7. Emit comment.created event
8. Generate notifications for mentioned users + task watchers
9. Broadcast realtime: comment:added to task room
10. Return comment with author details

## Comment List Response

```json
{
  "success": true,
  "data": [
    {
      "id": "comment-uuid",
      "content": "This is a great point! @[Jane](user:uuid) can you review?",
      "contentHtml": "<p>This is a great point! <a href=\"/user/uuid\">@Jane</a> can you review?</p>",
      "author": { "id": "user-uuid", "displayName": "John Doe", "avatarUrl": null },
      "mentions": ["mentioned-user-uuid"],
      "createdAt": "2025-01-15T10:00:00Z",
      "editedAt": null,
      "isEdited": false,
      "replies": [
        {
          "id": "reply-uuid",
          "content": "Sure, I'll take a look.",
          "author": {},
          "createdAt": "2025-01-15T10:05:00Z",
          "editedAt": null,
          "isEdited": false
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 15 }
}
```

## Markdown Rendering

Supported: bold, italic, strikethrough, inline code, code blocks, lists, links, @mentions, blockquotes. Not supported: images, tables, raw HTML (stripped for XSS prevention).

Markdown rendered to HTML on backend using marked library with DOMPurify sanitization.

## Edit and Delete

**Edit**: Update content, set edited_at, re-parse @mentions (add new, do not remove old), store previous version in activity log. Display (edited) indicator.

**Delete**: Soft delete with deleted_at. Content replaced with [deleted] but comment remains to preserve thread context. Replies to a deleted comment remain visible.

## Security

- HTML sanitization with DOMPurify prevents XSS
- Mention validation: only project members can be mentioned
- Users edit own comments; Project Managers and above edit any
- Users delete own comments; Workspace Admins delete any

## Best Practices

1. Optimistic creation - show comment immediately, reconcile with server
2. Debounce mention autocomplete by 300ms, min 2 chars
3. Cache rendered HTML by comment ID, invalidate on edit
4. New comment banner rather than auto-scrolling
5. Always eager-load author relation with comments

## Future Considerations

- Rich text editor (TipTap/ProseMirror)
- Emoji reactions on comments
- File attachments in comments
- Comment thread subscriptions
- Slack/MS Teams integration for notifications
