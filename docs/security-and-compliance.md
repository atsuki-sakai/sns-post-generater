# セキュリティとコンプライアンス

## APIセキュリティ
- **認証**: 管理UIからのリクエストにはHMAC署名 (`X-Signature`, `X-Timestamp`) を要求。秘密鍵はWrangler Secretに格納。
- **認可**: ブランドごとのアクセストークンやロールをD1に保持。ミドルウェアでリクエストに含まれる`X-Brand-ID`を検証。
- **レート制限**: `adaptiveRateLimit` ミドルウェアでクライアントごとの呼び出し回数をKVに記録し、VIPユーザーなど tier 毎に閾値調整。
- **CORS**: 指定オリジンのみ許可し、`Authorization` ヘッダを許可に含める。

## データ保護
- Secrets (Meta Access Token, LangSmithキー等) は `wrangler secret put` で登録し、コードには埋め込まない。
- R2 バケットはプライベート設定、必要時のみ署名付きURLを発行。
- D1の個人情報は最小化。レビュアーIDなどはハッシュ化またはUUID化。
- ログにはセンシティブデータ（アクセストークン、個人情報）を記録しない。

## コンプライアンス
- **Instagramポリシー**: Businessアカウントの権限範囲（`instagram_content_publish` など）を最小限に設定。
- **GDPR/個人情報**: レビュアーコメントやユーザー情報は保持期間を定義（例: 90日）。削除要求に応じてKV, D1, R2から削除。
- **著作権**: 画像生成モデルの利用規約を遵守し、必要に応じてクレジット表記をAPIレスポンスに含める。

## インシデント対応
- 失敗や異常検知時にSlack/Webhook通知を送信し、Runbookで初動対応を定義。
- Queueの失敗メッセージはDead Letter Queueに蓄積し、日次でレビュー。
- シークレット漏洩時のローテーション手順を `operations-monitoring-testing.md` に記載。

## 監査
- D1の`publish_logs`と`review_feedback`で監査証跡を保持。
- `LangSmith` にもトレースを残し、誰がどのプロンプトで生成したか追跡可能。
- Cloudflare `Logpush` や `Analytics Engine` を用いてアクセスログを長期保管。

## 攻撃ベクトル対策
- **リクエスト改ざん**: タイムスタンプ検証とシグネチャ照合。5分を超えるリクエストは拒否。
- **リプレイ攻撃**: シグネチャとタイムスタンプの組をKVに保存し、再利用をブロック。
- **CSRF**: APIはCookieレス設計（Bearer/HMAC）。管理UIにはCSRFトークンを使う。
- **ブルートフォース**: レート制限 + Cloudflare Access/WAFの導入を検討。

## コード品質ガードレール
- ESLint + TypeScript `strict` モードで検出。
- `npm run lint -- --fix` をCIで強制。
- セキュリティスキャン（`npm audit`, `pnpm audit`）をリリース前に実施。
