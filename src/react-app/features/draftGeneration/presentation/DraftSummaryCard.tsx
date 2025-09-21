import type { DraftSummary } from "@/shared/contracts/draft";

export type DraftSummaryCardProps = {
  draft: DraftSummary;
};

export function DraftSummaryCard({ draft }: DraftSummaryCardProps) {
  const formattedHashtags = draft.hashtags.length > 0 ? draft.hashtags.map((tag) => `#${tag}`).join(" ") : null;

  return (
    <div role="status" className="success">
      <p>ドラフトID: {draft.id}</p>
      <div className="draft-summary">
        {draft.caption && <p>{draft.caption}</p>}
        {formattedHashtags && <p>{formattedHashtags}</p>}
        <dl>
          <div>
            <dt>代替テキスト</dt>
            <dd>{draft.altText}</dd>
          </div>
          <div>
            <dt>生成日時</dt>
            <dd>{new Date(draft.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
