export interface PendingPageProps {
  readonly title: string;
  readonly ticket: string;
}

/** Placeholder for screens listed in the PRD but not yet implemented. */
export function PendingPage({ title, ticket }: PendingPageProps) {
  return (
    <section className="card pending">
      <h1>{title}</h1>
      <p>
        This screen is planned but not implemented yet. Tracked as <code>{ticket}</code> in{' '}
        <code>docs/planning/backlog.md</code>.
      </p>
    </section>
  );
}
