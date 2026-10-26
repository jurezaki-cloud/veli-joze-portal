export type UnreadMessage = {
  id: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
};
export type MessageSummary = { ownId: string; unread: number; latest: UnreadMessage[] };
export type MessageAlert = { title: string; href: string; messageIds: string[] };

// Lives only in the mounted application: navigation and polling do not repeat alerts.
// No private message text or account information is persisted in browser storage.
export class MessageAlertTracker {
  private owner = "";
  private seen = new Set<string>();

  reset() { this.owner = ""; this.seen.clear(); }

  consume(summary: MessageSummary, activePeer = ""): MessageAlert | null {
    const initial = this.owner !== summary.ownId;
    if (initial) { this.reset(); this.owner = summary.ownId; }
    const incoming = summary.latest.filter(message => !this.seen.has(message.id));
    for (const message of summary.latest) this.seen.add(message.id);
    // Bound memory for long running tabs. Keep the current unread sample remembered.
    if (this.seen.size > 5000) this.seen = new Set(summary.latest.map(message => message.id));
    const outsideConversation = incoming.filter(message => message.sender_id !== activePeer);
    if (!outsideConversation.length || !summary.unread) return null;
    const newest = outsideConversation[0];
    if (initial && summary.unread > 1) return {
      title: `Imaš ${summary.unread} neprebranih zasebnih sporočil.`, href: "/sporocila",
      messageIds: outsideConversation.map(message => message.id),
    };
    const senders = new Set(outsideConversation.map(message => message.sender_id));
    return {
      title: outsideConversation.length === 1
        ? `Novo zasebno sporočilo od ${newest.sender_name}.`
        : `Prejel si nova zasebna sporočila (${outsideConversation.length}).`,
      href: senders.size === 1 ? `/sporocila?peer=${newest.sender_id}` : "/sporocila",
      messageIds: outsideConversation.map(message => message.id),
    };
  }
}
